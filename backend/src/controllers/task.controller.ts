import { Request, Response } from 'express';
import { Task } from '../models/task.model';

// Get all tasks for logged-in user
export const getTasks = async (req: any, res: Response) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Create new task
export const createTask = async (req: any, res: Response) => {
  try {
    const { taskName, description, workflowType } = req.body;

    const newTask = new Task({
      userId: req.user.userId,
      taskName,
      description: description || '',
      workflowType: workflowType || 'simple',
      status: 'PENDING',
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Mark task as complete
export const completeTask = async (req: any, res: Response) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { status: 'COMPLETED', completedAt: new Date() },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Get productivity metrics
export const getMetrics = async (req: any, res: Response) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    const completed = tasks.filter(t => t.status === 'COMPLETED');

    const metrics = {
      totalTasks: tasks.length,
      completedTasks: completed.length,
      completionRate: tasks.length > 0 
        ? Math.round((completed.length / tasks.length) * 100) 
        : 0,
      pendingTasks: tasks.filter(t => t.status === 'PENDING').length
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};