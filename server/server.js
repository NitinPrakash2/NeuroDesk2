const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const { createUsersTable } = require('./models/User');
const { createTasksTable } = require('./models/Task');
const { createNotesTable } = require('./models/Note');
const { createMemoryTable } = require('./models/Memory');
const { createGoalsTable } = require('./models/Goal');
const { createFilesTable } = require('./models/File');
const { createChatHistoryTable } = require('./models/ChatHistory');
const { createNotificationsTable } = require('./models/Notification');

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    const allowed = (process.env.CLIENT_URL || 'http://localhost:5173,https://neuro-desk2.vercel.app').split(',');
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(null, true);
  },
  credentials: true
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/memories', require('./routes/memoryRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

const start = async () => {
  await connectDB();
  // Create all tables on startup
  await createUsersTable();
  await createTasksTable();
  await createNotesTable();
  await createMemoryTable();
  await createGoalsTable();
  await createFilesTable();
  await createChatHistoryTable();
  await createNotificationsTable();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
