#!/usr/bin/env python
"""
Test script to check if Flask can start without importing heavy dependencies
"""
import sys
import traceback

print("=" * 60)
print("FLASK STARTUP TEST")
print("=" * 60)

# Test 1: Check basic imports
print("\n[TEST 1] Testing basic imports...")
try:
    from flask import Flask
    print("✅ Flask import OK")
except Exception as e:
    print(f"❌ Flask import FAILED: {e}")
    traceback.print_exc()

# Test 2: Check pathlib fix
print("\n[TEST 2] Testing pathlib fix...")
try:
    import pathlib
    pathlib.PosixPath = pathlib.WindowsPath
    print("✅ Pathlib fix OK")
except Exception as e:
    print(f"❌ Pathlib fix FAILED: {e}")
    traceback.print_exc()

# Test 3: Check torch/cuda
print("\n[TEST 3] Testing PyTorch...")
try:
    import torch
    print(f"✅ PyTorch import OK")
    print(f"   CUDA available: {torch.cuda.is_available()}")
    print(f"   Device: {'cuda' if torch.cuda.is_available() else 'cpu'}")
except Exception as e:
    print(f"❌ PyTorch import FAILED: {e}")
    traceback.print_exc()

# Test 4: Check cv2
print("\n[TEST 4] Testing OpenCV...")
try:
    import cv2
    print(f"✅ OpenCV import OK")
    print(f"   Version: {cv2.__version__}")
except Exception as e:
    print(f"❌ OpenCV import FAILED: {e}")
    traceback.print_exc()

# Test 5: Check mediapipe
print("\n[TEST 5] Testing MediaPipe...")
try:
    import mediapipe as mp
    print(f"✅ MediaPipe import OK")
except Exception as e:
    print(f"❌ MediaPipe import FAILED: {e}")
    traceback.print_exc()

# Test 6: Check camera access
print("\n[TEST 6] Testing camera access...")
try:
    cap = cv2.VideoCapture(0)
    if cap.isOpened():
        print(f"✅ Camera accessible")
        cap.release()
    else:
        print(f"❌ Camera NOT accessible - cap.isOpened() returned False")
except Exception as e:
    print(f"❌ Camera access FAILED: {e}")
    traceback.print_exc()

# Test 7: Check supabase client
print("\n[TEST 7] Testing Supabase client...")
try:
    from supabase import create_client
    print(f"✅ Supabase import OK")
except Exception as e:
    print(f"❌ Supabase import FAILED: {e}")
    traceback.print_exc()

# Test 8: Check supabase_client module
print("\n[TEST 8] Testing detection supabase_client module...")
try:
    import supabase_client
    print(f"✅ supabase_client module import OK")
except Exception as e:
    print(f"❌ supabase_client module import FAILED: {e}")
    traceback.print_exc()

# Test 9: Check YOLOv5 model loading
print("\n[TEST 9] Testing YOLOv5 model loading (may take time)...")
try:
    print("   Loading model - please wait...")
    model = torch.hub.load(
        'ultralytics/yolov5',
        'custom',
        path='weights/best.pt',
        force_reload=False
    )
    print(f"✅ YOLOv5 model loaded successfully")
except Exception as e:
    print(f"❌ YOLOv5 model loading FAILED: {e}")
    traceback.print_exc()

# Test 10: Check Flask app creation
print("\n[TEST 10] Testing Flask app creation...")
try:
    app = Flask(__name__)
    
    @app.route('/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200
    
    print(f"✅ Flask app created successfully")
    print(f"   App name: {app.name}")
except Exception as e:
    print(f"❌ Flask app creation FAILED: {e}")
    traceback.print_exc()

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
