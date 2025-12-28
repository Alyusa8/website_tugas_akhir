import express from 'express';
import multer from 'multer';
import path from 'path';
import { spawn } from 'child_process';
import { authenticateToken } from './auth.js';
import fs from 'fs';
import os from 'os';

const router = express.Router();

// Global Python process management
let pythonProcess = null;
const PYTHON_STREAM_URL = 'http://localhost:5001';
const PYTHON_STREAM_API_URL = 'http://localhost:5002'; // 🆕 Stream API

// Configure multer for video/image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|mp4|webm|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Mock detection results storage
const detectionResults = [];

// Start detection session
router.post('/start', authenticateToken, async (req, res) => {
  try {
    console.log('=== Start Detection Session ===');
    console.log('User ID:', req.user.userId);
    
    // Start Python detection server if not already running
    if (!pythonProcess) {
      console.log('Starting Python detection server...');
      
      pythonProcess = spawn('python', ['yolo/detection_stream.py'], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let pythonStdout = '';
      let pythonStderr = '';

      pythonProcess.stdout.on('data', (data) => {
        pythonStdout += data.toString();
        console.log('[Python STDOUT]', data.toString());
      });

      pythonProcess.stderr.on('data', (data) => {
        pythonStderr += data.toString();
        console.error('[Python STDERR]', data.toString());
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        pythonProcess = null;
      });

      pythonProcess.on('exit', (code, signal) => {
        console.log(`Python process exited with code ${code}, signal ${signal}`);
        pythonProcess = null;
      });

      // Wait for Flask server to be ready with retries
      let serverReady = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const checkResponse = await fetch(`${PYTHON_STREAM_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
          });
          
          if (checkResponse.ok) {
            serverReady = true;
            console.log('Python Flask server is ready!');
            break;
          }
        } catch (e) {
          console.log(`Health check attempt ${i + 1}/10 failed, retrying...`);
        }
      }
      
      if (!serverReady) {
        throw new Error('Python Flask server failed to start after 10 seconds. Check Python logs above.');
      }
    }

    const sessionId = 'session_' + Date.now() + '_' + req.user.userId;
    
    console.log('Sending start request to Python server...');
    
    // Tell Python to start streaming with user_id
    const response = await fetch(`${PYTHON_STREAM_URL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: req.user.userId
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python API error:', response.status, errorText);
      throw new Error(`Python API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    console.log(`Started detection session: ${sessionId} for user: ${req.user.userId}`);
    
    res.json({
      success: true,
      message: 'Detection session started',
      sessionId: sessionId,
      supabaseSessionId: data.session_id,
      streamUrl: `${PYTHON_STREAM_URL}/stream`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('=== Start Detection Error ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to start detection session',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Stop detection session and save results
router.post('/stop', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Tell Python to stop streaming
    try {
      await fetch(`${PYTHON_STREAM_URL}/stop`, {
        method: 'POST'
      });
    } catch (err) {
      console.log('Python server may already be stopped:', err.message);
    }

    console.log(`Stopped detection session: ${sessionId}`);

    res.json({
      success: true,
      message: 'Detection session stopped',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stop detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop detection session'
    });
  }
});

// Process frame for real-time detection
router.post('/process-frame', authenticateToken, upload.single('frame'), (req, res) => {
  try {
    // Mock YOLO detection results
    // In real implementation, this would process the frame with YOLO model
    const mockDetections = [
      {
        class: 'person',
        confidence: 0.95,
        bbox: { x: 100, y: 50, width: 200, height: 300 },
        timestamp: new Date().toISOString()
      },
      {
        class: 'phone',
        confidence: 0.78,
        bbox: { x: 250, y: 100, width: 80, height: 120 },
        timestamp: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      detections: Math.random() > 0.7 ? mockDetections : [], // Randomly return detections
      frameProcessed: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Process frame error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process frame'
    });
  }
});

// Get detection statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const userResults = detectionResults.filter(r => r.userId === req.user.userId);
    
    const stats = {
      totalSessions: userResults.length,
      totalDetections: userResults.reduce((acc, r) => acc + r.detections.length, 0),
      lastSession: userResults.length > 0 ? userResults[userResults.length - 1].createdAt : null,
      averageDetectionsPerSession: userResults.length > 0 
        ? userResults.reduce((acc, r) => acc + r.detections.length, 0) / userResults.length 
        : 0
    };

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get detection statistics'
    });
  }
});

// Get user's session history from Supabase
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { supabase } = await import('../lib/supabase.js');
    const userId = req.user.userId;

    // Fetch sessions with screenshot count
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        started_at,
        ended_at,
        preview_image,
        status
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;

    // Get screenshot counts for each session
    const sessionsWithCounts = await Promise.all(
      (sessions || []).map(async (session) => {
        const { count, error: countError } = await supabase
          .from('session_screenshots')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);

        return {
          ...session,
          screenshot_count: count || 0
        };
      })
    );

    res.json({
      success: true,
      sessions: sessionsWithCounts
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history'
    });
  }
});

// Get session details with all screenshots
router.get('/history/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { supabase } = await import('../lib/supabase.js');
    const { sessionId } = req.params;
    const userId = req.user.userId;

    // Fetch session with screenshots
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) throw sessionError;
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Fetch screenshots for this session
    const { data: screenshots, error: screenshotsError } = await supabase
      .from('session_screenshots')
      .select('*')
      .eq('session_id', sessionId)
      .order('captured_at', { ascending: true });

    if (screenshotsError) throw screenshotsError;

    res.json({
      success: true,
      session: {
        ...session,
        screenshots: screenshots || []
      }
    });

  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session details'
    });
  }
});

// Delete session and its screenshots
router.delete('/history/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { supabase } = await import('../lib/supabase.js');
    const { sessionId } = req.params;
    const userId = req.user.userId;

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get all screenshots to delete from storage
    const { data: screenshots } = await supabase
      .from('session_screenshots')
      .select('image_url')
      .eq('session_id', sessionId);

    // Delete screenshot files from storage
    if (screenshots && screenshots.length > 0) {
      const filePaths = screenshots.map(s => {
        // Extract path from URL: https://...storage.../bucket/path -> path
        const url = new URL(s.image_url);
        const pathParts = url.pathname.split('/');
        return pathParts.slice(pathParts.indexOf('detection-screenshots') + 1).join('/');
      });

      await supabase.storage
        .from('detection-screenshots')
        .remove(filePaths);
    }

    // Delete screenshots records (will cascade due to foreign key)
    const { error: screenshotsDeleteError } = await supabase
      .from('session_screenshots')
      .delete()
      .eq('session_id', sessionId);

    if (screenshotsDeleteError) throw screenshotsDeleteError;

    // Delete session
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session'
    });
  }
});

// ==========================================
// ENDPOINT: /api/detection/stream
// ==========================================
router.get('/stream', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_STREAM_API_URL}/video_feed`, {
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`Stream API error: ${response.status}`);
    }

    // Forward the stream
    res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
    response.body.pipe(res);

  } catch (error) {
    console.error('Stream error:', error.message);
    res.status(500).json({ 
      status: 'error',
      message: 'Stream unavailable'
    });
  }
});

// ==========================================
// ENDPOINT: /api/detection/stream-result
// ==========================================
router.get('/stream-result', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_STREAM_API_URL}/detect_result`, {
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`Stream API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Stream result error:', error.message);
    res.status(500).json({ 
      status: 'error',
      message: 'Detection result unavailable'
    });
  }
});
router.post('/frame', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'No image' });
    }

    // 🆕 Try to call Python detection API with timeout
    let pythonData = null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // Increased to 5s
      
      const pythonResponse = await fetch(`${PYTHON_STREAM_URL}/detect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (pythonResponse.ok) {
        pythonData = await pythonResponse.json();
        console.log('✅ Python API response:', pythonData.direction);
      } else {
        console.warn(`⚠️ Python API returned ${pythonResponse.status}`);
      }
    } catch (pythonError) {
      console.warn('⚠️ Python API error:', pythonError.message);
    }

    // If Python API returns data, use it. Otherwise use mock data
    if (pythonData && pythonData.success) {
      console.log('✅ Python API response:', {
        direction: pythonData.direction,
        detections_count: pythonData.detections?.length || 0,
        frame_size: `${pythonData.frame_width}x${pythonData.frame_height}`
      });
      
      // Ensure frame dimensions exist (fallback to default)
      const frameWidth = pythonData.frame_width || 1280;
      const frameHeight = pythonData.frame_height || 720;
      
      // Convert detections array to faces array format
      const faces = pythonData.detections ? pythonData.detections.map(det => ({
        bbox: det.bbox,
        confidence: det.yolo_confidence || 0.8,
        direction: det.direction
      })) : [];
      
      res.json({
        status: 'ok',
        success: true,
        direction: pythonData.direction || 'DEPAN',
        confidence: pythonData.confidence || 0.8,
        face_detected: faces.length > 0,
        frame_width: frameWidth,
        frame_height: frameHeight,
        faces: faces,
        face_confidence: faces.length > 0 ? faces[0].confidence : 0,
        message: 'Frame processed (Real YOLO)'
      });
    } else {
      // Fallback: Return mock data untuk testing
      console.warn('⚠️ Using mock data');
      
      const directions = ['KIRI', 'DEPAN', 'KANAN'];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      const confidence = 0.75 + Math.random() * 0.25;
      
      // Mock faces array
      const mockFaces = [
        {
          bbox: [320, 150, 620, 600],  // [x1, y1, x2, y2] in pixel coordinates
          confidence: confidence
        }
      ];
      
      res.json({
        status: 'ok',
        success: true,
        direction: randomDirection,
        confidence: confidence,
        face_detected: true,
        frame_width: 1280,  // 🆕 Mock data also needs frame dimensions
        frame_height: 720,
        faces: mockFaces,
        face_confidence: confidence,
        message: 'Frame processed (Mock data - Python API offline)'
      });
    }

  } catch (error) {
    console.error('Frame error:', error.message);
    res.status(500).json({ 
      status: 'error',
      success: false,
      message: error.message 
    });
  }
});

// Cleanup on process exit
process.on('exit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

process.on('SIGINT', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit();
});

export default router;