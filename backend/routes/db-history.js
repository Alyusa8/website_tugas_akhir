/**
 * Database-Integrated History Routes
 * API endpoints untuk management history dan auto screenshots dengan Supabase
 */

import express from 'express';
import { authenticateToken } from './auth.js';
import {
    insertDetectionHistory,
    getDetectionHistory,
    getSessionDetectionHistory,
    getDetectionStatsByObject,
    insertAutoScreenshot,
    getAutoScreenshots,
    getSessionAutoScreenshots,
    updateAutoScreenshot,
    getUnprocessedScreenshots,
    insertDetectionStatistics,
    getSessionStatistics,
    getUserSummaryStatistics,
    getDetectionsWithScreenshots,
    getSessionSummary
} from '../lib/historyService.js';

const router = express.Router();

// =====================================================
// DETECTION HISTORY ENDPOINTS
// =====================================================

/**
 * POST /db-history/detection
 * Insert new detection history
 */
router.post('/detection', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId, objectDetected, confidence, direction, positionX, positionY, positionWidth, positionHeight, screenshotId } = req.body;

        if (!sessionId || !objectDetected || !direction) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await insertDetectionHistory({
            userId,
            sessionId,
            objectDetected,
            confidence,
            direction,
            positionX,
            positionY,
            positionWidth,
            positionHeight,
            screenshotId
        });

        if (result.success) {
            res.status(201).json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /db-history/detection
 * Get detection history for user
 */
router.get('/detection', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 100, offset = 0 } = req.query;

        const result = await getDetectionHistory(userId, parseInt(limit), parseInt(offset));
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /db-history/detection/:sessionId
 * Get detection history for specific session
 */
router.get('/detection/:sessionId', authenticateToken, async (req, res) => {
    try {
        const result = await getSessionDetectionHistory(req.params.sessionId);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /db-history/stats/by-object
 * Get detection statistics by object type
 */
router.get('/stats/by-object', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await getDetectionStatsByObject(userId);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// AUTO SCREENSHOT ENDPOINTS
// =====================================================

/**
 * POST /db-history/screenshot
 * Insert new auto screenshot
 */
router.post('/screenshot', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId, screenshotUrl, direction, triggerReason, detectionCount, objectsInFrame, fileSize } = req.body;

        if (!sessionId || !screenshotUrl || !direction || !triggerReason) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await insertAutoScreenshot({
            userId,
            sessionId,
            screenshotUrl,
            direction,
            triggerReason,
            detectionCount,
            objectsInFrame,
            fileSize
        });

        if (result.success) {
            res.status(201).json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /db-history/screenshot
 * Get auto screenshots for user
 */
router.get('/screenshot', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 50, offset = 0 } = req.query;

        const result = await getAutoScreenshots(userId, parseInt(limit), parseInt(offset));
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /db-history/screenshot/:sessionId
 * Get auto screenshots for specific session
 */
router.get('/screenshot/:sessionId', authenticateToken, async (req, res) => {
    try {
        const result = await getSessionAutoScreenshots(req.params.sessionId);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /db-history/screenshot/:screenshotId
 * Update auto screenshot
 */
router.patch('/screenshot/:screenshotId', authenticateToken, async (req, res) => {
    try {
        const result = await updateAutoScreenshot(req.params.screenshotId, req.body);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /db-history/screenshot/unprocessed
 * Get unprocessed screenshots
 */
router.get('/screenshot/unprocessed', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await getUnprocessedScreenshots(userId);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// DETECTION STATISTICS ENDPOINTS
// =====================================================

/**
 * POST /db-history/statistics
 * Insert detection statistics
 */
router.post('/statistics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId, totalDetections, uniqueObjects, mostDetectedObject, averageConfidence, detectionByDirection, totalScreenshots, processingTime } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'sessionId is required' });
        }

        const result = await insertDetectionStatistics({
            userId,
            sessionId,
            totalDetections,
            uniqueObjects,
            mostDetectedObject,
            averageConfidence,
            detectionByDirection,
            totalScreenshots,
            processingTime
        });

        if (result.success) {
            res.status(201).json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /db-history/statistics/:sessionId
 * Get statistics for specific session
 */
router.get('/statistics/:sessionId', authenticateToken, async (req, res) => {
    try {
        const result = await getSessionStatistics(req.params.sessionId);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /db-history/statistics/user/summary
 * Get user summary statistics
 */
router.get('/statistics/user/summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await getUserSummaryStatistics(userId);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// COMBINED DATA ENDPOINTS
// =====================================================

/**
 * GET /db-history/combined/detections-with-screenshots
 * Get detections with associated screenshots
 */
router.get('/combined/detections-with-screenshots', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 100 } = req.query;

        const result = await getDetectionsWithScreenshots(userId, parseInt(limit));
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /db-history/combined/session-summary/:sessionId
 * Get complete session summary
 */
router.get('/combined/session-summary/:sessionId', authenticateToken, async (req, res) => {
    try {
        const result = await getSessionSummary(req.params.sessionId);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
