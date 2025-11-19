require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();

// --- CONFIGURATION AND MIDDLEWARE ---
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_super_secret_key';

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(bodyParser.json());

// --- IN-MEMORY DATA (FOR TESTING PURPOSES) ---
let users = [
  { id: 'user123', email: 'test@user.com', name: 'Intern Developer', password: 'hashedpassword123', title: 'Frontend Developer Intern' }
];

let tasks = [
  { id: 1, userId: 'user123', title: 'Implement Login API', description: 'Connect login form to /api/auth/login.', completed: true, priority: 'High' },
  { id: 2, userId: 'user123', title: 'Design Dashboard UI', description: 'Use TailwindCSS for responsiveness.', completed: false, priority: 'High' },
  { id: 3, userId: 'user123', title: 'Write Scalability Note', description: 'Document scaling strategy for frontend/backend.', completed: false, priority: 'Medium' },
  { id: 4, userId: 'user123', title: 'Set up Database Connection', description: 'Configure MongoDB or Postgres.', completed: true, priority: 'Low' },
];
let nextTaskId = tasks.length + 1;

// --- DATABASE CONNECTION ---
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI); // Use URI from .env
    console.log('MongoDB connected successfully.');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}
connectDB();

// --- JWT AUTH MIDDLEWARE ---
const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    const user = users.find(u => u.id === req.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Not authorized, user not found.' });

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter all fields.' });
  }

  if (users.find(u => u.email === email)) {
    return res.status(409).json({ success: false, message: 'User already exists.' });
  }

  const hashedPassword = 'hashed' + password; // Mock hash for testing
  const newUser = { id: `user${Date.now()}`, name, email, password: hashedPassword, title: 'New Member' };
  users.push(newUser);

  const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1h' });

  res.status(201).json({
    success: true,
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, title: newUser.title }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ success: false, message: 'Please enter all fields.' });

  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ success: false, message: 'Invalid credentials (User not found).' });

  const isMatch = ('hashed' + password) === user.password;
  if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials (Wrong password).' });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, title: user.title }
  });
});

// --- PROFILE ROUTES ---
app.get('/api/profile', protect, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'Profile not found.' });

  const { password, ...profile } = user;
  res.status(200).json({ success: true, user: profile });
});

app.put('/api/profile', protect, (req, res) => {
  const { name, title } = req.body;
  let userIndex = users.findIndex(u => u.id === req.userId);

  if (userIndex === -1) return res.status(404).json({ success: false, message: 'Profile not found.' });

  users[userIndex].name = name || users[userIndex].name;
  users[userIndex].title = title || users[userIndex].title;

  const { password, ...profile } = users[userIndex];
  res.status(200).json({ success: true, message: 'Profile updated successfully.', user: profile });
});

// --- TASK CRUD ROUTES ---
app.get('/api/tasks', protect, (req, res) => {
  const userTasks = tasks.filter(t => t.userId === req.userId);
  res.status(200).json({ success: true, tasks: userTasks });
});

app.post('/api/tasks', protect, (req, res) => {
  const { title, description, priority, completed = false } = req.body;

  if (!title || !priority) return res.status(400).json({ success: false, message: 'Title and priority are required.' });

  const newTask = { id: nextTaskId++, userId: req.userId, title, description: description || '', priority, completed };
  tasks.push(newTask);

  res.status(201).json({ success: true, task: newTask });
});

app.put('/api/tasks/:id', protect, (req, res) => {
  const taskId = parseInt(req.params.id);
  const updateData = req.body;
  let taskIndex = tasks.findIndex(t => t.id === taskId && t.userId === req.userId);

  if (taskIndex === -1) return res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });

  tasks[taskIndex] = { ...tasks[taskIndex], ...updateData, id: taskId, userId: req.userId };
  res.status(200).json({ success: true, task: tasks[taskIndex] });
});

app.delete('/api/tasks/:id', protect, (req, res) => {
  const taskId = parseInt(req.params.id);
  const initialLength = tasks.length;
  tasks = tasks.filter(t => !(t.id === taskId && t.userId === req.userId));

  if (tasks.length === initialLength) return res.status(404).json({ success: false, message: 'Task not found or unauthorized.' });

  res.status(200).json({ success: true, message: 'Task deleted successfully.' });
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access your React app at http://localhost:3000 or http://localhost:5173`);
});
