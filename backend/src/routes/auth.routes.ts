import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

const router = express.Router();

// ================= REGISTER =================
router.post(
  '/register',
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body;

      const existingUser =
        await User.findOne({
          email,
        });

      if (existingUser) {
        return res
          .status(400)
          .json({
            error:
              'User already exists',
          });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user =
        new User({
          name,
          email,
          password:
            hashedPassword,
        });

      await user.save();

      const token =
        jwt.sign(
          {
            userId:
              user._id,

            role:
              user.role,
          },

          process.env
            .JWT_SECRET!,

          {
            expiresIn:
              '7d',
          }
        );

      res
        .status(201)
        .json({
          token,

          role:
            user.role,

          user: {
            id: user._id,
            email:
              user.email,
          },
        });

    } catch (
      error: any
    ) {
      console.error(
        'REGISTER ERROR:',
        error
      );

      res
        .status(500)
        .json({
          error:
            error.message ||
            'Registration failed',
        });
    }
  }
);

// ================= LOGIN =================
router.post(
  '/login',
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      const user =
        await User.findOne({
          email,
        });

      if (!user) {
        return res
          .status(400)
          .json({
            error:
              'Invalid credentials',
          });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isMatch) {
        return res
          .status(400)
          .json({
            error:
              'Invalid credentials',
          });
      }

      const token =
        jwt.sign(
          {
            userId:
              user._id,

            role:
              user.role,
          },

          process.env
            .JWT_SECRET!,

          {
            expiresIn:
              '7d',
          }
        );

      res.json({
        token,
        role:
          user.role,

        user: {
          id: user._id,
          email:
            user.email,
        },
      });

    } catch (
      error: any
    ) {
      console.error(
        'LOGIN ERROR:',
        error
      );

      res
        .status(500)
        .json({
          error:
            'Login failed',
        });
    }
  }
);

export default router;