import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/task.routes';
import authRoutes from './routes/auth.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({
    message:
      '🚀 CloudFlow Backend is running with clean architecture!',
  });
});

export default app;