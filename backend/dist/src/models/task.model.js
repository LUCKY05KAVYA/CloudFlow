"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const taskSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    taskName: { type: String, required: true },
    description: { type: String, default: '' },
    workflowType: { type: String, default: 'simple' },
    status: { type: String, default: 'PENDING' },
    fileUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
});
exports.Task = mongoose_1.default.model('Task', taskSchema);
