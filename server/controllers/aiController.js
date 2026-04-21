const { sql } = require('../config/db');

const FREE_MODELS = [
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'google/gemma-3-27b-it:free',
  'google/gemma-3-12b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
];

// Primary: Google Gemini (1500 free req/day)
async function callGemini(messages) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '<your_gemini_api_key>') throw new Error('No Gemini key');
  const prompt = messages.map(m => `${m.role === 'system' ? 'System' : 'User'}: ${m.content}`).join('\n');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Gemini error');
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('No content from Gemini');
  return content.trim();
}

// Fallback: OpenRouter free models
async function callOpenRouter(messages) {
  let lastError;
  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://neurodesk.app',
          'X-Title': 'NeuroDesk',
        },
        body: JSON.stringify({ model, messages, max_tokens: 500 }),
      });
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!res.ok || !content) {
        console.log(`Model ${model} failed:`, json.error?.message || 'No content');
        lastError = new Error(json.error?.message || 'No content');
        continue;
      }
      return { content: content.trim(), provider: 'openrouter', model };
    } catch (err) {
      console.log(`Model ${model} error:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

async function callAI(messages) {
  try {
    return await callOpenRouter(messages);
  } catch (err) {
    console.log('OpenRouter failed, trying Gemini:', err.message);
    const content = await callGemini(messages);
    return { content, provider: 'gemini', model: 'gemini-2.0-flash-lite' };
  }
}

// Rule-based fallback when all AI models are unavailable
function ruleBasedResponse(message, memories) {
  const msg = message.toLowerCase();

  // Check if asking about stored memory
  for (const m of memories) {
    if (msg.includes(m.label.toLowerCase()) || msg.includes(m.type.toLowerCase())) {
      return { intent: 'chat', action: 'answer', response: `Your ${m.label} is: ${m.value}`, save: null, record_data: null };
    }
  }

  // Save password/credential
  const saveMatch = msg.match(/(my .+ (?:password|pin|code|number|address|email) is (.+))/i);
  if (saveMatch) {
    const parts = message.split(' is ');
    const label = parts[0].replace(/^my /i, '').trim();
    const value = parts.slice(1).join(' is ').trim();
    return { intent: 'memory', action: 'create', response: `Got it! I've saved your ${label}.`, save: { type: 'other', label, value }, record_data: null };
  }

  // Create task
  if (msg.includes('remind') || msg.includes('todo') || msg.includes('task') || msg.includes('do ')) {
    const title = message.replace(/remind me to|create a task|todo:|task:/gi, '').trim();
    return { intent: 'task', action: 'create', response: `Task created: "${title}"`, save: null, record_data: { title, priority: 'medium' } };
  }

  // Create note
  if (msg.includes('note') || msg.includes('write down') || msg.includes('save this')) {
    const title = message.replace(/note:|write down|save this/gi, '').trim();
    return { intent: 'note', action: 'create', response: `Note saved: "${title}"`, save: null, record_data: { title, content: message, color: 'orange' } };
  }

  return { intent: 'chat', action: 'answer', response: 'AI models are currently rate-limited. Please try again in a few minutes or add credits to your OpenRouter account.', save: null, record_data: null };
}

const processMessage = async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

  if (!process.env.OPENROUTER_API_KEY) {
    return res.json({ intent: 'chat', action: 'answer', response: 'Please add OPENROUTER_API_KEY to your .env file.' });
  }

  try {
    const userId = req.user.id;

    // Fetch user profile name and stored memories
    const [userProfile] = await sql`SELECT name FROM users WHERE id = ${userId}`;
    const userName = userProfile?.name || 'there';

    const memories = await sql`SELECT type, label, value FROM memories WHERE user_id = ${userId}`;
    const memoryContext = memories.length
      ? `User's stored data:\n${memories.map(m => `- ${m.label}: ${m.value} (${m.type})`).join('\n')}`
      : 'No stored data yet.';

    // Build system prompt after we know provider (we'll do a two-step: build prompt with placeholder, replace after AI call)
    const buildSystemPrompt = (provider, modelName) => {
      const identityLine = provider === 'gemini'
        ? `You are NeuroDesk AI powered by Google Gemini (${modelName}), integrated into the NeuroDesk productivity platform.`
        : `You are NeuroDesk AI powered by ${modelName} via OpenRouter, integrated into the NeuroDesk productivity platform.`;

      return `${identityLine} You help users manage tasks, notes, memories, goals, and answer any question.
The user's name is: ${userName}

IDENTITY RULES:
- If asked "who are you" or "what are you": say you are NeuroDesk AI and mention your underlying model (e.g. "I'm NeuroDesk AI, powered by ${modelName} via ${provider === 'gemini' ? 'Google Gemini' : 'OpenRouter'}, integrated into NeuroDesk to help you stay productive.")
- If asked "what is my name" or "who am I": always answer using the user's name from their profile: "${userName}"
- Never say you are ChatGPT or a generic AI assistant.

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
- "my gmail password is abc123" → intent:memory, action:create, response:"Got it! I've saved your Gmail password.", save:{"type":"password","label":"Gmail Password","value":"abc123"}
- "what is my name" → intent:chat, action:answer, response:"Your name is ${userName}!"
- "who are you" → intent:chat, action:answer, response:"I'm NeuroDesk AI, powered by ${modelName} via OpenRouter, here to help you stay organized!"
- "what is 2+2" → intent:chat, action:answer, response:"2+2 = 4"
- "remind me to call mom tomorrow" → intent:task, action:create, response:"Task created!", record_data:{title:"Call mom", priority:"medium"}

Return ONLY valid JSON. No markdown.`;
    };

    let parsed;
    try {
      // First call with a neutral prompt to get provider info
      const aiResult = await callAI([
        { role: 'system', content: buildSystemPrompt('openrouter', 'AI') },
        { role: 'user', content: message },
      ]);
      // Rebuild with actual provider/model and re-call only if identity question, else use result
      const finalPrompt = buildSystemPrompt(aiResult.provider, aiResult.model);
      const isIdentityQ = /who are you|what (model|are you)|your name|what is your/i.test(message);
      let raw = aiResult.content;
      if (isIdentityQ) {
        const refined = await callAI([
          { role: 'system', content: finalPrompt },
          { role: 'user', content: message },
        ]);
        raw = refined.content;
      }
      const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (aiErr) {
      console.log('All AI models failed, using rule-based fallback:', aiErr.message);
      parsed = ruleBasedResponse(message, memories);
    }

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
    try {
      const raw = await callAI([
        { role: 'system', content: 'Give 3 short actionable productivity suggestions. Return ONLY a JSON array of 3 strings, no markdown.' },
        { role: 'user', content: `Tasks: ${JSON.stringify(tasks)}, Goals: ${JSON.stringify(goals)}` },
      ]);
      const suggestions = JSON.parse(raw.replace(/^```json\n?/, '').replace(/\n?```$/, ''));
      res.json({ suggestions });
    } catch {
      // Fallback static suggestions when AI is unavailable
      res.json({ suggestions: [
        'Review and prioritize your pending tasks',
        'Break large goals into smaller actionable steps',
        'Set a focused work session for your top priority task',
      ]});
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { processMessage, getSuggestions };
