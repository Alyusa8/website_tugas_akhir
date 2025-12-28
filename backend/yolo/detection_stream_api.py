"""
Flask API untuk stream detection dari webcam real-time
Menggunakan YOLO + MediaPipe Pose sama seperti custom_detection.py
"""

import pathlib
pathlib.PosixPath = pathlib.WindowsPath

import cv2
import torch
import mediapipe as mp
import numpy as np
import os
import json
from flask import Flask, Response, jsonify
from flask_cors import CORS
import threading
import base64
from io import BytesIO

app = Flask(__name__)
CORS(app)

# 🆕 Get script directory untuk path file
script_dir = os.path.dirname(os.path.abspath(__file__))
weights_path = os.path.join(script_dir, 'weights', 'best.pt')

print(f"📍 Script directory: {script_dir}")
print(f"📍 Weights path: {weights_path}")
print(f"📍 Weights exists: {os.path.exists(weights_path)}")

# =========================
# LOAD MODEL (ON GPU)
# =========================
print("📦 Loading YOLOv5 model...")
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"🔧 Using device: {device}")

model = torch.hub.load(
    'ultralytics/yolov5',
    'custom',
    path=weights_path,
    force_reload=False
)
model.to(device)
model.eval()
model.conf = 0.4

if device == 'cuda':
    model.half()
    print("✅ Using FP16 precision on GPU")

print(f"✅ Model loaded on {device}")

# =========================
# MEDIAPIPE POSE
# =========================
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,  # Streaming mode
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# =========================
# GLOBAL STATE
# =========================
frame_lock = threading.Lock()
current_frame = None
current_result = {
    'direction': 'DEPAN',
    'confidence': 0.0,
    'face_detected': False,
    'bbox': None
}

# =========================
# CAMERA THREAD
# =========================
def capture_frames():
    """Background thread untuk capture dan process frames"""
    global current_frame, current_result
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    print("📹 Camera started")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # YOLO Detection
        with torch.no_grad():
            results = model(rgb)
        df = results.pandas().xyxy[0]
        
        face_box = None
        face_confidence = 0.0
        if len(df) > 0:
            det = df.iloc[0]
            x1, y1, x2, y2 = int(det.xmin), int(det.ymin), int(det.xmax), int(det.ymax)
            face_confidence = float(det.confidence)
            face_box = (x1, y1, x2, y2)
            
            # Draw bbox
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Pose Detection
        direction = "DEPAN"
        direction_confidence = 0.0
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
            direction_confidence = min(abs(ratio), 1.0)
            
            if ratio > 0.25:
                direction = "KIRI"
                color = (0, 0, 255)
            elif ratio < -0.25:
                direction = "KANAN"
                color = (0, 0, 255)
        
        # Draw label
        if face_box:
            x1, y1, x2, y2 = face_box
            cv2.putText(frame, direction, (x1 + 10, y1 + 25),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            cv2.putText(frame, f"{int(face_confidence * 100)}%", (x1 + 10, y1 + 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 1)
        
        # Update global state
        with frame_lock:
            current_frame = frame.copy()
            current_result = {
                'direction': direction,
                'confidence': float(direction_confidence),
                'face_detected': face_box is not None,
                'bbox': {
                    'x': face_box[0] / w if face_box else None,
                    'y': face_box[1] / h if face_box else None,
                    'width': (face_box[2] - face_box[0]) / w if face_box else None,
                    'height': (face_box[3] - face_box[1]) / h if face_box else None
                } if face_box else None,
                'face_confidence': face_confidence
            }
    
    cap.release()
    print("📹 Camera stopped")

# Start camera thread
camera_thread = threading.Thread(target=capture_frames, daemon=True)
camera_thread.start()

# =========================
# API ENDPOINTS
# =========================

@app.route('/video_feed')
def video_feed():
    """Stream video frames as MJPEG"""
    def generate():
        while True:
            with frame_lock:
                if current_frame is None:
                    continue
                frame = current_frame.copy()
            
            # Encode frame as JPEG
            ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            if not ret:
                continue
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n'
                   b'Content-length: ' + str(len(jpeg.tobytes())).encode() + b'\r\n\r\n'
                   + jpeg.tobytes() + b'\r\n')
    
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/detect_result')
def detect_result():
    """Get current detection result"""
    with frame_lock:
        return jsonify(current_result)

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'ok',
        'message': 'Stream Detection API running',
        'device': device
    })

# =========================
# RUN SERVER
# =========================

if __name__ == '__main__':
    print("🚀 Starting Stream Detection API on port 5002...")
    app.run(host='127.0.0.1', port=5002, debug=False, threaded=True)
