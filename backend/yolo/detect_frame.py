"""
Simple YOLO + Pose detection script untuk per-frame processing
Input: image path
Output: JSON result
"""

import pathlib
pathlib.PosixPath = pathlib.WindowsPath

import sys
import json
import cv2
import torch
import mediapipe as mp
import numpy as np

# Load model
model = torch.hub.load(
    'ultralytics/yolov5',
    'custom',
    path='weights/best.pt',
    force_reload=False
)
model.conf = 0.4
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model.to(device)

# MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=True,
    model_complexity=0,
    min_detection_confidence=0.5
)

def detect_frame(image_path, output_path):
    """Detect frame dari image file"""
    try:
        # Read image
        frame = cv2.imread(image_path)
        if frame is None:
            return {'success': False, 'error': 'Failed to read image'}
        
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # YOLO Detection
        face_box = None
        results = model(rgb)
        df = results.pandas().xyxy[0]
        
        if len(df) > 0:
            det = df.iloc[0]
            x1, y1, x2, y2 = map(int, [det.xmin, det.ymin, det.xmax, det.ymax])
            confidence = float(det.confidence)
            face_box = {
                'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                'confidence': confidence
            }
        
        # Pose Detection
        direction = "DEPAN"
        pose_confidence = 0.0
        
        pose_result = pose.process(rgb)
        if pose_result.pose_landmarks:
            lm = pose_result.pose_landmarks.landmark
            
            nose = lm[mp_pose.PoseLandmark.NOSE]
            l_ear = lm[mp_pose.PoseLandmark.LEFT_EAR]
            r_ear = lm[mp_pose.PoseLandmark.RIGHT_EAR]
            
            dist_l = np.hypot(nose.x - l_ear.x, nose.y - l_ear.y)
            dist_r = np.hypot(nose.x - r_ear.x, nose.y - r_ear.y)
            
            ratio = (dist_r - dist_l) / (dist_r + dist_l + 1e-6)
            
            if ratio > 0.25:
                direction = "KIRI"
                pose_confidence = min(abs(ratio), 1.0)
            elif ratio < -0.25:
                direction = "KANAN"
                pose_confidence = min(abs(ratio), 1.0)
            else:
                direction = "DEPAN"
                pose_confidence = 1.0 - abs(ratio)
        
        # Return result
        result = {
            'success': True,
            'direction': direction,
            'confidence': pose_confidence,
            'face_detected': face_box is not None,
            'bbox': [face_box['x1'], face_box['y1'], face_box['x2'], face_box['y2']] if face_box else None
        }
        
        # Write to file
        with open(output_path, 'w') as f:
            json.dump(result, f)
        
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return {'success': False, 'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python detect_frame.py <image_path> <output_path>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_path = sys.argv[2]
    
    result = detect_frame(image_path, output_path)
    
    if not result['success']:
        print(f"Detection failed: {result.get('error', 'Unknown error')}")
        sys.exit(1)
    
    print("Detection completed successfully")
    sys.exit(0)
