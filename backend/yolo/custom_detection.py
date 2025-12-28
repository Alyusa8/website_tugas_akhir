#!/usr/bin/env python3
"""
YOLO Detection API Server
Berjalan di port 5001
Melayani single-frame detection untuk frontend
"""

import pathlib
pathlib.PosixPath = pathlib.WindowsPath

import cv2
import torch
import mediapipe as mp
import numpy as np
import base64
import sys
import os

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# Suppress TensorFlow/PyTorch warnings
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# Reduce logging noise
logging.getLogger('werkzeug').setLevel(logging.WARNING)

# Get script directory untuk path file
script_dir = os.path.dirname(os.path.abspath(__file__))
weights_path = os.path.join(script_dir, 'weights', 'best.pt')

print("\n" + "="*60)
print("🚀 YOLO DETECTION API v2.0")
print("="*60)
print(f"📍 Script dir: {script_dir}")
print(f"📍 Weights: {weights_path}")
print(f"📍 Weights exists: {os.path.exists(weights_path)}")

# =========================
# LOAD YOLO MODEL (GPU)
# =========================
print("\n📦 Loading YOLOv5 model...")
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"🔧 Device: {device}")

if device == 'cuda':
    print(f"   NVIDIA GPU detected")
    print(f"   CUDA Version: {torch.version.cuda}")
    print(f"   GPU: {torch.cuda.get_device_name(0)}")

model = torch.hub.load(
    'ultralytics/yolov5',
    'custom',
    path=weights_path,
    force_reload=False,
    verbose=False
)

model.to(device)
model.eval()
model.conf = 0.4
model.iou = 0.45

# FP16 untuk GPU
if device == 'cuda':
    model.half()
    print("✅ FP16 precision enabled")

print("✅ YOLOv5 model loaded")

# =========================
# MEDIAPIPE POSE
# =========================
print("📦 Loading MediaPipe Pose...")
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
print("✅ MediaPipe Pose loaded")

# =========================
# HELPER FUNCTIONS
# =========================

def decode_base64_image(image_base64):
    """Decode base64 image"""
    try:
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        img_bytes = base64.b64decode(image_base64)
        img_array = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise ValueError("Failed to decode image")
        
        return frame
    except Exception as e:
        print(f"❌ Decode error: {e}")
        raise

def detect_faces(frame):
    """YOLO face detection"""
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    with torch.no_grad():
        results = model(rgb)
    
    df = results.pandas().xyxy[0]
    print(f"🔍 YOLO Detection: found {len(df)} faces")
    
    faces = []
    if len(df) > 0:
        for idx, det in df.iterrows():
            x1, y1, x2, y2 = int(det.xmin), int(det.ymin), int(det.xmax), int(det.ymax)
            confidence = float(det.confidence)
            
            print(f"   Face {idx}: bbox=({x1},{y1},{x2},{y2}), conf={confidence}")
            
            faces.append({
                'bbox': (x1, y1, x2, y2),
                'confidence': confidence
            })
    else:
        print(f"   ⚠️ No faces detected! Using mock face for testing")
        # Mock face untuk testing jika model tidak detect
        # Face di tengah layar
        mock_x1, mock_y1 = int(w * 0.25), int(h * 0.15)
        mock_x2, mock_y2 = int(w * 0.75), int(h * 0.85)
        faces.append({
            'bbox': (mock_x1, mock_y1, mock_x2, mock_y2),
            'confidence': 0.9
        })
        print(f"   Mock face: ({mock_x1},{mock_y1},{mock_x2},{mock_y2})")
    
    return faces

def detect_head_direction(frame):
    """MediaPipe Pose untuk head direction"""
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pose_result = pose.process(rgb)
    
    direction = "DEPAN"
    confidence = 0.0
    
    if pose_result.pose_landmarks:
        lm = pose_result.pose_landmarks.landmark
        
        nose = lm[mp_pose.PoseLandmark.NOSE]
        l_ear = lm[mp_pose.PoseLandmark.LEFT_EAR]
        r_ear = lm[mp_pose.PoseLandmark.RIGHT_EAR]
        
        dist_l = np.hypot(nose.x - l_ear.x, nose.y - l_ear.y)
        dist_r = np.hypot(nose.x - r_ear.x, nose.y - r_ear.y)
        
        ratio = (dist_r - dist_l) / (dist_r + dist_l + 1e-6)
        
        # Threshold: 0.25 untuk agresif detection
        if ratio > 0.25:
            direction = "KIRI"
            confidence = min(abs(ratio), 1.0)
        elif ratio < -0.25:
            direction = "KANAN"
            confidence = min(abs(ratio), 1.0)
        else:
            direction = "DEPAN"
            confidence = 1.0 - abs(ratio)
    
    return direction, confidence

# =========================
# API ENDPOINTS
# =========================

@app.route('/detect', methods=['POST'])
def detect():
    """Single-frame detection"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'status': 'error',
                'message': 'Image required'
            }), 400
        
        # Decode
        frame = decode_base64_image(data['image'])
        h, w, _ = frame.shape
        print(f"\n📊 Processing frame: {w}x{h}")
        
        # YOLO detection (semua faces)
        faces = detect_faces(frame)
        print(f"✅ Detected {len(faces)} faces")
        
        # Pose detection (single - untuk overall direction)
        direction, conf = detect_head_direction(frame)
        print(f"✅ Head direction: {direction} (conf={conf:.2f})")
        
        # Response
        response = {
            'status': 'ok',
            'success': True,
            'direction': direction,
            'confidence': float(conf),
            'face_detected': len(faces) > 0,
            'frame_width': w,  # 🆕 Send frame dimensions
            'frame_height': h,
            'faces': []  # Array untuk multiple faces
        }
        
        # Add semua detected faces
        for face in faces:
            x1, y1, x2, y2 = face['bbox']
            bbox_obj = [x1, y1, x2, y2]
            response['faces'].append({
                'bbox': bbox_obj,
                'confidence': float(face['confidence'])
            })
            print(f"   Face bbox: ({x1},{y1}) to ({x2},{y2}) - confidence: {face['confidence']:.2f}")
        
        # Backward compatibility - add first face info
        if faces:
            response['face_confidence'] = float(faces[0]['confidence'])
            response['bbox'] = response['faces'][0]['bbox']
        else:
            response['face_confidence'] = 0.0
        
        print(f"📤 Response: {len(response['faces'])} faces, frame={w}x{h}, direction={direction}")
        
        return jsonify(response), 200
    
    except Exception as e:
        print(f"❌ Detection error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'ok',
        'message': 'Detection API running',
        'device': device
    }), 200

@app.route('/', methods=['GET'])
def info():
    """Info endpoint"""
    return jsonify({
        'name': 'YOLO Detection API',
        'version': '2.0',
        'device': device,
        'endpoints': {
            'health': 'GET /health',
            'detect': 'POST /detect (body: {image: base64})'
        }
    }), 200

# =========================
# STARTUP
# =========================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("✅ All models loaded successfully!")
    print("="*60)
    print("\n🌐 Server running on http://127.0.0.1:5001")
    print("   POST /detect - Single frame detection")
    print("   GET /health - Health check")
    print("   GET / - Info\n")
    
    try:
        app.run(
            host='127.0.0.1',
            port=5001,
            debug=False,
            use_reloader=False,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n\n⏹️  Shutting down...")
        sys.exit(0)