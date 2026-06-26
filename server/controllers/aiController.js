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

// Groq API
async function callGroq(messages) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === '<your_groq_api_key>') throw new Error('No Groq key');

  const groqModels = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'mistral-saba-24b',
  ];

  let lastError;
  for (const model of groqModels) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, max_tokens: 500 }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errorMsg = json.error?.message || 'Groq error';
        console.log(`Groq model ${model} failed:`, errorMsg);
        // Check for rate limit errors
        if (res.status === 429 || errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota')) {
          lastError = new Error('RATE_LIMIT: ' + errorMsg);
          break; // Stop trying other Groq models, switch provider
        }
        lastError = new Error(errorMsg);
        continue;
      }
      const content = json.choices?.[0]?.message?.content;
      if (!content) { lastError = new Error('No content from Groq'); continue; }
      console.log(`Groq model ${model} succeeded`);
      return { content: content.trim(), provider: 'groq', model };
    } catch (err) {
      console.log(`Groq model ${model} error:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

// Google Gemini Flash
async function callGemini(messages) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '<your_gemini_api_key>') throw new Error('No Gemini key');

  // Separate system prompt and conversation messages
  const systemMsg = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  // Build contents array for Gemini format
  const contents = userMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
  };

  // Add system instruction if present
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

  let lastError;
  for (const model of geminiModels) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        const errorMsg = json.error?.message || 'Gemini error';
        console.log(`Gemini ${model} failed:`, errorMsg);
        // Check for rate limit errors
        if (res.status === 429 || errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('resource_exhausted')) {
          lastError = new Error('RATE_LIMIT: ' + errorMsg);
          break; // Stop trying other Gemini models, switch provider
        }
        lastError = new Error(errorMsg);
        continue;
      }
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) { lastError = new Error('No content from Gemini'); continue; }
      console.log(`Gemini ${model} succeeded`);
      return { content: content.trim(), provider: 'gemini', model };
    } catch (err) {
      console.log(`Gemini ${model} error:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
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
        const errorMsg = json.error?.message || 'No content';
        console.log(`Model ${model} failed:`, errorMsg);
        // Check for rate limit errors
        if (res.status === 429 || errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota')) {
          lastError = new Error('RATE_LIMIT: ' + errorMsg);
          continue; // Try next model
        }
        lastError = new Error(errorMsg);
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

// Mistral AI
async function callMistral(messages) {
  if (!process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY === '<your_mistral_api_key>') throw new Error('No Mistral key');

  const mistralModels = [
    'mistral-large-latest',
    'mistral-small-latest',
    'open-mistral-7b',
  ];

  let lastError;
  for (const model of mistralModels) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, max_tokens: 500 }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errorMsg = json.error?.message || 'Mistral error';
        console.log(`Mistral model ${model} failed:`, errorMsg);
        // Check for rate limit errors
        if (res.status === 429 || errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('quota')) {
          lastError = new Error('RATE_LIMIT: ' + errorMsg);
          break; // Stop trying other Mistral models, switch provider
        }
        lastError = new Error(errorMsg);
        continue;
      }
      const content = json.choices?.[0]?.message?.content;
      if (!content) { lastError = new Error('No content from Mistral'); continue; }
      console.log(`Mistral model ${model} succeeded`);
      return { content: content.trim(), provider: 'mistral', model };
    } catch (err) {
      console.log(`Mistral model ${model} error:`, err.message);
      lastError = err;
    }
  }
  throw lastError;
}

async function callAI(messages) {
  try {
    return await callGemini(messages);
  } catch (geminiErr) {
    console.log('Gemini failed, trying Groq:', geminiErr.message);
    try {
      return await callGroq(messages);
    } catch (groqErr) {
      console.log('Groq failed, trying Mistral:', groqErr.message);
      try {
        return await callMistral(messages);
      } catch (mistralErr) {
        console.log('Mistral failed, trying OpenRouter:', mistralErr.message);
        return await callOpenRouter(messages);
      }
    }
  }
}

// Rule-based fallback when all AI models are unavailable
function ruleBasedResponse(message, memories, notes, tasks, files, goals = []) {
  const msg = message.toLowerCase();

  // Check if asking about goals
  if (msg.includes('goal') || msg.includes('mera goal') || msg.includes('goals') || msg.includes('target') || msg.includes('aim')) {
    if (goals.length > 0) {
      const goalList = goals.map(g => {
        let deadline = '';
        if (g.end_date) {
          const daysLeft = Math.ceil((new Date(g.end_date) - new Date()) / (1000 * 60 * 60 * 24));
          deadline = ` (${daysLeft > 0 ? daysLeft + ' days left' : 'overdue'})`;
        }
        return `"${g.title}" — ${g.progress}% done${deadline}`;
      }).join(', ');
      return { intent: 'chat', action: 'answer', response: `Tere ${goals.length} goals hain: ${goalList} 🎯`, save: null, record_data: null };
    }
    return { intent: 'chat', action: 'answer', response: 'Abhi koi goal set nahi hai. Goals page par ja aur apna pehla goal add kar! 🎯', save: null, record_data: null };
  }

  // Check if asking about stored memory
  for (const m of memories) {
    if (msg.includes(m.label.toLowerCase()) || msg.includes(m.type.toLowerCase())) {
      return { intent: 'chat', action: 'answer', response: `Your ${m.label} is: ${m.value}`, save: null, record_data: null };
    }
  }

  // Check if asking about notes
  for (const n of notes) {
    if (msg.includes(n.title.toLowerCase()) || (n.content && msg.includes(n.content.toLowerCase().substring(0, 20)))) {
      return { intent: 'chat', action: 'answer', response: `From your notes: ${n.content || n.title} 📝`, save: null, record_data: null };
    }
  }

  // Check if asking about tasks
  if (msg.includes('task') || msg.includes('kaam') || msg.includes('pending') || msg.includes('do') || msg.includes('karna')) {
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length > 0) {
      const taskList = pendingTasks.slice(0, 5).map(t => t.title).join(', ');
      return { intent: 'chat', action: 'answer', response: `You have ${pendingTasks.length} pending tasks: ${taskList} 📊`, save: null, record_data: null };
    }
  }

  // Check if asking about files
  if (msg.includes('file') || msg.includes('document') || msg.includes('pdf')) {
    for (const f of files) {
      if (msg.includes(f.name.toLowerCase()) || (f.content && msg.includes(f.content.toLowerCase().substring(0, 20)))) {
        return { intent: 'chat', action: 'answer', response: `From ${f.name}: ${f.content?.substring(0, 200)}... 📄`, save: null, record_data: null };
      }
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

  // Create goal — Hinglish + English goal detection
  const goalKeywords = [
    'mera goal', 'mujhe', 'i want to', 'i want to become', 'i want to learn', 'my goal is',
    'banana hai', 'banna chahta', 'banna chahti', 'clear karna hai', 'clear krna h', 'clear krni h',
    'ki taiyari', 'taiyari krni', 'taiyari karni', 'seekhna hai', 'sikhna hai',
    'achieve karna', 'ban jaana', 'ban jaun', 'crack karna', 'crack krna',
    'pass karna', 'qualify karna', 'job chahiye', 'career banana',
  ];
  const hasGoalKeyword = goalKeywords.some(k => msg.includes(k));
  if (hasGoalKeyword) {
    // Extract duration
    const durMatch = message.match(/(\d+)\s*(shaal|saal|year|month|mahine|mahina|week|hafte|hafta|day|din)s?/i);
    let duration = null;
    if (durMatch) {
      const num = durMatch[1];
      const unit = durMatch[2].toLowerCase();
      if (['shaal','saal','year'].includes(unit)) duration = `${num} year`;
      else if (['mahine','mahina','month'].includes(unit)) duration = `${num} month`;
      else if (['hafte','hafta','week'].includes(unit)) duration = `${num} week`;
      else if (['din','day'].includes(unit)) duration = `${num} day`;
    }
    // Extract a clean title from common patterns
    let title = message.trim();
    const cleanPatterns = [
      { re: /upsc/i, title: 'UPSC Clear' + (duration ? ` in ${duration}` : '') },
      { re: /neet/i, title: 'Crack NEET Exam' },
      { re: /jee/i, title: 'Crack JEE Exam' },
      { re: /ssc/i, title: 'Crack SSC Exam' },
      { re: /ias/i, title: 'Become IAS Officer' },
      { re: /doctor|mbbs/i, title: 'Become a Doctor' },
      { re: /engineer/i, title: 'Become an Engineer' },
      { re: /ai|ml|machine learning/i, title: 'Become AI/ML Engineer' },
      { re: /web dev|frontend|react/i, title: 'Become Web Developer' },
      { re: /data science/i, title: 'Become Data Scientist' },
      { re: /python/i, title: 'Learn Python Programming' },
      { re: /english/i, title: 'Improve English Skills' },
      { re: /fitness|gym|weight/i, title: 'Achieve Fitness Goal' },
    ];
    for (const p of cleanPatterns) {
      if (p.re.test(message)) { title = p.title; break; }
    }
    return {
      intent: 'goal', action: 'create',
      response: `Goal set kar diya bhai! 🎯 "${title}" — Goals page par ja ke apna AI roadmap dekh!`,
      save: null,
      record_data: { title, description: message, duration },
    };
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

    // Save user message to DB
    await sql`INSERT INTO chat_history (user_id, role, content) VALUES (${userId}, 'user', ${message.trim()})`;

    // Fetch last 6 turns for AI context
    const dbHistory = await sql`
      SELECT role, content FROM chat_history
      WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT 6
    `.then(rows => rows.reverse());

    const [userProfile] = await sql`SELECT name FROM users WHERE id = ${userId}`;
    const userName = userProfile?.name || 'there';

    const memories = await sql`SELECT id, type, label, value FROM memories WHERE user_id = ${userId}`;
    const memoryContext = memories.length
      ? `User's stored data:\n${memories.map(m => `- ${m.label}: ${m.value} (${m.type})`).join('\n')}`
      : 'No stored data yet.';

    // Fetch user's notes for context
    const notes = await sql`SELECT title, content, color FROM notes WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50`;
    const notesContext = notes.length
      ? `User's saved notes:\n${notes.map(n => `- ${n.title}: ${n.content}`).join('\n')}`
      : 'No notes saved yet.';

    // Fetch user's tasks for context
    const tasks = await sql`SELECT title, description, priority, status, due_date FROM tasks WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50`;
    const tasksContext = tasks.length
      ? `User's tasks:\n${tasks.map(t => `- ${t.title}${t.description ? ': ' + t.description : ''} [${t.status}, ${t.priority} priority]`).join('\n')}`
      : 'No tasks yet.';

    // Fetch user's files for context - FULL CONTENT for better answers
    const files = await sql`SELECT name, type, content, summary, important_points FROM files WHERE user_id = ${userId} AND content IS NOT NULL ORDER BY created_at DESC LIMIT 20`;
    const filesContext = files.length
      ? `User's uploaded files (notes/documents):\n${files.map(f => {
          let fileInfo = `\n📄 FILE: ${f.name} (${f.type})`;
          if (f.summary) fileInfo += `\n📝 SUMMARY: ${f.summary}`;
          if (f.important_points) {
            const points = JSON.parse(f.important_points);
            fileInfo += `\n✨ KEY POINTS:\n${points.map((p, i) => `  ${i+1}. ${p}`).join('\n')}`;
          }
          fileInfo += `\n📖 CONTENT:\n${f.content?.substring(0, 3000)}...`;
          return fileInfo;
        }).join('\n\n')}`
      : 'No files uploaded yet.';

    // Fetch analytics context
    const [analyticsRow] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days') as last_week
      FROM tasks WHERE user_id = ${userId}`;
    const prodPct = analyticsRow.total > 0 ? Math.round((analyticsRow.completed / analyticsRow.total) * 100) : 0;
    const analyticsContext = `User's analytics summary: ${analyticsRow.completed}/${analyticsRow.total} tasks completed (${prodPct}% productivity), ${analyticsRow.pending} pending. This week: ${analyticsRow.this_week} completed, last week: ${analyticsRow.last_week} completed.`;

    // Fetch user's goals for context
    const goalsData = await sql`SELECT title, description, progress, status, duration, start_date, end_date FROM goals WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 10`;
    const goalsContext = goalsData.length
      ? `User's goals:\n${goalsData.map(g => {
          let deadline = '';
          if (g.end_date) {
            const daysLeft = Math.ceil((new Date(g.end_date) - new Date()) / (1000 * 60 * 60 * 24));
            deadline = ` | ${daysLeft > 0 ? daysLeft + ' days left' : Math.abs(daysLeft) + ' days overdue'}`;
          }
          return `- "${g.title}" [${g.status}, ${g.progress}% done${g.duration ? ', ' + g.duration : ''}${deadline}]`;
        }).join('\n')}`
      : 'No goals set yet.';

    const buildSystemPrompt = (provider, modelName) => {
      let providerLabel;
      if (provider === 'gemini') {
        providerLabel = `Google Gemini (${modelName})`;
      } else if (provider === 'groq') {
        providerLabel = `${modelName} via Groq`;
      } else if (provider === 'mistral') {
        providerLabel = `Mistral AI (${modelName})`;
      } else {
        providerLabel = `${modelName} via OpenRouter`;
      }
      
      return `You are NeuroDesk AI — a friendly, smart personal assistant integrated into the NeuroDesk app. You are powered by ${providerLabel}.

The user's name is: ${userName}
Today's date: ${new Date().toDateString()}

YOUR PERSONALITY:
- Talk like a real friend — warm, casual, natural, and helpful
- Use the user's name occasionally to make it personal
- Keep responses concise but complete — not too short, not too long
- Use light humor when appropriate, be empathetic when needed
- Never sound robotic or overly formal
- If someone says "hi", "hey", "hello" — greet them back warmly by name
- If someone asks "how are you" — respond naturally and ask them back
- If someone is stressed or venting — be supportive first, then offer help

LANGUAGE DETECTION — very important:
- If the user writes in Hindi or Hinglish (mix of Hindi + English) — ALWAYS reply in the same Hinglish style, casual and natural like a desi friend
- Match their vibe: if they say "bhai", reply with "bhai"; if they say "yaar", reply with "yaar"
- Use common Hinglish words naturally: bhai, yaar, arre, haan, nahi, kya, matlab, sahi hai, bilkul, chill kar, tension mat le, ekdum, mast, bas, thoda, batao, samjha, dekh
- For academic topics in Hinglish — explain in simple Hinglish, mix Hindi and English naturally
- If they write in pure Hindi — reply in Hindi
- If they write in English — reply in English
- Never switch language unless the user switches first

TYPO & SPELLING CORRECTION — very important:
- Users often type fast and make spelling mistakes in both English and Hinglish — ALWAYS try to understand what they meant, never say "I don't understand"
- English typo examples to auto-correct and understand:
  "pasword" → password, "phisics" → physics, "chemestry" → chemistry, "matsh" → maths, "remider" → reminder, "tast" → task, "joek" → joke, "wether" → weather, "recepie" → recipe, "motivetion" → motivation, "schedual" → schedule, "calander" → calendar, "adress" → address
- Hinglish typo examples to auto-correct and understand:
  "pasword" → password, "nuwton" → newton, "fisics" → physics, "kemistry" → chemistry, "mujko" → mujhe, "btao" → batao, "kr" → kar, "kro" → karo, "ho" → hoon, "kya hal h" → kya haal hai, "thik" → theek, "kal krna h" → kal karna hai, "yaad dila" → remind me, "sev kr" → save kar, "pswd" → password, "num" → number, "msg" → message
- Short forms and abbreviations to understand:
  "u" → you, "r" → are, "ur" → your, "plz/pls" → please, "thx/ty" → thanks, "btw" → by the way, "idk" → I don't know, "omg" → oh my god, "lol" → laughing, "ngl" → not gonna lie, "tbh" → to be honest, "asap" → as soon as possible, "brb" → be right back, "imo" → in my opinion, "fyi" → for your information
- If a message is very unclear even after guessing — make your best guess and reply, optionally add "(samjha maine ye... sahi hai na?)" in Hinglish or "(I think you meant... right?)" in English

DAILY CONVERSATION — handle naturally:
- Greetings: hey, hi, hello, good morning, good night, wassup
- Feelings: tired, bored, happy, sad, stressed, anxious, excited, angry, lonely
- Small talk: how's the weather, what should I eat, I can't sleep, I'm hungry
- Motivation: I feel lazy, I can't focus, give me motivation, I want to give up
- Fun: tell me a joke, roast me, say something funny, play a game, fun fact
- Advice: what should I do, help me decide, give me tips, suggest something
- Compliments/insults to you: respond with humor and confidence
- Goodbyes: bye, see you, good night, take care — respond warmly

ACADEMIC & KNOWLEDGE — answer accurately and clearly:
- PHYSICS: Newton's laws, thermodynamics, optics, electricity, quantum, relativity, formulas, numerical problems
- CHEMISTRY: periodic table, reactions, bonds, acids/bases, organic chemistry, equations, balancing
- MATHEMATICS: algebra, calculus, geometry, trigonometry, statistics, step-by-step problem solving
- BIOLOGY: cells, DNA, human body, ecosystems, evolution
- CODING: explain code, debug, write functions in any language
- HISTORY & GEOGRAPHY: world events, countries, capitals, wars, civilizations
- CURRENT AFFAIRS (up to your knowledge cutoff): world news, politics, sports, technology, science breakthroughs, economy, AI trends, space exploration, climate
- For current affairs beyond your knowledge: honestly say "My knowledge has a cutoff, so I may not have the latest on this, but here's what I know..."
- GENERAL KNOWLEDGE: facts, trivia, definitions, how things work, why things happen

IDENTITY:
- If asked who you are: "I'm NeuroDesk AI, powered by ${provider === 'gemini' ? 'Google Gemini' : provider === 'groq' ? 'Groq' : provider === 'mistral' ? 'Mistral AI' : 'OpenRouter'}, your personal assistant built right into NeuroDesk!"
- If asked what model or which AI: "I'm ${provider === 'gemini' ? 'Google Gemini' : provider === 'groq' ? 'Groq' : provider === 'mistral' ? 'Mistral AI' : 'OpenRouter'} — your smart assistant in NeuroDesk!"
- NEVER reveal exact technical model names like llama-3.3-70b-versatile, mistral-large-latest, gemini-2.5-flash, etc. — only say the provider name
- If asked user's name: always say "${userName}" (from their profile)
- Never claim to be ChatGPT, Claude, or any other product

${analyticsContext}

${memoryContext}

${notesContext}

${tasksContext}

${filesContext}

${goalsContext}

ACTIONS — detect and handle automatically (works in English AND Hinglish):
1. SAVE info — detect keywords: "password", "number", "address", "account", "pin", "id", "pasword hai", "ka password", "mera number", "save kar", "note kar", "yaad rakh" → extract label+value and save to memory
   CRITICAL LABEL RULES:
   - If user mentions "10th" related info → label MUST start with "10th" (e.g. "10th Roll Number", "10th Passing Year", "10th Percentage", "10th Marks")
   - If user mentions "12th" related info → label MUST start with "12th" (e.g. "12th Roll Number", "12th Passing Year", "12th Percentage")
   - If user mentions "Gmail" → label MUST start with "Gmail" (e.g. "Gmail Password", "Gmail Recovery Email")
   - If user mentions "WiFi" → label MUST start with "WiFi" (e.g. "WiFi Password", "WiFi Name")
   - If user mentions "Phone" → label MUST start with "Phone" (e.g. "Phone Number", "Phone Password")
   - "passing year", "pass year", "passing saal" always means the year they passed — use label "10th Passing Year" or "12th Passing Year" accordingly
   - ALWAYS include the class prefix (10th/12th) in the label so related info groups on one card
   - This ensures related memories group together in one card
2. RECALL stored info — "what is my password", "mera password kya tha", "mera number batao" → answer from stored data
   RECALL notes — "what is this", "what was that recipe", "tell me about", "kya tha wo", "batao wo formula", "what's the formula for" → search through user's notes and answer from there
   RECALL tasks — "what are my tasks", "what do I need to do", "mera kya kaam hai", "pending tasks", "what's on my list" → search through user's tasks and answer from there
   RECALL files — "what's in my file", "tell me about the document", "file mein kya hai", "document ke baare mein batao", "explain this topic from my notes", "mere notes mein kya likha hai", "notes se batao" → search through user's uploaded files and answer from there
   GENERATE QUESTIONS from files — "give me 10 questions from my notes", "mere notes se important questions batao", "test me on this topic", "quiz banao", "practice questions do" → generate relevant questions from file content
3. CREATE task — "remind me", "todo", "aaj karna hai", "ye kaam karne hain", "mujhe yaad dilao", "schedule kar" → extract all tasks and create
4. CREATE note — IMPORTANT: Auto-detect when user shares important information that should be saved as a note:
   - User shares ideas, thoughts, learnings, or important information
   - User says: "note this", "write down", "note kar", "likh le", "save this", "remember this", "yaad rakh", "important hai"
   - User shares: recipes, formulas, code snippets, quotes, definitions, explanations, study material, meeting notes, project ideas
   - Examples: "The formula for area of circle is πr²", "Recipe: mix 2 cups flour with 1 cup water", "Important: meeting tomorrow at 3pm"
   - Extract: title (short summary), content (full text), color (orange for general, blue for study, green for ideas, purple for important)
5. CREATE goal — detect ANY message where user expresses a personal ambition, aspiration, or long-term goal:
   Triggers: "my goal is", "mera goal hai", "I want to achieve", "mujhe achieve karna hai", "mujhe X banana hai", "mujhe X clear karna hai", "mujhe X ki taiyari karni hai", "I want to become", "I want to learn", "mujhe X seekhna hai", "banna chahta hoon", "ban jaana chahta", "taiyari karni hai", "taiyari krni h", "pass karna hai", "crack karna hai", "qualify karna hai", "sikhna hai", "career banana hai", "job chahiye", "exam clear karna", "clear krni h", "clear krna h", "krni h"
   CRITICAL: record_data.title MUST be a SHORT, CLEAN English title (3-6 words max), NOT the raw user message.
   Examples of clean titles: "UPSC Clear in 1st Attempt", "Become AI ML Engineer", "Learn Web Development", "Crack NEET Exam", "Become a Doctor"
   Extract duration from message — handle typos too: "1 saal"/"1 shaal"/"1 year"→"1 year", "6 mahine"/"6 month"→"6 months", "2 hafte"/"2 week"→"2 weeks", "30 din"/"30 day"→"30 days"
   record_data format for goal: { "title": "SHORT CLEAN TITLE IN ENGLISH", "description": "original user message", "duration": "1 year" or null }
6. RECALL goals — "mera goal kya hai", "what are my goals", "mera target", "goals batao", "what goals do I have" → answer from user's goals list above
7. ANYTHING ELSE → answer naturally like a knowledgeable desi friend

CRITICAL RULES — follow these without exception:
- You MUST reply ONLY with a valid JSON object. No text before or after. No markdown. No explanation.
- The JSON must start with { and end with }. Nothing else.
- The "response" field must be in the SAME language/style the user wrote in (Hinglish, Hindi, or English)
- If user writes in Hinglish — the "response" value must be in Hinglish like a desi friend
- NEVER write plain text. NEVER add any explanation outside the JSON.

RESPONSE FORMAT — always return valid JSON only, no markdown:
{
  "intent": "task|note|memory|goal|chat",
  "action": "create|answer",
  "response": "your natural conversational reply",
  "save": null or { "type": "password|reminder|fact|contact|date|other", "label": "short descriptive label for this specific info", "value": "value", "append_to_label": null or "exact label of existing card to append this info into" },
  "record_data": null or { "title": "...", "description": "...", "priority": "low|medium|high", "due_date": null, "content": "...", "color": "orange" }
}

MEMORY GROUPING RULES — very important:
- Before saving, look at the user's existing stored data shown above
- If the new info is RELATED to an existing card (same topic/subject/account/platform), set "append_to_label" to that card's EXACT label
- If it's genuinely NEW info with no related card, set "append_to_label" to null (new card will be created)
- Examples of RELATED (append):
  - Existing card "10th CBSE Roll Number" + new info "10th passing year" → append_to_label: "10th CBSE Roll Number"
  - Existing card "Gmail Password" + new info "gmail recovery email" → append_to_label: "Gmail Password"
  - Existing card "Phone Password" + new info "phone IMEI number" → append_to_label: "Phone Password"
  - Existing card "12th CBSE Roll Number" + new info "12th passing year" → append_to_label: "12th CBSE Roll Number"
- Examples of NEW (don't append):
  - No bank card exists + new info "SBI account number" → append_to_label: null
  - No Instagram card + new info "Instagram password" → append_to_label: null

EXAMPLES:
- "hey" → {"intent":"chat","action":"answer","response":"Hey ${userName}! 👋 What's up?","save":null,"record_data":null}
- "good morning" → {"intent":"chat","action":"answer","response":"Good morning ${userName}! ☀️ Hope you slept well. Ready to crush the day?","save":null,"record_data":null}
- "good night" → {"intent":"chat","action":"answer","response":"Good night ${userName}! 🌙 Get some rest, you deserve it. See you tomorrow!","save":null,"record_data":null}
- "how are you" → {"intent":"chat","action":"answer","response":"Doing great, thanks! 😊 How about you ${userName}? Having a good one?","save":null,"record_data":null}
- "I'm tired" → {"intent":"chat","action":"answer","response":"Aw, take a break ${userName}! Even 10 minutes of rest can recharge you. You've been working hard 💪","save":null,"record_data":null}
- "I'm bored" → {"intent":"chat","action":"answer","response":"Boredom is just creativity waiting to happen 😄 Want a fun fact, a joke, or should we knock out something from your task list?","save":null,"record_data":null}
- "I'm stressed" → {"intent":"chat","action":"answer","response":"Hey, breathe — you've got this 💪. Want to talk about it, or should we break things down into smaller steps?","save":null,"record_data":null}
- "I can't focus" → {"intent":"chat","action":"answer","response":"Try the Pomodoro technique — 25 mins focused work, 5 min break. Also close those extra tabs! 😄 Want me to create a focus task?","save":null,"record_data":null}
- "motivate me" → {"intent":"chat","action":"answer","response":"You didn't come this far to only come this far, ${userName}. Every big achievement starts with just showing up. Let's go! 🚀","save":null,"record_data":null}
- "tell me a joke" → {"intent":"chat","action":"answer","response":"Why do programmers prefer dark mode? Because light attracts bugs! 😂","save":null,"record_data":null}
- "fun fact" → {"intent":"chat","action":"answer","response":"Here's one: Honey never spoils — archaeologists found 3000-year-old honey in Egyptian tombs and it was still edible! 🍯","save":null,"record_data":null}
- "what is Newton's second law" → {"intent":"chat","action":"answer","response":"Newton's Second Law: F = ma. Force equals mass times acceleration. So the heavier the object or the faster you accelerate it, the more force you need. Classic physics! ⚡","save":null,"record_data":null}
- "what is the speed of light" → {"intent":"chat","action":"answer","response":"The speed of light in vacuum is approximately 3 × 10⁸ m/s (299,792,458 m/s to be exact). Nothing in the universe travels faster! 💥","save":null,"record_data":null}
- "what is photosynthesis" → {"intent":"chat","action":"answer","response":"Photosynthesis is how plants make food: 6CO₂ + 6H₂O + sunlight → C₆H₁₂O₆ + 6O₂. Plants absorb CO2 and water, use sunlight to convert it into glucose and release oxygen. Pretty amazing! 🌱","save":null,"record_data":null}
- "solve x^2 - 5x + 6 = 0" → {"intent":"chat","action":"answer","response":"Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3. You can verify: 4-10+6=0 ✓ and 9-15+6=0 ✓","save":null,"record_data":null}
- "what is AI" → {"intent":"chat","action":"answer","response":"AI (Artificial Intelligence) is technology that enables machines to simulate human intelligence — learning, reasoning, problem-solving. We're living in the AI era right now! 🤖","save":null,"record_data":null}
- "bye" → {"intent":"chat","action":"answer","response":"Take care ${userName}! 👋 Come back anytime you need me.","save":null,"record_data":null}
- "hello kaise ho bhai" → {"intent":"chat","action":"answer","response":"Arre bhai ekdum mast! 😄 Tu bata, kya haal hai tere? Kuch kaam aaye kya?","save":null,"record_data":null}
- "kya haal h yaar" → {"intent":"chat","action":"answer","response":"Sab badhiya yaar! 😊 Tera bata, sab theek thaak?","save":null,"record_data":null}
- "bhai thoda newton ke baare me batao" → {"intent":"chat","action":"answer","response":"Haan bhai, Newton ke 3 laws hain! Pehla: agar koi cheez ruk rahi hai toh rukhi rahegi jab tak koi force na lage (Inertia). Doosra: F = ma, matlab force = mass x acceleration. Teesra: har action ka equal aur opposite reaction hota hai. Simple hai na? 😄","save":null,"record_data":null}
- "yaar mujhe physics samajh nahi aati" → {"intent":"chat","action":"answer","response":"Arre tension mat le yaar! Physics thodi tricky lagti hai shuru mein, but ek baar basics clear ho jayein toh maza aata hai. Bata kaunsa topic hai, main simple language mein samjhata hoon 😊","save":null,"record_data":null}
- "bhai bahut bored hoon" → {"intent":"chat","action":"answer","response":"Haha bhai boredom ka ilaaj hai mere paas! 😄 Ek joke sunna hai? Ya koi fun fact? Ya phir task list dekh lete hain kuch productive karte hain?","save":null,"record_data":null}
- "yaar bahut stress hai" → {"intent":"chat","action":"answer","response":"Arre yaar, chill kar thoda. Ek deep breath le 💪. Bata kya ho raha hai, milke solve karte hain. Tu akela nahi hai!","save":null,"record_data":null}
- "bhai koi joke sunao" → {"intent":"chat","action":"answer","response":"Suno bhai 😂 — Ek programmer ghar gaya, biwi ne bola 'bazaar se ek litre doodh lao, aur agar ande mile toh 6 lao.' Woh 6 litre doodh le aaya. Kyunki ande mile the! 😂","save":null,"record_data":null}
- "bhai aaj kuch accha batao" → {"intent":"chat","action":"answer","response":"Suno yaar, ek mast fact: Octopus ke 3 dil hote hain aur unka khoon blue hota hai! Nature kitna crazy hai na? 😄","save":null,"record_data":null}
- "my gmail password is abc123" → {"intent":"memory","action":"create","response":"Saved your Gmail password safely, ${userName}! 🔐","save":{"type":"password","label":"Gmail Password","value":"abc123"},"record_data":null}
- "remind me to call mom at 5pm" → {"intent":"task","action":"create","response":"Done! Added 'Call mom at 5pm' to your tasks ✅","save":null,"record_data":{"title":"Call mom at 5pm","priority":"medium"}}
- "mera wifi ka password ye hai: admin123" → {"intent":"memory","action":"create","response":"Ho gaya bhai! Tera WiFi password save kar diya 🔐","save":{"type":"password","label":"WiFi Password","value":"admin123"},"record_data":null}
- "mera phone number 9876543210 hai" → {"intent":"memory","action":"create","response":"Noted yaar! Tera phone number save kar diya 📱","save":{"type":"contact","label":"Phone Number","value":"9876543210"},"record_data":null}
- "aaj mujhe grocery leni hai, gym jaana hai aur assignment submit karni hai" → {"intent":"task","action":"create","response":"Bhai maine teri 3 important cheezein task mein daal di hain: Grocery lena, Gym jaana, Assignment submit karna. Ab bhoolega nahi! ✅","save":null,"record_data":{"title":"Grocery lena, Gym jaana, Assignment submit karna","priority":"high"}}
- "yaar mera instagram ka password Pass@123 hai" → {"intent":"memory","action":"create","response":"Safe kar diya bhai! Instagram password lock ho gaya 🔒","save":{"type":"password","label":"Instagram Password","value":"Pass@123"},"record_data":null}
- "bhai aaj ye kaam karne hain: meeting at 3pm, report banana, aur mom ko call karna" → {"intent":"task","action":"create","response":"Teri saari important cheezein note kar li bhai! Meeting at 3pm, Report banana, Mom ko call karna — sab tasks mein add ho gaye ✅","save":null,"record_data":{"title":"Meeting at 3pm, Report banana, Mom ko call karna","priority":"high"}}
- "note kar: mera bank account number 1234567890 hai" → {"intent":"memory","action":"create","response":"Done yaar! Bank account number safely save kar diya 🏦","save":{"type":"other","label":"Bank Account Number","value":"1234567890"},"record_data":null}
- "mera gmail password kya tha" → {"intent":"chat","action":"answer","response":"Ruk bhai dekh raha hoon... (check stored memories and answer from there)","save":null,"record_data":null}
- "what is the quadratic formula" → {"intent":"chat","action":"answer","response":"From your notes: x = (-b ± √(b²-4ac))/2a 📝","save":null,"record_data":null}
- "what was that recipe" → {"intent":"chat","action":"answer","response":"Found it! Mix 2 cups flour, 1 cup water, 1 tsp salt, knead for 10 mins 🍞","save":null,"record_data":null}
- "bhai wo formula kya tha" → {"intent":"chat","action":"answer","response":"Arre haan bhai, tera note dekha: x = (-b ± √(b²-4ac))/2a. Ye quadratic equation ka formula hai 📚","save":null,"record_data":null}
- "tell me about newton's law" → {"intent":"chat","action":"answer","response":"From your notes: Object at rest stays at rest unless acted upon by force. That's Newton's First Law! ⚡","save":null,"record_data":null}
- "what are my tasks" → {"intent":"chat","action":"answer","response":"Here's what you need to do: Call mom at 5pm, Grocery shopping, Gym session. You've got 3 pending tasks! 💪","save":null,"record_data":null}
- "what do I need to do today" → {"intent":"chat","action":"answer","response":"Today's tasks: Meeting at 3pm, Submit assignment, Buy groceries. Let's crush them! 🚀","save":null,"record_data":null}
- "bhai mera kya kaam hai" → {"intent":"chat","action":"answer","response":"Dekh bhai, tere paas ye kaam hain: Gym jaana, Assignment submit karna, Mom ko call karna. Chal shuru kar! 💪","save":null,"record_data":null}
- "what's pending" → {"intent":"chat","action":"answer","response":"You have 5 pending tasks. Top priority: Submit project report, Client meeting prep. Want me to list all? 📋","save":null,"record_data":null}
- "note this: the formula for quadratic equation is x = (-b ± √(b²-4ac))/2a" → {"intent":"note","action":"create","response":"Got it! I've saved the quadratic formula to your notes 📝","save":null,"record_data":{"title":"Quadratic Equation Formula","content":"x = (-b ± √(b²-4ac))/2a","color":"blue"}}
- "write down: meeting with client tomorrow at 3pm, discuss project timeline and budget" → {"intent":"note","action":"create","response":"Noted! Saved your meeting details 📝","save":null,"record_data":{"title":"Client Meeting Tomorrow 3pm","content":"Meeting with client tomorrow at 3pm, discuss project timeline and budget","color":"purple"}}
- "recipe: mix 2 cups flour, 1 cup water, 1 tsp salt, knead for 10 mins" → {"intent":"note","action":"create","response":"Recipe saved! 🍞","save":null,"record_data":{"title":"Dough Recipe","content":"Mix 2 cups flour, 1 cup water, 1 tsp salt, knead for 10 mins","color":"orange"}}
- "important: project deadline is March 15th, need to submit final report" → {"intent":"note","action":"create","response":"Saved the important deadline info! 📝","save":null,"record_data":{"title":"Project Deadline - March 15th","content":"Project deadline is March 15th, need to submit final report","color":"purple"}}
- "yaad rakh: Newton's first law - object at rest stays at rest unless acted upon by force" → {"intent":"note","action":"create","response":"Physics note save kar diya bhai! 📚","save":null,"record_data":{"title":"Newton's First Law","content":"Object at rest stays at rest unless acted upon by force","color":"blue"}}
- "mujhe upsc ki teyari krni h or mujhe upsc clear krna h 1st attempt me hi 1 shaal me" → {"intent":"goal","action":"create","response":"Wah bhai, ekdum solid goal hai! 🎯 UPSC 1st attempt mein clear karna — ek saal mein. Goal set kar diya, Goals page par ja ke apna AI roadmap dekh!","save":null,"record_data":{"title":"UPSC Clear in 1st Attempt","description":"UPSC ki taiyari karni hai aur 1st attempt mein hi clear karna hai 1 saal mein","duration":"1 year"}}
- "mujhe doctor banna hai 2 saal mein" → {"intent":"goal","action":"create","response":"Goal set! 🎯 Doctor banna hai 2 saal mein — chal shuru karte hain!","save":null,"record_data":{"title":"Become a Doctor","description":"Mujhe doctor banna hai 2 saal mein","duration":"2 years"}}
- "I want to become a web developer in 6 months" → {"intent":"goal","action":"create","response":"Awesome goal! 🎯 Web developer in 6 months — totally doable. Goal saved, check your Goals page for the AI roadmap!","save":null,"record_data":{"title":"Become Web Developer","description":"I want to become a web developer in 6 months","duration":"6 months"}}
- "bhai mujhe neet crack karni hai" → {"intent":"goal","action":"create","response":"Solid goal bhai! 🎯 NEET crack karna — mehnat karni padegi but ho jayega. Goal set kar diya, Goals page par ja ke roadmap dekh!","save":null,"record_data":{"title":"Crack NEET Exam","description":"Mujhe NEET crack karni hai","duration":null}}`;
    };

    let parsed;
    let aiResult = null;
    try {
      const historyMessages = dbHistory.map(m => ({ role: m.role, content: m.content }));

      aiResult = await callAI([
        ...historyMessages,
        { role: 'user', content: message },
      ]);
      
      // Build system prompt with actual provider that was used
      const systemPrompt = buildSystemPrompt(aiResult.provider, aiResult.model);
      
      // Make the real call with correct system prompt
      aiResult = await callAI([
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: message },
      ]);
      
      let raw = aiResult.content.trim();
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (aiErr) {
      console.log('All AI models failed, using rule-based fallback:', aiErr.message);
      parsed = ruleBasedResponse(message, memories, notes, tasks, files, goalsData);
    }

    let savedRecord = null;

    // Auto-save memory if AI detected something to store
    if (parsed.save) {
      const { type, label, value, append_to_label } = parsed.save;

      // AI decides which existing card to append to (if any)
      const targetLabel = append_to_label?.trim();
      const existingMemory = targetLabel
        ? memories.find(m => m.label.toLowerCase() === targetLabel.toLowerCase())
        : null;

      if (existingMemory) {
        const newLine = `${label}: ${value}`;
        const alreadyExists = existingMemory.value.split('\n').some(l => l.toLowerCase() === newLine.toLowerCase());
        if (!alreadyExists) {
          const [memory] = await sql`
            UPDATE memories
            SET value = ${existingMemory.value + '\n' + newLine}, raw_input = ${message}
            WHERE id = ${existingMemory.id}
            RETURNING *`;
          savedRecord = memory;
        } else {
          savedRecord = existingMemory;
        }
      } else {
        const [memory] = await sql`
          INSERT INTO memories (user_id, type, label, value, raw_input)
          VALUES (${userId}, ${type}, ${label}, ${value}, ${message})
          RETURNING *`;
        savedRecord = memory;
      }
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

    // Save goal if detected — auto-generate roadmap too
    if (parsed.intent === 'goal' && parsed.action === 'create' && parsed.record_data) {
      const { title, description, duration } = parsed.record_data;
      // Parse duration to end_date
      function parseDur(d) {
        if (!d) return null;
        const s = d.toLowerCase();
        const num = parseFloat(s.match(/[\d.]+/)?.[0] || 0);
        if (!num) return null;
        const end = new Date();
        if (s.includes('year')) end.setFullYear(end.getFullYear() + num);
        else if (s.includes('month')) end.setMonth(end.getMonth() + num);
        else if (s.includes('week')) end.setDate(end.getDate() + num * 7);
        else if (s.includes('day')) end.setDate(end.getDate() + num);
        else return null;
        return end;
      }
      const startDate = new Date();
      const endDate = parseDur(duration);
      // Auto-generate roadmap steps
      let aiPlanSteps = null;
      try {
        const roadmapResult = await callAI([
          { role: 'system', content: 'You are an expert career coach. Return ONLY a valid JSON array of 8-10 specific, actionable step strings. No markdown, no explanation.' },
          { role: 'user', content: `Generate a step-by-step roadmap for: "${title}". Return ONLY a JSON array of strings.` },
        ]);
        let raw = roadmapResult.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          const steps = JSON.parse(match[0]);
          if (Array.isArray(steps) && steps.length > 0) {
            aiPlanSteps = JSON.stringify(steps.map(s => ({ text: String(s).replace(/^Step \d+[:.\s]*/i, ''), completed: false })));
          }
        }
      } catch (e) {
        console.log('Roadmap generation failed for auto-goal:', e.message);
      }
      const [goal] = await sql`
        INSERT INTO goals (user_id, title, description, duration, start_date, end_date, ai_plan)
        VALUES (${userId}, ${title}, ${description || null}, ${duration || null}, ${startDate}, ${endDate || null}, ${aiPlanSteps || null})
        RETURNING *`;
      savedRecord = goal;
    }

    // Save assistant response to DB
    await sql`INSERT INTO chat_history (user_id, role, content) VALUES (${userId}, 'assistant', ${parsed.response})`;

    return res.json({
      intent: parsed.intent || 'chat',
      action: parsed.action || 'answer',
      message: parsed.response,
      response: parsed.response,
      record: savedRecord,
      aiProvider: aiResult?.provider || 'fallback',
      aiModel: aiResult?.model || 'rule-based',
    });

  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).json({
      message: 'AI processing failed.',
      error: err.message,
      response: 'Sorry, I ran into an error. Please try again.',
      aiProvider: 'error',
      aiModel: 'none',
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const rows = await sql`
      SELECT role, content, created_at FROM chat_history
      WHERE user_id = ${req.user.id}
      ORDER BY created_at ASC
    `;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const clearChatHistory = async (req, res) => {
  try {
    await sql`DELETE FROM chat_history WHERE user_id = ${req.user.id}`;
    res.json({ message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const tasks = await sql`SELECT title, status, priority FROM tasks WHERE user_id = ${req.user.id} LIMIT 10`;
    const goals = await sql`SELECT title, progress FROM goals WHERE user_id = ${req.user.id} LIMIT 5`;
    try {
      const aiResult = await callAI([
        { role: 'system', content: 'Give 3 short actionable productivity suggestions. Return ONLY a JSON array of 3 strings, no markdown.' },
        { role: 'user', content: `Tasks: ${JSON.stringify(tasks)}, Goals: ${JSON.stringify(goals)}` },
      ]);
      const suggestions = JSON.parse(aiResult.content.replace(/^```json\n?/, '').replace(/\n?```$/, ''));
      res.json({ suggestions });
    } catch {
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

const generateRoadmap = async (req, res) => {
  const { goal } = req.body;
  if (!goal) return res.status(400).json({ message: 'Goal is required' });

  try {
    const aiResult = await callAI([
      {
        role: 'system',
        content: 'You are an expert career coach. The user will give you a goal. Return ONLY a valid JSON array of 8-10 specific, actionable step strings (like a syllabus). No markdown, no explanation, no extra text. Just the JSON array.',
      },
      {
        role: 'user',
        content: `Generate a step-by-step roadmap for this goal: "${goal}". Return ONLY a JSON array of strings.`,
      },
    ]);

    let raw = aiResult.content.trim();
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    // Extract JSON array
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array in response: ' + raw.substring(0, 100));
    const steps = JSON.parse(match[0]);
    if (!Array.isArray(steps) || steps.length === 0) throw new Error('Empty steps');
    res.json({ steps });
  } catch (err) {
    console.error('Roadmap AI error, using fallback:', err.message);
    res.json({ steps: getFallbackRoadmap(goal) });
  }
};

function getFallbackRoadmap(goal) {
  const g = (goal || '').toLowerCase();

  if (g.includes('upsc') || g.includes('ias') || g.includes('civil service')) {
    return [
      'Understand UPSC syllabus: Prelims (GS Paper 1 & CSAT) and Mains (GS 1-4 + Optional)',
      'Build NCERT foundation: Read Class 6-12 History, Geography, Polity, Economy, Science',
      'Study standard books: Laxmikanth (Polity), Spectrum (Modern History), Ramesh Singh (Economy)',
      'Start newspaper reading daily: The Hindu or Indian Express — focus on editorials & current affairs',
      'Practice Prelims MCQs: Solve previous 10 years papers, target 100+ daily questions',
      'Prepare Mains answer writing: Practice 150-200 word structured answers daily',
      'Choose and master Optional subject (e.g. History, Geography, Public Administration)',
      'Revise notes regularly: Make short notes for quick revision before exam',
      'Take full mock tests: Attempt 3-4 full Prelims mocks per month',
      'Prepare for Interview (Personality Test): Work on current affairs, communication & confidence',
    ];
  }
  if (g.includes('neet') || (g.includes('doctor') && g.includes('mbbs'))) {
    return [
      'Master NCERT Biology (Class 11 & 12) — most important for NEET',
      'Study NCERT Physics (Class 11 & 12) with H.C. Verma for concepts',
      'Study NCERT Chemistry (Class 11 & 12) — Physical, Organic & Inorganic',
      'Solve NEET previous year papers (last 10 years)',
      'Practice 100+ MCQs daily topic-wise',
      'Take weekly full mock tests and analyze mistakes',
      'Focus on high-weightage chapters: Human Physiology, Genetics, Organic Chemistry',
      'Revise NCERT thoroughly — 80% NEET questions are directly from NCERT',
    ];
  }
  if (g.includes('jee') || g.includes('iit')) {
    return [
      'Master Class 11 & 12 Physics, Chemistry, Mathematics (NCERT + advanced)',
      'Study HC Verma for Physics, MS Chauhan for Organic Chemistry, RD Sharma for Maths',
      'Solve JEE Previous Year Papers (last 15 years)',
      'Practice 150+ problems daily across all 3 subjects',
      'Focus on high-weightage topics: Calculus, Mechanics, Organic Chemistry',
      'Take full mock tests weekly and analyze weak areas',
      'Revise formulas and concepts daily with short notes',
      'Join a test series (Allen, Resonance, or online platforms)',
    ];
  }
  if (g.includes('ssc') || g.includes('cgl') || g.includes('chsl')) {
    return [
      'Understand SSC exam pattern: Tier 1 (Reasoning, GK, Maths, English)',
      'Study Quantitative Aptitude: R.S. Aggarwal — Number System, Algebra, Geometry',
      'Study Reasoning: Verbal & Non-Verbal (R.S. Aggarwal)',
      'Improve English: Grammar rules, Vocabulary, Reading Comprehension',
      'Study General Awareness: Current Affairs, Static GK, History, Geography',
      'Solve SSC previous year papers (last 5 years)',
      'Practice 100+ MCQs daily and take timed mock tests',
      'Focus on speed and accuracy — time management is key',
    ];
  }
  if (g.includes('web developer') || g.includes('frontend') || g.includes('react')) {
    return [
      'Learn HTML5 & CSS3 fundamentals (flexbox, grid, responsive design)',
      'Master JavaScript ES6+: variables, functions, arrays, DOM manipulation',
      'Learn Git & GitHub for version control',
      'Study React.js: components, hooks, state management',
      'Learn Node.js & Express.js for backend development',
      'Understand databases: SQL (PostgreSQL) and NoSQL (MongoDB)',
      'Build 3 full-stack projects for portfolio',
      'Learn deployment: Vercel, Netlify, Railway',
      'Study REST APIs and authentication (JWT)',
      'Apply for jobs and contribute to open source',
    ];
  }
  if (g.includes('ai') || g.includes('ml') || g.includes('machine learning') || g.includes('data science')) {
    return [
      'Learn Python: syntax, OOP, file handling, libraries',
      'Study Mathematics: Linear Algebra, Calculus, Probability & Statistics',
      'Master NumPy, Pandas, Matplotlib for data manipulation',
      'Learn Machine Learning with Scikit-learn: regression, classification, clustering',
      'Understand Deep Learning: Neural Networks, CNNs, RNNs with TensorFlow/PyTorch',
      'Study Natural Language Processing (NLP) and transformers',
      'Learn MLOps: model deployment, Docker, FastAPI',
      'Build 3-5 end-to-end ML projects on Kaggle',
      'Study Large Language Models (LLMs) and prompt engineering',
      'Contribute to open source ML projects and apply for roles',
    ];
  }
  if (g.includes('android') || g.includes('mobile') || g.includes('flutter') || g.includes('kotlin')) {
    return [
      'Learn Kotlin or Dart (Flutter) basics',
      'Understand Android Studio / Flutter SDK setup',
      'Study UI components: layouts, navigation, state management',
      'Learn API integration and local storage (SQLite/Hive)',
      'Understand Firebase: auth, Firestore, push notifications',
      'Build 3 complete mobile apps for portfolio',
      'Publish an app on Google Play Store',
      'Learn testing and CI/CD for mobile apps',
    ];
  }
  if (g.includes('devops') || g.includes('cloud') || g.includes('aws') || g.includes('docker')) {
    return [
      'Learn Linux fundamentals and shell scripting',
      'Master Git, GitHub Actions for CI/CD',
      'Learn Docker: containers, images, docker-compose',
      'Study Kubernetes: pods, deployments, services',
      'Learn AWS/GCP/Azure core services (EC2, S3, Lambda)',
      'Understand Infrastructure as Code: Terraform, Ansible',
      'Study monitoring: Prometheus, Grafana, ELK stack',
      'Get certified: AWS Solutions Architect or CKA',
    ];
  }
  if (g.includes('design') || g.includes('ui') || g.includes('ux') || g.includes('figma')) {
    return [
      'Learn design principles: typography, color theory, spacing',
      'Master Figma: components, auto-layout, prototyping',
      'Study UX research: user interviews, personas, journey maps',
      'Learn wireframing and low-fidelity prototyping',
      'Build a design system with reusable components',
      'Create 5 case studies for your portfolio',
      'Learn basic HTML/CSS to collaborate with developers',
      'Apply for internships and freelance projects',
    ];
  }

  // Generic fallback
  return [
    `Research and understand the fundamentals of: ${goal}`,
    'Find the best learning resources (courses, books, YouTube)',
    'Create a structured 3-month learning plan',
    'Practice daily with hands-on projects',
    'Join communities and find a mentor',
    'Build 2-3 real projects to showcase skills',
    'Get feedback and iterate on your work',
    'Apply for opportunities and keep improving',
  ];
}

const summarizePDF = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const aiResult = await callAI([
      { role: 'system', content: 'You are a helpful assistant that summarizes documents. Provide a clear, concise summary in 3-5 sentences.' },
      { role: 'user', content: `Summarize this document:\n\n${text}` },
    ]);

    res.json({ summary: aiResult.content });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate summary', error: err.message });
  }
};

const extractPoints = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    const aiResult = await callAI([
      { role: 'system', content: 'Extract 5-8 most important points from the document. Return ONLY a JSON array of strings, no markdown.' },
      { role: 'user', content: `Extract key points from:\n\n${text}` },
    ]);

    const points = JSON.parse(aiResult.content.replace(/^```json\n?/, '').replace(/\n?```$/, ''));
    res.json({ points });
  } catch (err) {
    res.status(500).json({ message: 'Failed to extract points', error: err.message });
  }
};

const extractAndSave = async (req, res) => {
  try {
    const { fileId } = req.body;
    const userId = req.user.id;

    if (!fileId) return res.status(400).json({ message: 'File ID is required' });

    // Get file
    const [file] = await sql`SELECT name, content FROM files WHERE id = ${fileId} AND user_id = ${userId}`;
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (!file.content) return res.status(400).json({ message: 'File has no content' });

    // Extract important points
    const pointsResult = await callAI([
      { role: 'system', content: 'Extract 5-8 most important points from the document. Return ONLY a JSON array of strings, no markdown.' },
      { role: 'user', content: `Extract key points from:\n\n${file.content.substring(0, 10000)}` },
    ]);

    let raw = pointsResult.content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array in response');
    const points = JSON.parse(match[0]);

    // Save points to file
    await sql`
      UPDATE files 
      SET important_points = ${JSON.stringify(points)}
      WHERE id = ${fileId} AND user_id = ${userId}
    `;

    let savedNotes = [];
    let savedMemories = [];

    // Save note with all points
    const noteTitle = `Important Points from ${file.name}`;
    const noteContent = points.map((p, i) => `${i + 1}. ${p}`).join('\n\n');
    const [note] = await sql`
      INSERT INTO notes (user_id, title, content, color, source)
      VALUES (${userId}, ${noteTitle}, ${noteContent}, 'blue', 'ai')
      RETURNING *
    `;
    savedNotes.push(note);

    // Save each point as individual Memory entry
    for (const point of points) {
      try {
        const label = point.length > 80 ? point.substring(0, 80) + '...' : point;
        const [memory] = await sql`
          INSERT INTO memories (user_id, type, label, value, raw_input)
          VALUES (${userId}, 'other', ${label}, ${point}, ${`From file: ${file.name}`})
          RETURNING *
        `;
        savedMemories.push(memory);
      } catch (e) {
        console.error('Memory save error in extractAndSave:', e.message);
      }
    }

    res.json({ 
      points, 
      savedNotes: savedNotes.length,
      savedMemories: savedMemories.length,
      message: `Extracted ${points.length} points. Saved ${savedNotes.length} note and ${savedMemories.length} memories.`
    });
  } catch (err) {
    console.error('Extract and save error:', err.message);
    res.status(500).json({ message: 'Failed to extract and save', error: err.message });
  }
};

// Helper: format days left in Hinglish or English
function formatTimeLeft(daysLeft, lang) {
  const abs = Math.abs(daysLeft);
  if (lang === 'hi') {
    if (daysLeft < 0) return `${abs} din overdue ho gaya`;
    if (daysLeft === 0) return 'aaj deadline hai';
    if (daysLeft <= 7) return `${daysLeft} din baaki hain`;
    if (daysLeft <= 30) return `${Math.floor(daysLeft / 7)} hafte baaki hain`;
    return `${Math.floor(daysLeft / 30)} mahine baaki hain`;
  }
  if (daysLeft < 0) return `${abs} days overdue`;
  if (daysLeft === 0) return 'due today';
  if (daysLeft <= 7) return `${daysLeft} days left`;
  if (daysLeft <= 30) return `${Math.floor(daysLeft / 7)} weeks left`;
  return `${Math.floor(daysLeft / 30)} months left`;
}

const goalChat = async (req, res) => {
  const { goalId, message } = req.body;
  if (!goalId || !message?.trim()) return res.status(400).json({ message: 'Goal ID and message required' });

  try {
    const userId = req.user.id;
    const [goal] = await sql`SELECT * FROM goals WHERE id = ${goalId} AND user_id = ${userId}`;
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const steps = goal.ai_plan ? JSON.parse(goal.ai_plan) : [];
    const completedSteps = steps.filter(s => s.completed).length;
    const totalSteps = steps.length;
    const progress = goal.progress || 0;
    const nextStep = steps.find(s => !s.completed);

    // Deadline calculation
    let daysLeft = null;
    let timeProgress = 0;
    let deadlineInfo = '';
    if (goal.end_date) {
      const now = new Date();
      const end = new Date(goal.end_date);
      const start = new Date(goal.start_date);
      daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
      timeProgress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
      deadlineInfo = `\nDeadline: ${formatTimeLeft(daysLeft, 'en')}. Time elapsed: ${timeProgress}%.`;
    }
    const stepsInfo = totalSteps > 0
      ? `\nSteps: ${completedSteps}/${totalSteps} completed.${nextStep ? ' Next: ' + nextStep.text : ' All done!'}`
      : '';

    // Detect Hinglish/Hindi
    const msg = message.toLowerCase();
    const isHindi = /[\u0900-\u097F]/.test(message);
    const isHinglish = isHindi || /\b(bhai|yaar|arre|haan|nahi|kya|baaki|kitna|kaise|haal|karna|krna|kaam|aage|sahi|theek|chal|mast|bas|thoda|batao|dekh|aur|toh|ek|aaj|kal|mahina|din|hafte|progress|goal|track|next|step|motivat)/.test(msg);
    const lang = isHinglish ? 'hi' : 'en';

    // Smart instant responses (no AI needed)
    let smartResponse = null;

    // Time left questions
    if (/baaki|kitna.*time|time.*left|how.*long|deadline|din.*bache|mahine.*bache|left|remaining/.test(msg)) {
      if (daysLeft !== null) {
        smartResponse = lang === 'hi'
          ? `Arre bhai! "${goal.title}" mein ${formatTimeLeft(daysLeft, 'hi')}. Abhi ${progress}% complete hai. ${daysLeft < 0 ? 'Deadline nikal gayi, jaldi kar!' : daysLeft <= 14 ? 'Jaldi kar bhai, time kam hai! ⚠️' : 'Chal, mehnat karte reh! 💪'}`
          : `You have ${formatTimeLeft(daysLeft, 'en')} for "${goal.title}". Currently ${progress}% complete. ${daysLeft < 0 ? 'Deadline passed, hurry up!' : daysLeft <= 14 ? 'Time is running out! ⚠️' : 'Keep pushing! 💪'}`;
      } else {
        smartResponse = lang === 'hi'
          ? `Bhai, is goal mein koi deadline set nahi hai. Goal add karte waqt duration daal dena! 📅`
          : `No deadline set for this goal. Add a duration when creating goals! 📅`;
      }
    }
    // Progress questions
    else if (/progress|kitna.*hua|complete|percent|%|kahan.*hoon|how.*doing/.test(msg)) {
      const behind = daysLeft !== null && progress < timeProgress - 15;
      const ahead = daysLeft !== null && progress > timeProgress + 15;
      smartResponse = lang === 'hi'
        ? `Tera progress ${progress}% hai bhai! ${completedSteps}/${totalSteps} steps complete. ${behind ? `Thoda peeche hai — ${timeProgress}% time nikal gaya. Speed badha! 💨` : ahead ? 'Ekdum aage chal raha hai! Bahut badhiya! 🔥' : 'Sahi track par hai! 🎯'}`
        : `You're at ${progress}% — ${completedSteps}/${totalSteps} steps done. ${behind ? `A bit behind (${timeProgress}% time elapsed). Speed up! 💨` : ahead ? 'Ahead of schedule! Amazing! 🔥' : 'Right on track! 🎯'}`;
    }
    // Next step / what to do
    else if (/next|aage|kya.*karna|what.*do|kya.*step|suggest/.test(msg)) {
      smartResponse = nextStep
        ? (lang === 'hi'
          ? `Agle step par focus kar bhai: "${nextStep.text}" 🎯 Ye complete kar, phir aage badhte hain!`
          : `Focus on your next step: "${nextStep.text}" 🎯 Complete this, then move forward!`)
        : (lang === 'hi'
          ? `Wah bhai! Saare steps complete ho gaye! Goal finish karne ka time aa gaya! 🎉`
          : `All steps are done! Time to wrap up the goal! 🎉`);
    }
    // On track?
    else if (/track|sahi.*chal|theek.*chal|on.*track|behind|peeche/.test(msg)) {
      if (daysLeft !== null) {
        const diff = progress - timeProgress;
        smartResponse = lang === 'hi'
          ? (diff >= -10 ? `Haan bhai, tu sahi track par hai! Progress ${progress}%, time ${timeProgress}% — bilkul balanced! 🎯` : `Thoda peeche ho gaya bhai. ${progress}% complete, ${timeProgress}% time nikal gaya. Chal, speed badhate hain! 💨`)
          : (diff >= -10 ? `Yes, you're on track! Progress ${progress}%, time ${timeProgress}% — perfectly balanced! 🎯` : `Slightly behind. ${progress}% done but ${timeProgress}% time elapsed. Let's speed up! 💨`);
      }
    }
    // Motivation
    else if (/motivat|lazy|tired|thak|bore|give.*up|chod|chhod|help/.test(msg)) {
      smartResponse = lang === 'hi'
        ? `Arre yaar, itna door aa gaya tu! ${progress}% complete ho gaya hai. Bas thoda aur — finish line dikhne wali hai! 🚀💪`
        : `You've come so far — ${progress}% done! Just a little more to the finish line! 🚀💪`;
    }

    if (smartResponse) {
      return res.json({ response: smartResponse, goalId, goalTitle: goal.title });
    }

    // AI fallback for complex questions
    const systemPrompt = `You are a smart goal coach for NeuroDesk. Answer the user's question about their goal.

Goal: "${goal.title}"
Status: ${goal.status} | Progress: ${progress}%
Duration: ${goal.duration || 'Not set'}${deadlineInfo}${stepsInfo}

IMPORTANT: Detect the user's language. If they write in Hindi/Hinglish, reply in casual Hinglish like a desi friend (use: bhai, yaar, arre, haan, sahi hai, chill kar, ekdum, mast). If English, reply in English. Be concise and encouraging.`;

    const aiResult = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    res.json({ response: aiResult.content.trim(), goalId, goalTitle: goal.title });
  } catch (err) {
    console.error('Goal chat error:', err.message);
    res.status(500).json({ message: 'Failed to process goal chat', error: err.message });
  }
};

const generateQuestions = async (req, res) => {
  try {
    const { fileId, count = 10 } = req.body;
    const userId = req.user.id;

    if (!fileId) return res.status(400).json({ message: 'File ID is required' });

    // Get file content
    const [file] = await sql`SELECT name, content FROM files WHERE id = ${fileId} AND user_id = ${userId}`;
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (!file.content) return res.status(400).json({ message: 'File has no content' });

    const aiResult = await callAI([
      {
        role: 'system',
        content: `You are an expert teacher creating practice questions. Generate ${count} important, relevant questions from the given content. Questions should test understanding, not just memorization. Return ONLY a JSON array of question strings, no markdown, no numbering in questions.`
      },
      {
        role: 'user',
        content: `Generate ${count} important questions from this content:\n\n${file.content.substring(0, 10000)}`
      }
    ]);

    let raw = aiResult.content.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array in response');
    const questions = JSON.parse(match[0]);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Empty questions array');
    }

    res.json({ questions, fileName: file.name });
  } catch (err) {
    console.error('Question generation error:', err.message);
    res.status(500).json({ message: 'Failed to generate questions', error: err.message });
  }
};

module.exports = { processMessage, getSuggestions, summarizePDF, extractPoints, extractAndSave, generateRoadmap, goalChat, getChatHistory, clearChatHistory, generateQuestions };
