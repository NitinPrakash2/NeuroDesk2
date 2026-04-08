const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sql } = require('../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Master prompt that turns natural language into structured actions
const SYSTEM_PROMPT = `You are NeuroDesk AI, a personal productivity assistant. 
Analyze the user's message and return a JSON object with this exact structure:

{
  "intent": "task" | "note" | "memory" | "goal" | "query" | "chat",
  "action": "create" | "list" | "delete" | "update" | "answer",
  "data": {
    // For task: { title, description, priority ("low"|"medium"|"high"), due_date (ISO string or null) }
    // For note: { title, content, color ("orange"|"green"|"blue"|"purple"|"pink") }
    // For memory: { type ("password"|"reminder"|"fact"|"contact"|"date"|"other"), label, value }
    // For goal: { title, description }
    // For query/chat: { response (your helpful answer as a string) }
  },
  "message": "A short friendly confirmation message to show the user"
}

Rules:
- If user says "remind me to X at Y" → intent: task, extract title and due_date
- If user says "my X is Y" or "remember that X" → intent: memory, extract type/label/value
- If user says "I want to achieve X" or "my goal is X" → intent: goal
- If user asks a question → intent: query, action: answer, put your answer in data.response
- If it's just conversation → intent: chat, action: answer
- Always return valid JSON only. No markdown, no explanation outside JSON.`;

const processMessage = async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

  try {
    // 1. Ask Gemini to classify and extract structured data
    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUser message: "${message}"`);
    const raw = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps in ```json
    const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(jsonStr);

    const userId = req.user.id;
    let savedRecord = null;

    // 2. Execute the detected action automatically
    if (parsed.action === 'create') {
      if (parsed.intent === 'task') {
        const { title, description, priority, due_date } = parsed.data;
        const [task] = await sql`
          INSERT INTO tasks (user_id, title, description, priority, due_date, source)
          VALUES (${userId}, ${title}, ${description || null}, ${priority || 'medium'}, ${due_date || null}, 'ai')
          RETURNING *
        `;
        savedRecord = task;
      } else if (parsed.intent === 'note') {
        const { title, content, color } = parsed.data;
        const [note] = await sql`
          INSERT INTO notes (user_id, title, content, color, source)
          VALUES (${userId}, ${title}, ${content || null}, ${color || 'orange'}, 'ai')
          RETURNING *
        `;
        savedRecord = note;
      } else if (parsed.intent === 'memory') {
        const { type, label, value } = parsed.data;
        const [memory] = await sql`
          INSERT INTO memories (user_id, type, label, value, raw_input)
          VALUES (${userId}, ${type}, ${label}, ${value}, ${message})
          RETURNING *
        `;
        savedRecord = memory;
      } else if (parsed.intent === 'goal') {
        const { title, description } = parsed.data;
        // Generate an AI step-by-step plan for the goal
        const planResult = await model.generateContent(
          `Create a concise 5-step action plan for this goal: "${title}". Return as a JSON array of strings only.`
        );
        const planRaw = planResult.response.text().trim()
          .replace(/^```json\n?/, '').replace(/\n?```$/, '');
        const [goal] = await sql`
          INSERT INTO goals (user_id, title, description, ai_plan)
          VALUES (${userId}, ${title}, ${description || null}, ${planRaw})
          RETURNING *
        `;
        savedRecord = goal;
      }
    }

    res.json({
      intent: parsed.intent,
      action: parsed.action,
      message: parsed.message,
      response: parsed.data?.response || null,
      record: savedRecord,
    });
  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).json({ message: 'AI processing failed', error: err.message });
  }
};

// Get AI-generated productivity suggestions based on user's data
const getSuggestions = async (req, res) => {
  try {
    const tasks = await sql`SELECT title, status, priority FROM tasks WHERE user_id = ${req.user.id} LIMIT 10`;
    const goals = await sql`SELECT title, progress FROM goals WHERE user_id = ${req.user.id} LIMIT 5`;

    const context = `Tasks: ${JSON.stringify(tasks)}\nGoals: ${JSON.stringify(goals)}`;
    const result = await model.generateContent(
      `Based on this user's data, give 3 short actionable productivity suggestions. Return as JSON array of strings.\n\n${context}`
    );
    const raw = result.response.text().trim()
      .replace(/^```json\n?/, '').replace(/\n?```$/, '');
    res.json({ suggestions: JSON.parse(raw) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { processMessage, getSuggestions };
