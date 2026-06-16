import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  taskName: { type: String, required: true },
  description: { type: String, default: '' },
  workflowType: { type: String, default: 'simple' },
  status: { type: String, default: 'PENDING' },
  fileUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

export const Task = mongoose.model('Task', taskSchema);