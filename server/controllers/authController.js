const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sql } = require('../config/db');
const nodemailer = require('nodemailer');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (name, email, password) VALUES (${name}, ${email}, ${hashed})
      RETURNING id, name
    `;
    res.status(201).json({ token: generateToken(user.id), name: user.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ token: generateToken(user.id), name: user.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [user] = await sql`SELECT * FROM users WHERE id = ${req.user.id}`;
    if (!user || !(await bcrypt.compare(currentPassword, user.password)))
      return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password = ${hashed} WHERE id = ${req.user.id}`;
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyPassword = async (req, res) => {
  const { password } = req.body;
  try {
    const [user] = await sql`SELECT * FROM users WHERE id = ${req.user.id}`;
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Password is incorrect' });

    res.json({ message: 'Password verified' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await sql`DELETE FROM users WHERE id = ${req.user.id}`;
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const contact = async (req, res) => {
  const { subject, message } = req.body;
  try {
    const [user] = await sql`SELECT name, email FROM users WHERE id = ${req.user.id}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `NeuroDesk Support: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5A67D8;">New Support Message</h2>
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #2d3748; margin-top: 0;">Message:</h3>
            <p style="color: #4a5568; line-height: 1.6;">${message}</p>
          </div>
          <p style="color: #718096; font-size: 12px; margin-top: 20px;">This message was sent from NeuroDesk Support Form</p>
        </div>
      `,
      replyTo: user.email
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Message sent successfully. We\'ll get back to you soon!' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
};

module.exports = { register, login, changePassword, verifyPassword, deleteAccount, contact };
