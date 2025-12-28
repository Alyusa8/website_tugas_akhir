import pathlib
pathlib.PosixPath = pathlib.WindowsPath

import cv2
import torch
import mediapipe as mp
import numpy as np
from flask import Flask, Response, request, jsonify
import threading
import time
from datetime import datetime
import sys
import os

# Import Supabase client
from supabase_client import (
    create_session, finish_session, upload_screenshot,
    save_screenshot_record, update_preview_image
)

app = Flask(__name__)

# Global state
camera_lock = threading.Lock()
active_stream = False
cap = None

# Session tracking
current_session_id = None
current_user_id = None

# Direction tracking for screenshot logic
direction_tracker = {
    'current_direction': 'DEPAN',
    'direction_start_time': None,
    'last_screenshot_direction': None,
    'last_screenshot_time': None,
    'screenshot_cooldown': 5  # seconds between screenshots for same direction
}

# Screenshot threshold (seconds)
SCREENSHOT_DELAY = 3.5  # 3-4 seconds

# =========================
# YOLOv5
# =========================
print("Loading YOLOv5 model...")
model = torch.hub.load(
    'ultralytics/yolov5',
    'custom',
    path='weights/best.pt',
    force_reload=False
)
model.conf = 0.4
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model.to(device)
print(f"Model loaded on {device}")

# =========================
# MEDIAPIPE POSE
# =========================
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

def init_camera():
    """Initialize camera with 720p settings"""
    global cap
    if cap is not None:
        cap.release()
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    if not cap.isOpened():
        raise RuntimeError("Failed to open camera")
    
    return cap

def should_capture_screenshot(direction):
    """
    Determine if a screenshot should be captured based on direction persistence
    
    Args:
        direction: Current detected direction (KIRI, KANAN, or DEPAN)
        
    Returns:
        bool: True if screenshot should be captured
    """
    global direction_tracker
    
    current_time = time.time()
    
    # Only capture for KIRI or KANAN
    if direction not in ['KIRI', 'KANAN']:
        direction_tracker['current_direction'] = direction
        direction_tracker['direction_start_time'] = None
        return False
    
    # Check if direction changed
    if direction != direction_tracker['current_direction']:
        direction_tracker['current_direction'] = direction
        direction_tracker['direction_start_time'] = current_time
        return False
    
    # Direction hasn't changed - check duration
    if direction_tracker['direction_start_time'] is None:
        direction_tracker['direction_start_time'] = current_time
        return False
    
    duration = current_time - direction_tracker['direction_start_time']
    
    # Check if enough time has passed
    if duration < SCREENSHOT_DELAY:
        return False
    
    # Check cooldown to prevent duplicate screenshots
    if direction_tracker['last_screenshot_direction'] == direction:
        if direction_tracker['last_screenshot_time'] is not None:
            time_since_last = current_time - direction_tracker['last_screenshot_time']
            if time_since_last < direction_tracker['screenshot_cooldown']:
                return False
    
    # All checks passed - capture screenshot
    direction_tracker['last_screenshot_direction'] = direction
    direction_tracker['last_screenshot_time'] = current_time
    direction_tracker['direction_start_time'] = None  # Reset for next detection
    
    return True

def capture_and_save_screenshot(frame, direction):
    """
    Capture screenshot and save to Supabase
    
    Args:
        frame: OpenCV frame to save
        direction: Direction detected (KIRI or KANAN)
    """
    global current_session_id, current_user_id
    
    if not current_session_id or not current_user_id:
        print("⚠️ No active session - screenshot not saved")
        return
    
    try:
        # Encode frame to PNG
        ret, buffer = cv2.imencode('.png', frame)
        if not ret:
            print("❌ Failed to encode frame")
            return
        
        image_bytes = buffer.tobytes()
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
        filename = f"{direction}_{timestamp}.png"
        
        # Upload to Supabase Storage
        image_url = upload_screenshot(current_user_id, current_session_id, image_bytes, filename)
        
        # Save record to database
        save_screenshot_record(current_session_id, image_url, direction)
        
        # Update preview image if not set
        update_preview_image(current_session_id, image_url)
        
        print(f"📸 Screenshot captured: {direction} at {timestamp}")
        
    except Exception as e:
        print(f"❌ Error capturing screenshot: {e}")

def generate_frames():
    """Generate MJPEG frames with YOLO detection and yaw analysis"""
    global active_stream, cap
    
    try:
        cap = init_camera()
        
        while active_stream:
            with camera_lock:
                if cap is None or not cap.isOpened():
                    break
                    
                ret, frame = cap.read()
                if not ret:
                    print("Failed to read frame")
                    break

            h, w, _ = frame.shape
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # =========================
            # YOLO FACE DETECTION
            # =========================
            results = model(rgb)
            df = results.pandas().xyxy[0]

            face_box = None
            if len(df) > 0:
                det = df.iloc[0]
                x1, y1, x2, y2 = map(int, [det.xmin, det.ymin, det.xmax, det.ymax])
                face_box = (x1, y1, x2, y2)
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            # =========================
            # POSE & YAW ANALYSIS
            # =========================
            direction = "DEPAN"
            color = (0, 255, 0)

            pose_result = pose.process(rgb)
            if pose_result.pose_landmarks:
                lm = pose_result.pose_landmarks.landmark

                nose = lm[mp_pose.PoseLandmark.NOSE]
                l_ear = lm[mp_pose.PoseLandmark.LEFT_EAR]
                r_ear = lm[mp_pose.PoseLandmark.RIGHT_EAR]

                dist_l = np.hypot(nose.x - l_ear.x, nose.y - l_ear.y)
                dist_r = np.hypot(nose.x - r_ear.x, nose.y - r_ear.y)

                ratio = (dist_r - dist_l) / (dist_r + dist_l + 1e-6)

                # THRESHOLD
                if ratio > 0.25:
                    direction = "KIRI"
                    color = (0, 0, 255)
                elif ratio < -0.25:
                    direction = "KANAN"
                    color = (0, 0, 255)

            # =========================
            # SCREENSHOT LOGIC
            # =========================
            if should_capture_screenshot(direction):
                capture_and_save_screenshot(frame.copy(), direction)

            # =========================
            # VISUALIZATION
            # =========================
            if face_box:
                x1, y1, x2, y2 = face_box
                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2

                # Direction label
                cv2.putText(frame, direction, (x1 + 10, y1 + 25),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

                # Direction arrow
                if direction == "KANAN":
                    cv2.arrowedLine(frame, (cx, cy), (cx - 80, cy), color, 4)
                elif direction == "KIRI":
                    cv2.arrowedLine(frame, (cx, cy), (cx + 80, cy), color, 4)

            # Encode frame to JPEG
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if not ret:
                continue
                
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    except Exception as e:
        print(f"Error in generate_frames: {e}")
    finally:
        cleanup_camera()

def cleanup_camera():
    """Release camera resources"""
    global cap
    with camera_lock:
        if cap is not None:
            cap.release()
            cap = None
        print("Camera released")

def reset_direction_tracker():
    """Reset direction tracker state"""
    global direction_tracker
    direction_tracker = {
        'current_direction': 'DEPAN',
        'direction_start_time': None,
        'last_screenshot_direction': None,
        'last_screenshot_time': None,
        'screenshot_cooldown': 5
    }

@app.route('/stream')
def video_feed():
    """MJPEG stream endpoint"""
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/start', methods=['POST'])
def start_stream():
    """Start detection stream and create session"""
    global active_stream, current_session_id, current_user_id
    
    try:
        # Get user_id from request
        data = request.get_json() or {}
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'status': 'error',
                'message': 'user_id is required'
            }), 400
        
        # Create session in Supabase
        session = create_session(user_id)
        current_session_id = session['id']
        current_user_id = user_id
        
        # Reset direction tracker
        reset_direction_tracker()
        
        # Start streaming
        active_stream = True
        
        return jsonify({
            'status': 'started',
            'message': 'Detection stream started',
            'session_id': current_session_id
        })
        
    except Exception as e:
        print(f"Error starting stream: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/stop', methods=['POST'])
def stop_stream():
    """Stop detection stream and finish session"""
    global active_stream, current_session_id, current_user_id
    
    try:
        # Finish session in Supabase
        if current_session_id:
            finish_session(current_session_id)
            print(f"Session finished: {current_session_id}")
        
        # Stop streaming
        active_stream = False
        cleanup_camera()
        
        # Reset session info
        session_id = current_session_id
        current_session_id = None
        current_user_id = None
        
        # Reset direction tracker
        reset_direction_tracker()
        
        return jsonify({
            'status': 'stopped',
            'message': 'Detection stream stopped',
            'session_id': session_id
        })
        
    except Exception as e:
        print(f"Error stopping stream: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/status', methods=['GET'])
def get_status():
    """Get stream status"""
    return jsonify({
        'active': active_stream,
        'session_id': current_session_id,
        'user_id': current_user_id
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for initialization detection"""
    return jsonify({'status': 'ok', 'ready': True}), 200

if __name__ == '__main__':
    print("Starting Flask detection server on port 5001...")
    print("Features enabled:")
    print("  - YOLOv5 face detection")
    print("  - MediaPipe head orientation")
    print("  - Auto screenshot on KIRI/KANAN (3-4s persistence)")
    print("  - Supabase session tracking")
    app.run(host='0.0.0.0', port=5001, threaded=True, debug=False)
