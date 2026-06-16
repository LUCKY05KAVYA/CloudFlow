import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

console.log('SERVER TS IS RUNNING');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cloudflow-secret-key-2026';

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: '*', 
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ==================== DATABASE ====================
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lucky05kavya_db_user:zNbuKhlgdCn7oSLd@cluster0.othhtdy.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('MongoDB Error:', err));

// ==================== MODELS ====================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

const taskSchema = new mongoose.Schema({
  taskName: { type: String, required: true },
  description: { type: String, default: '' },
  workflowType: { type: String, default: 'simple' },
  status: { type: String, default: 'PENDING' },
  fileUrl: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', taskSchema);

// ==================== FILE UPLOAD ====================
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ==================== AUTH MIDDLEWARE ====================
const authMiddleware = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== ROUTES ====================
app.get('/', (req, res) => {
  res.json({ message: 'CloudFlow Backend is Running 🚀' });
});

// ==================== AUTH ROUTES ====================
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== TASK ROUTES ====================
app.get('/tasks', authMiddleware, async (req: any, res) => {
  const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(tasks);
});

app.post('/tasks', upload.single('file'), authMiddleware, async (req: any, res) => {
  try {
    const { taskName, description, workflowType } = req.body;

    if (!taskName?.trim()) {
      return res.status(400).json({ error: 'Task name is required' });
    }

    const newTask = await Task.create({
      taskName: taskName.trim(),
      description: description || '',
      workflowType: workflowType || 'simple',
      status: 'PENDING',
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      userId: req.userId,
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/tasks/:id/complete', authMiddleware, async (req: any, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    let workflowSteps = ['PENDING', 'COMPLETED'];
    if (task.workflowType === 'approval') {
      workflowSteps = ['PENDING', 'PENDING_APPROVAL', 'APPROVED', 'COMPLETED'];
    }
    if (task.workflowType === 'file') {
      workflowSteps = ['PENDING', 'UPLOADED', 'PROCESSING', 'COMPLETED'];
    }

    const currentIndex = workflowSteps.indexOf(task.status);
    if (currentIndex < workflowSteps.length - 1) {
      task.status = workflowSteps[currentIndex + 1];
      await task.save();
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 CloudFlow Backend running on port ${PORT}`);
});