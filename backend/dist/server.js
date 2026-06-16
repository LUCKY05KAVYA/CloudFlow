"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
console.log('SERVER TS IS RUNNING');
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cloudflow-secret-key-2026';
// ==================== MIDDLEWARE ====================
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static('uploads'));
// ==================== DATABASE ====================
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lucky05kavya_db_user:zNbuKhlgdCn7oSLd@cluster0.othhtdy.mongodb.net/?appName=Cluster0';
mongoose_1.default.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('MongoDB Error:', err));
// ==================== MODELS ====================
const userSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const User = mongoose_1.default.model('User', userSchema);
const taskSchema = new mongoose_1.default.Schema({
    taskName: { type: String, required: true },
    description: { type: String, default: '' },
    workflowType: { type: String, default: 'simple' },
    status: { type: String, default: 'PENDING' },
    fileUrl: { type: String, default: null },
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});
const Task = mongoose_1.default.model('Task', taskSchema);
// ==================== FILE UPLOAD ====================
const storage = multer_1.default.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage });
// ==================== AUTH MIDDLEWARE ====================
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
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
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    }
    catch (error) {
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
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// ==================== TASK ROUTES ====================
app.get('/tasks', authMiddleware, async (req, res) => {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
});
app.post('/tasks', upload.single('file'), authMiddleware, async (req, res) => {
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
app.put('/tasks/:id/complete', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
        if (!task)
            return res.status(404).json({ error: 'Task not found' });
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`🚀 CloudFlow Backend running on port ${PORT}`);
});
