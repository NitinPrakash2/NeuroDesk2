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
    'llama3-70b-8192',
    'llama3-8b-8192',
    'gemma2-9b-it',
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
        console.log(`Groq model ${model} failed:`, json.error?.message);
        lastError = new Error(json.error?.message || 'Groq error');
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

// Google Gemini
async function callGemini(messages) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '<your_gemini_api_key>') throw new Error('No Gemini key');
  const prompt = messages.map(m => `${m.role === 'system' ? 'System' : 'User'}: ${m.content}`).join('\n');

  const geminiModels = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ];

  let lastError;
  for (const model of geminiModels) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.log(`Gemini model ${model} failed:`, json.error?.message);
        lastError = new Error(json.error?.message || 'Gemini error');
        continue;
      }
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) { lastError = new Error('No content from Gemini'); continue; }
      console.log(`Gemini model ${model} succeeded`);
      return { content: content.trim(), provider: 'gemini', model };
    } catch (err) {
      console.log(`Gemini model ${model} error:`, err.message);
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
    return await callGroq(messages);
  } catch (groqErr) {
    console.log('Groq failed, trying Gemini:', groqErr.message);
    try {
      return await callGemini(messages);
    } catch (geminiErr) {
      console.log('Gemini failed, trying OpenRouter:', geminiErr.message);
      return await callOpenRouter(messages);
    }
  }
}

// Rule-based fallback when all AI models are unavailable
function ruleBasedResponse(message, memories, notes, tasks) {
  const msg = message.toLowerCase();

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

    const buildSystemPrompt = (provider, modelName) => {
      const providerLabel = provider === 'gemini' ? `Google Gemini (${modelName})` : provider === 'groq' ? `${modelName} via Groq` : `${modelName} via OpenRouter`;
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
- If asked who you are: "I'm NeuroDesk AI, powered by ${providerLabel}, your personal assistant built right into NeuroDesk!"
- If asked what model: mention ${modelName} and ${provider === 'gemini' ? 'Google Gemini' : provider === 'groq' ? 'Groq' : 'OpenRouter'}
- If asked user's name: always say "${userName}" (from their profile)
- Never claim to be ChatGPT, Claude, or any other product

${memoryContext}

${notesContext}

${tasksContext}

ACTIONS — detect and handle automatically (works in English AND Hinglish):
1. SAVE info — detect keywords: "password", "number", "address", "account", "pin", "id", "pasword hai", "ka password", "mera number", "save kar", "note kar", "yaad rakh" → extract label+value and save to memory
2. RECALL stored info — "what is my password", "mera password kya tha", "mera number batao" → answer from stored data
   RECALL notes — "what is this", "what was that recipe", "tell me about", "kya tha wo", "batao wo formula", "what's the formula for" → search through user's notes and answer from there
   RECALL tasks — "what are my tasks", "what do I need to do", "mera kya kaam hai", "pending tasks", "what's on my list" → search through user's tasks and answer from there
3. CREATE task — "remind me", "todo", "aaj karna hai", "ye kaam karne hain", "mujhe yaad dilao", "schedule kar" → extract all tasks and create
4. CREATE note — IMPORTANT: Auto-detect when user shares important information that should be saved as a note:
   - User shares ideas, thoughts, learnings, or important information
   - User says: "note this", "write down", "note kar", "likh le", "save this", "remember this", "yaad rakh", "important hai"
   - User shares: recipes, formulas, code snippets, quotes, definitions, explanations, study material, meeting notes, project ideas
   - Examples: "The formula for area of circle is πr²", "Recipe: mix 2 cups flour with 1 cup water", "Important: meeting tomorrow at 3pm"
   - Extract: title (short summary), content (full text), color (orange for general, blue for study, green for ideas, purple for important)
5. CREATE goal — "my goal is", "mera goal hai", "I want to achieve", "mujhe achieve karna hai" → create goal
6. ANYTHING ELSE → answer naturally like a knowledgeable desi friend

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
  "save": null or { "type": "password|reminder|fact|contact|date|other", "label": "label", "value": "value" },
  "record_data": null or { "title": "...", "description": "...", "priority": "low|medium|high", "due_date": null, "content": "...", "color": "orange" }
}

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
- "yaad rakh: Newton's first law - object at rest stays at rest unless acted upon by force" → {"intent":"note","action":"create","response":"Physics note save kar diya bhai! 📚","save":null,"record_data":{"title":"Newton's First Law","content":"Object at rest stays at rest unless acted upon by force","color":"blue"}}`;
    };

    let parsed;
    try {
      const aiResult = await callAI([
        { role: 'system', content: buildSystemPrompt('groq', 'llama-3.3-70b-versatile') },
        { role: 'user', content: message },
        { role: 'assistant', content: '{"intent":' },
      ]);
      const raw = '{"intent":' + aiResult.content;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (aiErr) {
      console.log('All AI models failed, using rule-based fallback:', aiErr.message);
      parsed = ruleBasedResponse(message, memories, notes, tasks);
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
      const aiResult = await callAI([
        { role: 'system', content: 'Give 3 short actionable productivity suggestions. Return ONLY a JSON array of 3 strings, no markdown.' },
        { role: 'user', content: `Tasks: ${JSON.stringify(tasks)}, Goals: ${JSON.stringify(goals)}` },
      ]);
      const suggestions = JSON.parse(aiResult.content.replace(/^```json\n?/, '').replace(/\n?```$/, ''));
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
