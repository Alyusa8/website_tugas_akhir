import express from 'express';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Mock history data (in real app, this would come from database)
const historyData = [
  {
    id: 1,
    userId: 1,
    sessionId: 'session_1730000000000_1',
    detectionCount: 15,
    duration: '00:05:30',
    videoFile: 'detection_1730000000000.mp4',
    timestamp: new Date('2025-11-10T10:30:00Z'),
    detections: [
      { class: 'person', confidence: 0.95, time: '00:01:20' },
      { class: 'phone', confidence: 0.78, time: '00:03:45' }
    ]
  },
  {
    id: 2,
    userId: 1,
    sessionId: 'session_1729900000000_1',
    detectionCount: 8,
    duration: '00:03:15',
    videoFile: 'detection_1729900000000.mp4',
    timestamp: new Date('2025-11-09T14:20:00Z'),
    detections: [
      { class: 'person', confidence: 0.88, time: '00:00:30' }
    ]
  }
];

// Get all history for user with filtering
router.get('/', authenticateToken, (req, res) => {
  try {
    const { period = 'all', page = 1, limit = 10 } = req.query;
    
    let userHistory = historyData.filter(h => h.userId === req.user.userId);
    
    // Filter by time period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (period) {
      case 'today':
        userHistory = userHistory.filter(h => h.timestamp >= today);
        break;
      case 'yesterday':
        userHistory = userHistory.filter(h => 
          h.timestamp >= yesterday && h.timestamp < today
        );
        break;
      case 'week':
        userHistory = userHistory.filter(h => h.timestamp >= weekAgo);
        break;
      case 'month':
        userHistory = userHistory.filter(h => h.timestamp >= monthAgo);
        break;
    }

    // Sort by timestamp (most recent first)
    userHistory.sort((a, b) => b.timestamp - a.timestamp);

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = userHistory.slice(startIndex, endIndex);

    // Group by date for better UI organization
    const groupedHistory = {};
    paginatedHistory.forEach(item => {
      const dateKey = item.timestamp.toDateString();
      if (!groupedHistory[dateKey]) {
        groupedHistory[dateKey] = [];
      }
      groupedHistory[dateKey].push({
        id: item.id,
        sessionId: item.sessionId,
        detectionCount: item.detectionCount,
        duration: item.duration,
        timestamp: item.timestamp,
        videoFile: item.videoFile
      });
    });

    res.json({
      success: true,
      data: {
        groupedHistory,
        pagination: {
          currentPage: parseInt(page),
          totalItems: userHistory.length,
          totalPages: Math.ceil(userHistory.length / limit),
          itemsPerPage: parseInt(limit)
        },
        summary: {
          totalSessions: userHistory.length,
          totalDetections: userHistory.reduce((acc, h) => acc + h.detectionCount, 0),
          period: period
        }
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history data'
    });
  }
});

// Get specific history record details
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const record = historyData.find(h => h.id === recordId && h.userId === req.user.userId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'History record not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: record.id,
        sessionId: record.sessionId,
        detectionCount: record.detectionCount,
        duration: record.duration,
        timestamp: record.timestamp,
        videoFile: record.videoFile,
        detections: record.detections,
        summary: {
          mostDetectedClass: record.detections.reduce((acc, det) => {
            acc[det.class] = (acc[det.class] || 0) + 1;
            return acc;
          }, {}),
          averageConfidence: record.detections.length > 0 
            ? record.detections.reduce((acc, det) => acc + det.confidence, 0) / record.detections.length 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Get history detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history details'
    });
  }
});

// Delete history record
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const recordIndex = historyData.findIndex(h => h.id === recordId && h.userId === req.user.userId);

    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'History record not found'
      });
    }

    historyData.splice(recordIndex, 1);

    res.json({
      success: true,
      message: 'History record deleted successfully'
    });

  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete history record'
    });
  }
});

// Export history data
router.get('/export/:format', authenticateToken, (req, res) => {
  try {
    const { format } = req.params;
    const userHistory = historyData.filter(h => h.userId === req.user.userId);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="history-export.json"');
      res.json({
        exportDate: new Date().toISOString(),
        totalRecords: userHistory.length,
        data: userHistory
      });
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="history-export.csv"');
      
      let csv = 'ID,Session ID,Detection Count,Duration,Timestamp,Video File\n';
      userHistory.forEach(record => {
        csv += `${record.id},${record.sessionId},${record.detectionCount},"${record.duration}","${record.timestamp.toISOString()}","${record.videoFile || ''}"\n`;
      });
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export format. Use json or csv.'
      });
    }

  } catch (error) {
    console.error('Export history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export history data'
    });
  }
});

export default router;