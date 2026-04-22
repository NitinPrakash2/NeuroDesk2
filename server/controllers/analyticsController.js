const { sql } = require('../config/db');

// AI caller: Groq → Gemini → OpenRouter
async function callAI(messages) {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (GROQ_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 300 }),
      });
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (res.ok && content) { console.log('Analytics: Groq succeeded'); return content.trim(); }
      console.log('Analytics: Groq failed:', json.error?.message);
    } catch (e) { console.log('Analytics: Groq error:', e.message); }
  }
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (GEMINI_KEY) {
    const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    for (const model of geminiModels) {
      try {
        const systemMsg = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');
        const contents = userMessages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
        const body = { contents, generationConfig: { maxOutputTokens: 300, temperature: 0.7 } };
        if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (res.ok && content) { console.log(`Analytics: Gemini ${model} succeeded`); return content.trim(); }
        console.log(`Analytics: Gemini ${model} failed:`, json.error?.message);
      } catch (e) { console.log(`Analytics: Gemini ${model} error:`, e.message); }
    }
  }
  const OR_KEY = process.env.OPENROUTER_API_KEY;
  if (OR_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OR_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://neurodesk.app', 'X-Title': 'NeuroDesk' },
        body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct:free', messages, max_tokens: 300 }),
      });
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (res.ok && content) { console.log('Analytics: OpenRouter succeeded'); return content.trim(); }
    } catch (e) { console.log('Analytics: OpenRouter error:', e.message); }
  }
  return null;
}

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // ── Fetch raw data ──────────────────────────────────────────────
    const [tasks, goals, notes, memories] = await Promise.all([
      sql`SELECT id, title, status, priority, created_at, due_date FROM tasks WHERE user_id = ${userId} ORDER BY created_at ASC`,
      sql`SELECT id, title, progress, status, start_date, end_date, duration, ai_plan FROM goals WHERE user_id = ${userId}`,
      sql`SELECT id, created_at FROM notes WHERE user_id = ${userId}`,
      sql`SELECT id FROM memories WHERE user_id = ${userId}`,
    ]);

    // ── Overview stats ──────────────────────────────────────────────
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const productivityPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    // ── Weekly graph (last 7 days) ──────────────────────────────────
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayStr = day.toISOString().split('T')[0];
      const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' });

      const created = tasks.filter(t => t.created_at?.toISOString?.()?.startsWith(dayStr) || String(t.created_at).startsWith(dayStr)).length;
      const completed = tasks.filter(t => {
        // count tasks that were completed (we use created_at as proxy since no updated_at)
        return t.status === 'completed' && (t.created_at?.toISOString?.()?.startsWith(dayStr) || String(t.created_at).startsWith(dayStr));
      }).length;
      const notesCreated = notes.filter(n => n.created_at?.toISOString?.()?.startsWith(dayStr) || String(n.created_at).startsWith(dayStr)).length;

      weeklyData.push({ day: dayLabel, date: dayStr, created, completed, notes: notesCreated });
    }

    // ── Streak calculation ──────────────────────────────────────────
    // A day counts if at least 1 task was created or completed that day
    const activityDays = new Set();
    tasks.forEach(t => {
      const d = String(t.created_at).split('T')[0];
      if (d) activityDays.add(d);
    });
    notes.forEach(n => {
      const d = String(n.created_at).split('T')[0];
      if (d) activityDays.add(d);
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const checkDay = new Date(now);
    // Check today first, if no activity today start from yesterday
    const todayStr = now.toISOString().split('T')[0];
    if (!activityDays.has(todayStr)) checkDay.setDate(checkDay.getDate() - 1);

    for (let i = 0; i < 365; i++) {
      const d = checkDay.toISOString().split('T')[0];
      if (activityDays.has(d)) {
        currentStreak++;
        checkDay.setDate(checkDay.getDate() - 1);
      } else break;
    }

    // Longest streak
    const sortedDays = [...activityDays].sort();
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) { tempStreak = 1; continue; }
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) { tempStreak++; }
      else { tempStreak = 1; }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }
    if (currentStreak > longestStreak) longestStreak = currentStreak;

    // ── Goal analytics ──────────────────────────────────────────────
    const goalAnalytics = goals.map(g => {
      let daysLeft = null;
      let timeProgress = 0;
      let expectedProgress = 0;
      let isOnTrack = true;

      if (g.end_date && g.start_date) {
        const start = new Date(g.start_date);
        const end = new Date(g.end_date);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const elapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
        daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        timeProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
        expectedProgress = timeProgress;
        isOnTrack = (g.progress || 0) >= expectedProgress - 15;
      }

      let stepsTotal = 0;
      let stepsCompleted = 0;
      if (g.ai_plan) {
        try {
          const steps = JSON.parse(g.ai_plan);
          stepsTotal = steps.length;
          stepsCompleted = steps.filter(s => s.completed).length;
        } catch (_) {}
      }

      return {
        id: g.id,
        title: g.title,
        progress: g.progress || 0,
        status: g.status,
        duration: g.duration,
        daysLeft,
        timeProgress,
        expectedProgress,
        isOnTrack,
        stepsTotal,
        stepsCompleted,
      };
    });

    // ── Priority breakdown ──────────────────────────────────────────
    const priorityBreakdown = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    // ── This week vs last week ──────────────────────────────────────
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);

    const thisWeekCompleted = tasks.filter(t => t.status === 'completed' && new Date(t.created_at) >= weekStart).length;
    const lastWeekCompleted = tasks.filter(t => t.status === 'completed' && new Date(t.created_at) >= lastWeekStart && new Date(t.created_at) < weekStart).length;
    const weeklyChange = lastWeekCompleted > 0 ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100) : (thisWeekCompleted > 0 ? 100 : 0);

    // ── AI Insights ─────────────────────────────────────────────────
    const statsForAI = {
      totalTasks, completedTasks, pendingTasks, productivityPct,
      currentStreak, activeGoals, completedGoals,
      thisWeekCompleted, lastWeekCompleted, weeklyChange,
      goalsOnTrack: goalAnalytics.filter(g => g.isOnTrack).length,
      goalsBehind: goalAnalytics.filter(g => !g.isOnTrack && g.status === 'active').length,
    };

    let aiInsights = [];
    try {
      const aiRaw = await callAI([
        {
          role: 'system',
          content: 'You are a productivity coach. Based on user stats, give exactly 3 short, specific, actionable insights. Return ONLY a JSON array of 3 strings. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: `User stats: ${JSON.stringify(statsForAI)}. Generate 3 personalized insights.`,
        },
      ]);
      if (aiRaw) {
        const match = aiRaw.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) aiInsights = parsed.slice(0, 3);
        }
      }
    } catch (_) {}

    // Fallback insights if AI fails
    if (aiInsights.length === 0) {
      if (productivityPct >= 70) aiInsights.push(`Great job! You've completed ${productivityPct}% of your tasks. Keep the momentum going! 🔥`);
      else if (productivityPct >= 40) aiInsights.push(`You're at ${productivityPct}% productivity. Try completing 2-3 pending tasks today to boost your score.`);
      else aiInsights.push(`Your productivity is at ${productivityPct}%. Start with your easiest pending task to build momentum.`);

      if (currentStreak >= 3) aiInsights.push(`You're on a ${currentStreak}-day streak! Consistency is your superpower. Don't break the chain! 🔥`);
      else aiInsights.push(`Build a daily habit — even completing 1 task a day creates a powerful streak.`);

      const behindGoal = goalAnalytics.find(g => !g.isOnTrack && g.status === 'active');
      if (behindGoal) aiInsights.push(`Your goal "${behindGoal.title}" is behind schedule. Focus on it today — you're at ${behindGoal.progress}% but should be at ~${behindGoal.expectedProgress}%.`);
      else if (activeGoals > 0) aiInsights.push(`All your active goals are on track! Review your next steps and keep pushing forward. 🎯`);
      else aiInsights.push(`Set a long-term goal to give your daily tasks more purpose and direction.`);
    }

    res.json({
      overview: { totalTasks, completedTasks, pendingTasks, productivityPct, activeGoals, completedGoals, totalNotes: notes.length, totalMemories: memories.length },
      weeklyData,
      streak: { current: currentStreak, longest: longestStreak },
      goalAnalytics,
      priorityBreakdown,
      weeklyReport: { thisWeekCompleted, lastWeekCompleted, weeklyChange },
      aiInsights,
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAnalytics };
