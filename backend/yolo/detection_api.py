"""
Flask API untuk detection menggunakan YOLO + MediaPipe Pose
Mengganti custom_detection.py yang pakai webcam loop
"""

import pathlib
pathlib.PosixPath = pathlib.WindowsPath

import cv2
import torch
import mediapipe as mp
import numpy as np
import base64
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os

app = Flask(__name__)
CORS(app)

# Reduce logging noise
logging.getLogger('werkzeug').setLevel(logging.ERROR)

# 🆕 Get script directory untuk path file
script_dir = os.path.dirname(os.path.abspath(__file__))
weights_path = os.path.join(script_dir, 'weights', 'best.pt')

print(f"📍 Script directory: {script_dir}")
print(f"📍 Weights path: {weights_path}")
print(f"📍 Weights exists: {os.path.exists(weights_path)}")

# =========================
# LOAD MODEL ONCE (ON GPU)
# =========================
print("📦 Loading YOLOv5 model...")

# Set device BEFORE loading
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"🔧 Using device: {device}")

# Load model dengan GPU optimization
model = torch.hub.load(
    'ultralytics/yolov5',
    'custom',
    path=weights_path,
    force_reload=False
)

# 🆕 Optimasi GPU
model.to(device)
model.eval()  # Set to eval mode untuk inference
model.conf = 0.4
model.iou = 0.45

# Enable half precision (FP16) untuk inference lebih cepat di GPU
if device == 'cuda':
    model.half()
    print("✅ Using FP16 precision on GPU")

print(f"✅ Model loaded on {device}")

# =========================
# MEDIAPIPE POSE (CPU)
# =========================
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=0,  # Lightweight model
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# =========================
# HELPER FUNCTIONS
# =========================

def decode_base64_image(image_base64: str):
    """Decode base64 image ke numpy array (BGR)"""
    try:
        # Remove data URL prefix jika ada
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64
        img_bytes = base64.b64decode(image_base64)
        img_array = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if frame is None:
            raise ValueError("Failed to decode image")
        
        return frame
    except Exception as e:
        print(f"❌ Decode error: {e}")
        raise

def run_yolo_detection(frame):
    """Run YOLO detection pada GPU"""
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # 🆕 Inference dengan GPU (auto batching, faster)
    with torch.no_grad():
        results = model(rgb)
    
    df = results.pandas().xyxy[0]
    
    face_box = None
    if len(df) > 0:
        # Ambil detection dengan confidence tertinggi
        det = df.loc[df['confidence'].idxmax()]
        x1, y1, x2, y2 = int(det.xmin), int(det.ymin), int(det.xmax), int(det.ymax)
        confidence = float(det.confidence)
        
        face_box = {
            'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
            'confidence': confidence
        }
    
    return face_box

def detect_head_direction(frame):
    """Detect head direction using pose estimation (sama seperti custom_detection.py)"""
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pose_result = pose.process(rgb)
    
    direction = "DEPAN"
    confidence = 0.0
    
    if pose_result.pose_landmarks:
        lm = pose_result.pose_landmarks.landmark
        
        nose = lm[mp_pose.PoseLandmark.NOSE]
        l_ear = lm[mp_pose.PoseLandmark.LEFT_EAR]
        r_ear = lm[mp_pose.PoseLandmark.RIGHT_EAR]
        
        # Hitung jarak antara nose dan ears
        dist_l = np.hypot(nose.x - l_ear.x, nose.y - l_ear.y)
        dist_r = np.hypot(nose.x - r_ear.x, nose.y - r_ear.y)
        
        # Ratio positif: right ear lebih jauh = looking LEFT
        # Ratio negatif: left ear lebih jauh = looking RIGHT
        ratio = (dist_r - dist_l) / (dist_r + dist_l + 1e-6)
        
        # 🔥 THRESHOLD AGRESIF SAMA SEPERTI custom_detection.py
        if ratio > 0.25:
            direction = "KIRI"
            confidence = min(abs(ratio), 1.0)
        elif ratio < -0.25:
            direction = "KANAN"
            confidence = min(abs(ratio), 1.0)
        else:
            direction = "DEPAN"
            confidence = 1.0 - abs(ratio)
        
        print(f"🎯 Pose: ratio={ratio:.3f}, direction={direction}, conf={confidence:.2f}")
    
    return direction, confidence

# =========================
# API ENDPOINT
# =========================

@app.route('/detect', methods=['POST'])
def detect():
    """
    Endpoint untuk detection
    Input: {
        "image": "base64_encoded_image"
    }
    Output: {
        "status": "ok",
        "success": true,
        "direction": "DEPAN|KIRI|KANAN",
        "confidence": 0.95,
        "face_detected": true,
        "face_confidence": 0.95,
        "bbox": [x1, y1, x2, y2]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'message': 'Image data required'
            }), 400
        
        # Decode image
        frame = decode_base64_image(data['image'])
        
        # Run YOLO detection
        face_box = run_yolo_detection(frame)
        
        # Run Pose detection
        direction, conf = detect_head_direction(frame)
        
        # Prepare response
        response = {
            'status': 'ok',
            'success': True,
            'direction': direction,
            'confidence': float(conf),
            'face_detected': face_box is not None,
            'face_confidence': float(face_box['confidence']) if face_box else 0.0
        }
        
        # Add bbox jika ada
        if face_box:
            response['bbox'] = [
                face_box['x1'],
                face_box['y1'],
                face_box['x2'],
                face_box['y2']
            ]
        
        print(f"✅ Response: {direction}, face={face_box is not None}")
        return jsonify(response), 200
    
    except Exception as e:
        print(f"❌ Detection error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Detection failed',
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Python Detection API is running',
        'device': device
    }), 200

# =========================
# RUN SERVER
# =========================

if __name__ == '__main__':
    print("🚀 Starting Python Detection API on port 5001...")
    app.run(host='127.0.0.1', port=5001, debug=False)
