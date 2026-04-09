const { sql } = require('../config/db');

const FREE_MODELS = [
  'liquid/lfm-2.5-1.2b-instruct:free',
  'openrouter/free',
];

async function callOpenRouter(messages) {
  let lastError;
  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages }),
      });
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!res.ok || !content) {
        lastError = new Error(json.error?.message || 'No content');
        continue;
      }
      return content.trim();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

const processMessage = async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

  if (!process.env.OPENROUTER_API_KEY) {
    return res.json({ intent: 'chat', action: 'answer', response: 'Please add OPENROUTER_API_KEY to your .env file.' });
  }

  try {
    const userId = req.user.id;

    // Fetch user's stored memories so AI can answer "what is my password" etc.
    const memories = await sql`SELECT type, label, value FROM memories WHERE user_id = ${userId}`;
    const memoryContext = memories.length
      ? `User's stored data:\n${memories.map(m => `- ${m.label}: ${m.value} (${m.type})`).join('\n')}`
      : 'No stored data yet.';

    const systemPrompt = `You are NeuroDesk AI, a smart personal productivity assistant. You help users manage tasks, notes, memories, goals, and answer any question.

${memoryContext}

Analyze the user message and decide:
1. If it contains something to SAVE (password, phone number, address, reminder, fact, credential, any personal info) → extract and save it
2. If it's asking about stored data (what is my password, what is my phone number) → answer from the stored data above
3. If it's a general question or conversation → answer it directly and helpfully

Always respond in this exact JSON format:
{
  "intent": "task|note|memory|goal|chat",
  "action": "create|answer",
  "response": "your full helpful answer to show the user",
  "save": null or { "type": "password|reminder|fact|contact|date|other", "label": "descriptive label", "value": "the value to store" },
  "record_data": null or { "title": "...", "description": "...", "priority": "low|medium|high", "due_date": null, "content": "...", "color": "orange" }
}

Examples:
- "my gmail password is abc123" → action:create, intent:memory, response:"Got it! I've saved your Gmail password.", save:{"type":"password","label":"Gmail Password","value":"abc123"}
- "what is my password" → action:answer, intent:chat, response:"Your Gmail password is abc123" (from stored data)
- "who are you" → action:answer, intent:chat, response:"I'm NeuroDesk AI, your personal productivity assistant powered by OpenRouter..."
- "what is 2+2" → action:answer, intent:chat, response:"2+2 = 4"
- "remind me to call mom tomorrow" → action:create, intent:task, response:"Task created!", record_data:{title:"Call mom", priority:"medium"}
- "how are you" → action:answer, intent:chat, response:"I'm just a bunch of code, but I'm here to help you be productive!"

Return ONLY valid JSON. No markdown.`;

    const raw = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    // Parse JSON — strip markdown fences if any
    const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonStr);

    let savedRecord = null;

    // Auto-save memory if AI detected something to store
    if (parsed.save) {
      const { type, label, value } = parsed.save;
      const [memory] = await sql`
        INSERT INTO memories (user_id, type, label, value, raw_input)
        VALUES (${userId}, ${type}, ${label}, ${value}, ${message})
        ON CONFLICT DO NOTHING
        RETURNING *`;
      savedRecord = memory;
    }

    // Save task if detected
    if (parsed.intent === 'task' && parsed.action === 'create' && parsed.record_data) {
      const { title, description, priority, due_date } = parsed.record_data;
      const [task] = await sql`
        INSERT INTO tasks (user_id, title, description, priority, due_date, source)
        VALUES (${userId}, ${title}, ${description || null}, ${priority || 'medium'}, ${due_date || null}, 'ai')
        RETURNING *`;
      savedRecord = task;
    }

    // Save note if detected
    if (parsed.intent === 'note' && parsed.action === 'create' && parsed.record_data) {
      const { title, content, color } = parsed.record_data;
      const [note] = await sql`
        INSERT INTO notes (user_id, title, content, color, source)
        VALUES (${userId}, ${title}, ${content || null}, ${color || 'orange'}, 'ai')
        RETURNING *`;
      savedRecord = note;
    }

    // Save goal if detected
    if (parsed.intent === 'goal' && parsed.action === 'create' && parsed.record_data) {
      const { title, description } = parsed.record_data;
      const [goal] = await sql`
        INSERT INTO goals (user_id, title, description)
        VALUES (${userId}, ${title}, ${description || null})
        RETURNING *`;
      savedRecord = goal;
    }

    res.json({
      intent: parsed.intent || 'chat',
      action: parsed.action || 'answer',
      message: parsed.response,
      response: parsed.response,
      record: savedRecord,
    });

  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).json({
      message: 'AI processing failed.',
      error: err.message,
      response: 'Sorry, I ran into an error. Please try again.',
    });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const tasks = await sql`SELECT title, status, priority FROM tasks WHERE user_id = ${req.user.id} LIMIT 10`;
    const goals = await sql`SELECT title, progress FROM goals WHERE user_id = ${req.user.id} LIMIT 5`;
    const raw = await callOpenRouter([
      { role: 'system', content: 'Give 3 short actionable productivity suggestions. Return ONLY a JSON array of 3 strings, no markdown.' },
      { role: 'user', content: `Tasks: ${JSON.stringify(tasks)}, Goals: ${JSON.stringify(goals)}` },
    ]);
    res.json({ suggestions: JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, '')) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { processMessage, getSuggestions };
