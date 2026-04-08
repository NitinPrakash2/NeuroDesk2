const { sql } = require('../config/db');

const getMemories = async (req, res) => {
  try {
    const memories = await sql`
      SELECT * FROM memories WHERE user_id = ${req.user.id} ORDER BY created_at DESC
    `;
    res.json(memories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createMemory = async (req, res) => {
  const { type, label, value, raw_input } = req.body;
  try {
    const [memory] = await sql`
      INSERT INTO memories (user_id, type, label, value, raw_input)
      VALUES (${req.user.id}, ${type}, ${label}, ${value}, ${raw_input || null})
      RETURNING *
    `;
    res.status(201).json(memory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteMemory = async (req, res) => {
  try {
    await sql`DELETE FROM memories WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    res.json({ message: 'Memory deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMemories, createMemory, deleteMemory };
