const { sql } = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const [user] = await sql`SELECT id, name, email, notifications_cleared, created_at FROM users WHERE id = ${req.user.id}`;
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
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

module.exports = { getProfile, clearNotifications };
