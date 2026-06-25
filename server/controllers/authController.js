const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { sql } = require('../config/db');
const nodemailer = require('nodemailer');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      RETURNING id, name, email
    `;
    res.status(201).json({ token: generateToken(user.id), name: user.name, email: user.email, has_password: true });
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

    res.json({ token: generateToken(user.id), name: user.name, email: user.email, avatar: user.avatar, has_password: !!user.password });
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

const googleLogin = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: google_id, given_name, family_name, email, picture } = payload;
    const fullName = [given_name, family_name].filter(Boolean).join(' ');
    console.log('Google payload:', JSON.stringify({ name: payload.name, given_name, family_name, fullName, email }));

    let [user] = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (user) {
      await sql`UPDATE users SET google_id = ${google_id}, name = ${fullName}, avatar = ${picture} WHERE id = ${user.id}`;
      user.name = fullName;
      user.avatar = picture;
    } else {
      [user] = await sql`
        INSERT INTO users (name, email, google_id, avatar, password)
        VALUES (${fullName}, ${email}, ${google_id}, ${picture}, NULL)
        RETURNING id, name, email, avatar
      `;
    }

    res.json({ token: generateToken(user.id), name: user.name, email: user.email, avatar: user.avatar, has_password: !!user.password });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ message: 'Google authentication failed: ' + err.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [user] = await sql`SELECT id, name, email FROM users WHERE email = ${email}`;
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await sql`UPDATE users SET reset_otp = ${otp}, reset_otp_expiry = ${expiry.toISOString()} WHERE id = ${user.id}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'NeuroDesk - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://ui-avatars.com/api/?name=ND&background=5A67D8&color=fff&size=64" style="border-radius: 12px;" />
            <h2 style="color: #1a202c; margin: 15px 0 5px;">Password Reset</h2>
            <p style="color: #718096; font-size: 14px;">Enter this OTP to reset your NeuroDesk password</p>
          </div>
          <div style="background: #f7fafc; border-radius: 16px; padding: 30px; text-align: center; border: 1px solid #e2e8f0;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #5A67D8; font-family: monospace;">${otp}</div>
            <p style="color: #a0aec0; font-size: 12px; margin-top: 20px;">This OTP expires in 10 minutes</p>
          </div>
          <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [user] = await sql`SELECT reset_otp, reset_otp_expiry FROM users WHERE email = ${email}`;
    if (!user) return res.status(404).json({ message: 'No account found' });
    if (!user.reset_otp || user.reset_otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > new Date(user.reset_otp_expiry)) return res.status(400).json({ message: 'OTP has expired' });

    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed' });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    const [user] = await sql`SELECT id, reset_otp, reset_otp_expiry FROM users WHERE email = ${email}`;
    if (!user) return res.status(404).json({ message: 'No account found' });
    if (!user.reset_otp || user.reset_otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > new Date(user.reset_otp_expiry)) return res.status(400).json({ message: 'OTP has expired' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const hashed = await bcrypt.hash(password, 10);
    await sql`UPDATE users SET password = ${hashed}, reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ${user.id}`;

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Reset failed' });
  }
};

const sendOtp = async (req, res) => {
  try {
    const [user] = await sql`SELECT email FROM users WHERE id = ${req.user.id}`;
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await sql`UPDATE users SET reset_otp = ${otp}, reset_otp_expiry = ${expiry.toISOString()} WHERE id = ${req.user.id}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'NeuroDesk - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://ui-avatars.com/api/?name=ND&background=5A67D8&color=fff&size=64" style="border-radius: 12px;" />
            <h2 style="color: #1a202c; margin: 15px 0 5px;">Verify Your Identity</h2>
            <p style="color: #718096; font-size: 14px;">Use this OTP to verify your identity and change your password</p>
          </div>
          <div style="background: #f7fafc; border-radius: 16px; padding: 30px; text-align: center; border: 1px solid #e2e8f0;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #5A67D8; font-family: monospace;">${otp}</div>
            <p style="color: #a0aec0; font-size: 12px; margin-top: 20px;">This OTP expires in 10 minutes</p>
          </div>
          <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

const changePasswordVerified = async (req, res) => {
  const { otp, newPassword } = req.body;
  try {
    const [user] = await sql`SELECT reset_otp, reset_otp_expiry FROM users WHERE id = ${req.user.id}`;
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.reset_otp || user.reset_otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > new Date(user.reset_otp_expiry)) return res.status(400).json({ message: 'OTP has expired' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password = ${hashed}, reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ${req.user.id}`;

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, googleLogin, changePassword, verifyPassword, deleteAccount, contact, forgotPassword, verifyOtp, resetPassword, sendOtp, changePasswordVerified };
