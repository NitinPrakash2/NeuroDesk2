const { sql } = require('../config/db');

const getGoals = async (req, res) => {
  try {
    const goals = await sql`SELECT * FROM goals WHERE user_id = ${req.user.id} ORDER BY created_at DESC`;
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Parse duration string like "6 months", "3 weeks", "1 year", "90 days"
function parseDuration(durationStr) {
  if (!durationStr) return null;
  const s = durationStr.toLowerCase();
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

const createGoal = async (req, res) => {
  const { title, description, ai_plan, progress, duration } = req.body;
  const startDate = new Date();
  const endDate = parseDuration(duration);
  try {
    const [goal] = await sql`
      INSERT INTO goals (user_id, title, description, ai_plan, progress, duration, start_date, end_date)
      VALUES (
        ${req.user.id}, ${title}, ${description || null}, ${ai_plan || null},
        ${progress || 0}, ${duration || null}, ${startDate}, ${endDate || null}
      )
      RETURNING *
    `;
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateGoal = async (req, res) => {
  const { title, description, progress, status, ai_plan, duration } = req.body;
  const endDate = duration ? parseDuration(duration) : undefined;
  try {
    const [goal] = await sql`
      UPDATE goals SET
        title       = COALESCE(${title ?? null}, title),
        description = COALESCE(${description ?? null}, description),
        progress    = COALESCE(${progress ?? null}, progress),
        status      = COALESCE(${status ?? null}, status),
        ai_plan     = COALESCE(${ai_plan ?? null}, ai_plan),
        duration    = COALESCE(${duration ?? null}, duration),
        end_date    = COALESCE(${endDate ?? null}, end_date)
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
      RETURNING *
    `;
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteGoal = async (req, res) => {
  try {
    await sql`DELETE FROM goals WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
