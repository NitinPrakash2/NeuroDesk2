const { sql } = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const notifications = await sql`
      SELECT id, type, title, sub, icon, color, created_at 
      FROM notifications 
      WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC
      LIMIT 8
    `;
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addNotification = async (req, res) => {
  try {
    const { type, title, sub, icon, color } = req.body;
    const [notification] = await sql`
      INSERT INTO notifications (user_id, type, title, sub, icon, color)
      VALUES (${req.user.id}, ${type}, ${title}, ${sub}, ${icon}, ${color})
      RETURNING *
    `;
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getNotifications, addNotification };
