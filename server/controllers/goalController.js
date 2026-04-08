const { sql } = require('../config/db');

const getGoals = async (req, res) => {
  try {
    const goals = await sql`
      SELECT * FROM goals WHERE user_id = ${req.user.id} ORDER BY created_at DESC
    `;
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createGoal = async (req, res) => {
  const { title, description, ai_plan } = req.body;
  try {
    const [goal] = await sql`
      INSERT INTO goals (user_id, title, description, ai_plan)
      VALUES (${req.user.id}, ${title}, ${description || null}, ${ai_plan || null})
      RETURNING *
    `;
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateGoal = async (req, res) => {
  const { title, description, progress, status, ai_plan } = req.body;
  try {
    const [goal] = await sql`
      UPDATE goals SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        progress = COALESCE(${progress}, progress),
        status = COALESCE(${status}, status),
        ai_plan = COALESCE(${ai_plan}, ai_plan)
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
