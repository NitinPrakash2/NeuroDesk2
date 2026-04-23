const { sql } = require('../config/db');

const getFiles = async (req, res) => {
  try {
    const files = await sql`SELECT id, name, size, type, summary, important_points, created_at FROM files WHERE user_id = ${req.user.id} ORDER BY created_at DESC`;
    res.json(files);
  } catch (err) {
    console.error('Get files error:', err);
    res.status(500).json({ message: err.message });
  }
};

const createFile = async (req, res) => {
  try {
    const { name, size, type, content } = req.body;
    
    console.log('Creating file:', { name, size, type, contentLength: content?.length });
    
    if (!name || !size || !type) {
      return res.status(400).json({ message: 'Name, size, and type are required' });
    }
    
    // Clean content: remove null bytes and invalid UTF-8 characters
    let cleanContent = content;
    if (content) {
      cleanContent = content
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
        .trim();
    }
    
    const [file] = await sql`
      INSERT INTO files (user_id, name, size, type, content)
      VALUES (${req.user.id}, ${name}, ${size}, ${type}, ${cleanContent || null})
      RETURNING *`;
    
    console.log('File created successfully:', file.id);
    res.status(201).json(file);
  } catch (err) {
    console.error('Create file error:', err);
    res.status(500).json({ message: err.message });
  }
};

const deleteFile = async (req, res) => {
  try {
    await sql`DELETE FROM files WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ message: err.message });
  }
};

const getFileContent = async (req, res) => {
  try {
    const [file] = await sql`SELECT * FROM files WHERE id = ${req.params.id} AND user_id = ${req.user.id}`;
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json(file);
  } catch (err) {
    console.error('Get file content error:', err);
    res.status(500).json({ message: err.message });
  }
};

const updateFileSummary = async (req, res) => {
  try {
    const { summary, important_points } = req.body;
    const [file] = await sql`
      UPDATE files 
      SET summary = ${summary || null}, important_points = ${important_points || null}
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
      RETURNING *`;
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json(file);
  } catch (err) {
    console.error('Update file summary error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getFiles, createFile, deleteFile, getFileContent, updateFileSummary };
