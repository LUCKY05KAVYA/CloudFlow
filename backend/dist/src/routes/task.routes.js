"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const task_controller_1 = require("../controllers/task.controller");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const role_middleware_1 = require("../middleware/role.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
router.get('/', task_controller_1.getTasks);
router.post('/', upload.single('file'), task_controller_1.createTask);
router.put('/:id/complete', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)([
    'MANAGER',
    'ADMIN',
]), router.get('/metrics', task_controller_1.getMetrics));
exports.default = router;
