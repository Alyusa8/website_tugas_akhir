/**
 * History & Screenshot Service
 * Handles database operations untuk detection history dan auto screenshots
 */

import { supabaseAdmin } from './lib/supabase.js';

// =====================================================
// DETECTION HISTORY OPERATIONS
// =====================================================

/**
 * Insert detection history record
 * @param {Object} detectionData - Detection data
 * @returns {Promise<Object>}
 */
export async function insertDetectionHistory(detectionData) {
    const {
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
    } = detectionData;

    try {
        const { data, error } = await supabaseAdmin
            .from('detection_history')
            .insert([
                {
                    user_id: userId,
                    session_id: sessionId,
                    object_detected: objectDetected,
                    confidence: parseFloat(confidence),
                    direction: direction,
                    position_x: positionX,
                    position_y: positionY,
                    position_width: positionWidth,
                    position_height: positionHeight,
                    screenshot_id: screenshotId
                }
            ])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error inserting detection history:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get detection history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Record limit
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>}
 */
export async function getDetectionHistory(userId, limit = 100, offset = 0) {
    try {
        const { data, error } = await supabaseAdmin
            .from('detection_history')
            .select('*')
            .eq('user_id', userId)
            .order('detected_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting detection history:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get detection history for a specific session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>}
 */
export async function getSessionDetectionHistory(sessionId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('detection_history')
            .select('*')
            .eq('session_id', sessionId)
            .order('detected_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting session detection history:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get detection statistics by object type
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getDetectionStatsByObject(userId) {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('get_detection_stats_by_object', {
                p_user_id: userId
            });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting detection stats:', error);
        // Fallback: manual calculation if RPC not available
        return getDetectionHistoryStats(userId);
    }
}

// =====================================================
// AUTO SCREENSHOT OPERATIONS
// =====================================================

/**
 * Insert auto screenshot record
 * @param {Object} screenshotData - Screenshot data
 * @returns {Promise<Object>}
 */
export async function insertAutoScreenshot(screenshotData) {
    const {
        userId,
        sessionId,
        screenshotUrl,
        direction,
        triggerReason,
        detectionCount,
        objectsInFrame,
        fileSize
    } = screenshotData;

    try {
        const { data, error } = await supabaseAdmin
            .from('auto_screenshots')
            .insert([
                {
                    user_id: userId,
                    session_id: sessionId,
                    screenshot_url: screenshotUrl,
                    direction: direction,
                    trigger_reason: triggerReason,
                    detection_count: detectionCount || 0,
                    objects_in_frame: objectsInFrame || [],
                    file_size: fileSize,
                    processed: false
                }
            ])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error inserting auto screenshot:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get auto screenshots for a user
 * @param {string} userId - User ID
 * @param {number} limit - Record limit
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>}
 */
export async function getAutoScreenshots(userId, limit = 50, offset = 0) {
    try {
        const { data, error } = await supabaseAdmin
            .from('auto_screenshots')
            .select('*')
            .eq('user_id', userId)
            .order('captured_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting auto screenshots:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get auto screenshots for a specific session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array>}
 */
export async function getSessionAutoScreenshots(sessionId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('auto_screenshots')
            .select('*')
            .eq('session_id', sessionId)
            .order('captured_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting session auto screenshots:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update auto screenshot (mark as processed, update detection count, etc)
 * @param {string} screenshotId - Screenshot ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>}
 */
export async function updateAutoScreenshot(screenshotId, updateData) {
    try {
        const { data, error } = await supabaseAdmin
            .from('auto_screenshots')
            .update(updateData)
            .eq('id', screenshotId)
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error updating auto screenshot:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get unprocessed screenshots
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getUnprocessedScreenshots(userId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('auto_screenshots')
            .select('*')
            .eq('user_id', userId)
            .eq('processed', false)
            .order('captured_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting unprocessed screenshots:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// DETECTION STATISTICS OPERATIONS
// =====================================================

/**
 * Insert detection statistics for a session
 * @param {Object} statsData - Statistics data
 * @returns {Promise<Object>}
 */
export async function insertDetectionStatistics(statsData) {
    const {
        userId,
        sessionId,
        totalDetections,
        uniqueObjects,
        mostDetectedObject,
        averageConfidence,
        detectionByDirection,
        totalScreenshots,
        processingTime
    } = statsData;

    try {
        const { data, error } = await supabaseAdmin
            .from('detection_statistics')
            .insert([
                {
                    user_id: userId,
                    session_id: sessionId,
                    total_detections: totalDetections,
                    unique_objects: uniqueObjects,
                    most_detected_object: mostDetectedObject,
                    average_confidence: parseFloat(averageConfidence),
                    detection_by_direction: detectionByDirection,
                    total_screenshots: totalScreenshots,
                    processing_time: processingTime
                }
            ])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error inserting detection statistics:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get detection statistics for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>}
 */
export async function getSessionStatistics(sessionId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('detection_statistics')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting session statistics:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user summary statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getUserSummaryStatistics(userId) {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('get_user_summary_stats', {
                p_user_id: userId
            });

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error getting user summary statistics:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// COMBINED OPERATIONS
// =====================================================

/**
 * Get detections with associated screenshots
 * @param {string} userId - User ID
 * @param {number} limit - Record limit
 * @returns {Promise<Array>}
 */
export async function getDetectionsWithScreenshots(userId, limit = 100) {
    try {
        const { data, error } = await supabaseAdmin
            .from('detection_history')
            .select(`
                id,
                object_detected,
                confidence,
                direction,
                detected_at,
                auto_screenshots (
                    id,
                    screenshot_url,
                    trigger_reason
                )
            `)
            .eq('user_id', userId)
            .order('detected_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting detections with screenshots:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get session summary with all data
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>}
 */
export async function getSessionSummary(sessionId) {
    try {
        // Get session
        const { data: sessionData, error: sessionError } = await supabaseAdmin
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (sessionError) throw sessionError;

        // Get detections count
        const { count: detectionCount } = await supabaseAdmin
            .from('detection_history')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);

        // Get screenshots count
        const { count: screenshotCount } = await supabaseAdmin
            .from('auto_screenshots')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId);

        // Get statistics
        const { data: statsData } = await getSessionStatistics(sessionId);

        return {
            success: true,
            data: {
                session: sessionData,
                detectionCount,
                screenshotCount,
                statistics: statsData
            }
        };
    } catch (error) {
        console.error('Error getting session summary:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get detection history statistics (fallback if RPC not available)
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
async function getDetectionHistoryStats(userId) {
    try {
        const { data, error } = await supabaseAdmin
            .from('detection_history')
            .select('object_detected, confidence')
            .eq('user_id', userId);

        if (error) throw error;

        // Process data locally
        const stats = {};
        data.forEach(item => {
            if (!stats[item.object_detected]) {
                stats[item.object_detected] = {
                    object: item.object_detected,
                    count: 0,
                    confidences: []
                };
            }
            stats[item.object_detected].count++;
            stats[item.object_detected].confidences.push(item.confidence);
        });

        // Calculate averages
        const result = Object.values(stats).map(stat => ({
            object_detected: stat.object,
            total_detections: stat.count,
            avg_confidence: (stat.confidences.reduce((a, b) => a + b, 0) / stat.count).toFixed(2),
            max_confidence: Math.max(...stat.confidences),
            min_confidence: Math.min(...stat.confidences)
        }));

        return { success: true, data: result };
    } catch (error) {
        console.error('Error getting detection history stats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete old records (retention policy)
 * @param {number} daysOld - Delete records older than X days
 * @returns {Promise<Object>}
 */
export async function deleteOldRecords(daysOld = 30) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const deleteHistory = await supabaseAdmin
            .from('detection_history')
            .delete()
            .lt('created_at', cutoffDate.toISOString());

        const deleteScreenshots = await supabaseAdmin
            .from('auto_screenshots')
            .delete()
            .lt('created_at', cutoffDate.toISOString());

        return {
            success: true,
            deletedHistory: deleteHistory.count,
            deletedScreenshots: deleteScreenshots.count
        };
    } catch (error) {
        console.error('Error deleting old records:', error);
        return { success: false, error: error.message };
    }
}
