const { sql } = require('../config/db');

const getTasks = async (req, res) => {
  try {
    const tasks = await sql`
      SELECT * FROM tasks WHERE user_id = ${req.user.id} ORDER BY created_at DESC
    `;
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTask = async (req, res) => {
  const { title, description, priority, due_date, source } = req.body;
  try {
    const [task] = await sql`
      INSERT INTO tasks (user_id, title, description, priority, due_date, source)
      VALUES (${req.user.id}, ${title}, ${description || null}, ${priority || 'medium'}, ${due_date || null}, ${source || 'manual'})
      RETURNING *
    `;
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, due_date } = req.body;
  try {
    const [task] = await sql`
      UPDATE tasks SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        priority = COALESCE(${priority}, priority),
        status = COALESCE(${status}, status),
        due_date = COALESCE(${due_date}, due_date)
      WHERE id = ${id} AND user_id = ${req.user.id}
      RETURNING *
    `;
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    await sql`DELETE FROM tasks WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
