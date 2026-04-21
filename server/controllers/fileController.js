const { sql } = require('../config/db');

const getFiles = async (req, res) => {
  try {
    const files = await sql`SELECT * FROM files WHERE user_id = ${req.user.id} ORDER BY created_at DESC`;
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createFile = async (req, res) => {
  try {
    const { name, size, type, content } = req.body;
    const [file] = await sql`
      INSERT INTO files (user_id, name, size, type, content)
      VALUES (${req.user.id}, ${name}, ${size}, ${type}, ${content || null})
      RETURNING *`;
    res.status(201).json(file);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    await sql`DELETE FROM files WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getFiles, createFile, deleteFile };
