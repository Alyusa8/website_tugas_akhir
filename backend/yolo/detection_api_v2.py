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
import warnings
warnings.filterwarnings('ignore')

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)
logging.getLogger('werkzeug').setLevel(logging.WARNING)

# Path model
script_dir = os.path.dirname(os.path.abspath(__file__))
weights_path = os.path.join(script_dir, 'weights', 'best.pt')

# Load device
device = 'cuda' if torch.cuda.is_available() else 'cpu'

# Load YOLO model
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

if device == 'cuda':
    model.half()

# Load MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# =========================
# Helper Functions
# =========================

def decode_base64_image(image_base64):
    try:
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        img_bytes = base64.b64decode(image_base64)
        img_array = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Gagal decode gambar")
        return frame
    except Exception as e:
        raise ValueError(f"Decode error: {str(e)}")

def detect_faces(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    with torch.no_grad():
        results = model(rgb)

    df = results.pandas().xyxy[0]
    faces = []
    for _, det in df.iterrows():
        x1, y1, x2, y2 = int(det.xmin), int(det.ymin), int(det.xmax), int(det.ymax)
        faces.append({
            "bbox": (x1, y1, x2, y2),
            "confidence": float(det.confidence)
        })
    return faces

def detect_head_direction(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = pose.process(rgb)
    direction = "DEPAN"
    confidence = 0.0

    if res.pose_landmarks:
        lm = res.pose_landmarks.landmark
        nose = lm[mp_pose.PoseLandmark.NOSE]
        left_ear = lm[mp_pose.PoseLandmark.LEFT_EAR]
        right_ear = lm[mp_pose.PoseLandmark.RIGHT_EAR]
        
        dist_l = ((nose.x - left_ear.x)**2 + (nose.y - left_ear.y)**2)**0.5
        dist_r = ((nose.x - right_ear.x)**2 + (nose.y - right_ear.y)**2)**0.5
        
        if dist_l + dist_r > 0:
            ratio = (dist_r - dist_l) / (dist_r + dist_l)
            if ratio > 0.2:
                direction = "KIRI"
            elif ratio < -0.2:
                direction = "KANAN"
            else:
                direction = "DEPAN"
            confidence = min(abs(ratio), 1.0)
        else:
            confidence = 0.0
    
    return direction, float(confidence)

# =========================
# API Endpoint
# =========================

@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"success": False, "status": "error", "message": "Gambar wajib dikirim"}), 400

        frame = decode_base64_image(data['image'])
        h, w, _ = frame.shape
        
        faces = detect_faces(frame)

        detections = []
        trigger_side = False
        direction_overall = "DEPAN"  # Default direction

        for face in faces:
            x1, y1, x2, y2 = face["bbox"]
            head_crop = frame[y1:y2, x1:x2]
            if head_crop.size == 0:
                continue

            direction, conf = detect_head_direction(head_crop)

            detections.append({
                "bbox": [x1, y1, x2, y2],
                "yolo_confidence": face["confidence"],
                "direction": direction,
                "pose_confidence": conf,
                "timestamp": 0  # untuk tracking di frontend nanti
            })

            if direction in ["KIRI", "KANAN"]:
                trigger_side = True
                direction_overall = direction  # Update overall direction

        return jsonify({
            "status": "ok",
            "success": True,
            "direction": direction_overall,  # 🆕 Add overall direction
            "frame_width": w,  # 🆕 Add frame dimensions
            "frame_height": h,
            "multi_person": len(detections),
            "trigger_direction_detected": trigger_side,
            "detections": detections
        }), 200

    except Exception as e:
        return jsonify({"success": False, "status": "error", "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "API berjalan", "device": device}), 200

@app.route('/', methods=['GET'])
def info():
    return jsonify({"name": "YOLO Detection API", "version": "2.0", "device": device}), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=False, threaded=True)
