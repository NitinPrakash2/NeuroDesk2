const { sql } = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const [user] = await sql`SELECT id, name, email, created_at FROM users WHERE id = ${req.user.id}`;
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile };
