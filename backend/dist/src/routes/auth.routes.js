"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const router = express_1.default.Router();
// ================= REGISTER =================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, } = req.body;
        const existingUser = await user_model_1.default.findOne({
            email,
        });
        if (existingUser) {
            return res
                .status(400)
                .json({
                error: 'User already exists',
            });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = new user_model_1.default({
            name,
            email,
            password: hashedPassword,
        });
        await user.save();
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            role: user.role,
        }, process.env
            .JWT_SECRET, {
            expiresIn: '7d',
        });
        res
            .status(201)
            .json({
            token,
            role: user.role,
            user: {
                id: user._id,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('REGISTER ERROR:', error);
        res
            .status(500)
            .json({
            error: error.message ||
                'Registration failed',
        });
    }
});
// ================= LOGIN =================
router.post('/login', async (req, res) => {
    try {
        const { email, password, } = req.body;
        const user = await user_model_1.default.findOne({
            email,
        });
        if (!user) {
            return res
                .status(400)
                .json({
                error: 'Invalid credentials',
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res
                .status(400)
                .json({
                error: 'Invalid credentials',
            });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            role: user.role,
        }, process.env
            .JWT_SECRET, {
            expiresIn: '7d',
        });
        res.json({
            token,
            role: user.role,
            user: {
                id: user._id,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('LOGIN ERROR:', error);
        res
            .status(500)
            .json({
            error: 'Login failed',
        });
    }
});
exports.default = router;
