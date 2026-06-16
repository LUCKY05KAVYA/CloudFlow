"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetrics = exports.completeTask = exports.createTask = exports.getTasks = void 0;
const task_model_1 = require("../models/task.model");
// Get all tasks for logged-in user
const getTasks = async (req, res) => {
    try {
        const tasks = await task_model_1.Task.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};
exports.getTasks = getTasks;
// Create new task
const createTask = async (req, res) => {
    try {
        const { taskName, description, workflowType } = req.body;
        const newTask = new task_model_1.Task({
            userId: req.user.userId,
            taskName,
            description: description || '',
            workflowType: workflowType || 'simple',
            status: 'PENDING',
            fileUrl: req.file ? `/uploads/${req.file.filename}` : null
        });
        await newTask.save();
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create task' });
    }
};
exports.createTask = createTask;
// Mark task as complete
const completeTask = async (req, res) => {
    try {
        const task = await task_model_1.Task.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, { status: 'COMPLETED', completedAt: new Date() }, { new: true });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};
exports.completeTask = completeTask;
// Get productivity metrics
const getMetrics = async (req, res) => {
    try {
        const tasks = await task_model_1.Task.find({ userId: req.user.userId });
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
};
exports.getMetrics = getMetrics;
