const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { createUsersTable } = require('./models/User');
const { createTasksTable } = require('./models/Task');
const { createNotesTable } = require('./models/Note');
const { createMemoryTable } = require('./models/Memory');
const { createGoalsTable } = require('./models/Goal');

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/memories', require('./routes/memoryRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

const start = async () => {
  await connectDB();
  // Create all tables on startup
  await createUsersTable();
  await createTasksTable();
  await createNotesTable();
  await createMemoryTable();
  await createGoalsTable();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();
