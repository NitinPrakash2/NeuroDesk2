const { sql } = require('../config/db');

const getNotes = async (req, res) => {
  try {
    const notes = await sql`
      SELECT * FROM notes WHERE user_id = ${req.user.id} ORDER BY created_at DESC
    `;
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createNote = async (req, res) => {
  const { title, content, color, source } = req.body;
  try {
    const [note] = await sql`
      INSERT INTO notes (user_id, title, content, color, source)
      VALUES (${req.user.id}, ${title}, ${content || null}, ${color || 'orange'}, ${source || 'manual'})
      RETURNING *
    `;
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateNote = async (req, res) => {
  const { title, content, color } = req.body;
  try {
    const [note] = await sql`
      UPDATE notes SET
        title = COALESCE(${title}, title),
        content = COALESCE(${content}, content),
        color = COALESCE(${color}, color)
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
      RETURNING *
    `;
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    await sql`DELETE FROM notes WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
