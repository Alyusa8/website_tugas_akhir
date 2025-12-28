import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import detectionRoutes from './routes/detection.js';
import historyRoutes from './routes/history.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global variable untuk Python process
let pythonProcess = null;

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
// app.use(helmet()); // DISABLED temporarily untuk debug

// Rate limiting - tapi EXCLUDE detection endpoint
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Naikkan limit
  skip: (req, res) => {
    // SKIP rate limit untuk detection frame endpoint
    return req.path === '/api/detection/frame';
  },
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration - HARUS SEBELUM ROUTES
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded images/videos
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/history', historyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Eye Exam Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// ============= Python YOLO Detection API Auto-Start =============
/**
 * Start Python detection API process
 * Runs: python yolo/detection_api_v2.py on port 5001
 */
function startPythonDetectionAPI() {
  const pythonScriptPath = path.join(__dirname, 'yolo', 'detection_api_v2.py');
  const yoloDir = path.join(__dirname, 'yolo');
  
  console.log('🤖 Starting Python YOLO Detection API...');
  console.log(`   Script: ${pythonScriptPath}`);
  
  // Spawn Python process - use shell: false to properly handle spaces in paths
  pythonProcess = spawn('python', [pythonScriptPath], {
    cwd: yoloDir,
    stdio: 'inherit', // Pipe output to console
    shell: false, // Let Node.js handle path escaping
    windowsHide: false
  });

  // Handle process errors
  pythonProcess.on('error', (err) => {
    console.error('❌ Failed to start Python API:', err.message);
    console.error('   Make sure Python is installed and detection_api_v2.py exists');
  });

  // Handle process exit
  pythonProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.warn(`⚠️  Python API process exited with code ${code}, signal ${signal}`);
    }
    pythonProcess = null;
  });

  // Handle process close
  pythonProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`⚠️  Python API closed with code ${code}`);
    }
  });

  console.log('✅ Python YOLO Detection API started (PID: ' + pythonProcess.pid + ')');
}

/**
 * Stop Python detection API process
 */
function stopPythonDetectionAPI() {
  if (pythonProcess) {
    console.log('Stopping Python YOLO Detection API...');
    pythonProcess.kill('SIGTERM');
    pythonProcess = null;
    console.log('✅ Python YOLO Detection API stopped');
  }
}
// ================================================================

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Eye Exam Backend Server is running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  
  // Auto-start Python YOLO Detection API
  startPythonDetectionAPI();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  stopPythonDetectionAPI();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  stopPythonDetectionAPI();
  process.exit(0);
});