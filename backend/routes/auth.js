import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabaseAdmin } from '../lib/supabase.js';

const router = express.Router();

// Register endpoint (now using Supabase for verification)
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, fullName } = req.body;
      
      res.json({
        success: true,
        message: 'Registration handled by frontend Supabase client',
        note: 'User registration is now processed through Supabase Auth'
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }
);

// Login endpoint (now using Supabase for verification)
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      res.json({
        success: true,
        message: 'Login handled by frontend Supabase client',
        note: 'User authentication is now processed through Supabase Auth'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }
);

// Verify token middleware (now using Supabase)
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const user = await supabaseAdmin.verifyToken(token);
    req.user = { userId: user.id, email: user.email };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Get user profile (now using Supabase)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userProfile = await supabaseAdmin.getUserProfile(req.user.userId);
    
    res.json({
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.full_name,
        createdAt: userProfile.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

export default router;