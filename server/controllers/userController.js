const bcrypt = require('bcryptjs');
const { sql } = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const [user] = await sql`SELECT id, name, email, avatar, password, notifications_cleared, created_at FROM users WHERE id = ${req.user.id}`;
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, avatar: user.avatar, has_password: !!user.password, notifications_cleared: user.notifications_cleared, created_at: user.created_at });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const clearNotifications = async (req, res) => {
  try {
    await sql`DELETE FROM notifications WHERE user_id = ${req.user.id}`;
    await sql`UPDATE users SET notifications_cleared = TRUE WHERE id = ${req.user.id}`;
    res.json({ message: 'Notifications cleared permanently' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  const { name } = req.body;
  try {
    await sql`UPDATE users SET name = ${name} WHERE id = ${req.user.id}`;
    const [user] = await sql`SELECT id, name, email, avatar FROM users WHERE id = ${req.user.id}`;
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const setPassword = async (req, res) => {
  const { password } = req.body;
  try {
    const [user] = await sql`SELECT password FROM users WHERE id = ${req.user.id}`;
    if (user.password) return res.status(400).json({ message: 'Password already set' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const hashed = await bcrypt.hash(password, 10);
    await sql`UPDATE users SET password = ${hashed} WHERE id = ${req.user.id}`;
    res.json({ message: 'Password created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, clearNotifications, updateProfile, setPassword };
