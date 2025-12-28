import { NavLink } from "react-router";
import { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import { detectionHelpers } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper: Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function Detection() {
  const { user } = useAuth();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [detectionResult, setDetectionResult] = useState<any>(null);
  
  // 🆕 TAHAP 2: Logika waktu
  const [lastDirection, setLastDirection] = useState<string>("");
  const [directionStartTime, setDirectionStartTime] = useState<number>(0);
  const [directionDuration, setDirectionDuration] = useState<number>(0);
  
  // 🆕 TAHAP 3: Screenshot capture
  const [screenshots, setScreenshots] = useState<Array<{ timestamp: number; direction: string; image: string }>>([]);
  const capturedDirectionsRef = useRef<Set<string>>(new Set());
  
  // 🆕 TAHAP 4: Session detection
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionEndTime, setSessionEndTime] = useState<number>(0);
  
  // Sticky direction - track rapid direction changes
  const lastDirectionTimeRef = useRef<number>(0);
  const stickyDirectionRef = useRef<string>("");
  const DIRECTION_DEBOUNCE = 800; // ms - ignore direction changes within 800ms
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });
  
  // Webcam setup
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(resolve => {
          videoRef.current!.onloadedmetadata = () => {
            const w = videoRef.current!.videoWidth;
            const h = videoRef.current!.videoHeight;
            console.log(`📐 Video actual size: ${w}x${h}`);
            
            // Update canvas size to match video
            if (canvasRef.current) {
              canvasRef.current.width = w;
              canvasRef.current.height = h;
            }
            if (overlayCanvasRef.current) {
              overlayCanvasRef.current.width = w;
              overlayCanvasRef.current.height = h;
            }
            
            setVideoSize({ width: w, height: h });
            resolve(null);
          };
        });
      }
      console.log('✅ Webcam started');
    } catch (err: any) {
      console.error('❌ Webcam error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Browser permission ditolak. Izinkan akses kamera!');
      } else if (err.name === 'NotFoundError') {
        setError('Webcam tidak ditemukan!');
      } else {
        setError('Gagal mengakses webcam: ' + err.message);
      }
      throw err;
    }
  };
  
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };
  
  // Send frame to backend
  const sendFrame = async (canvas: HTMLCanvasElement) => {
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.5);
      
      const response = await fetch(`${API_URL}/api/detection/frame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      
      console.log('🔍 Full response data from backend:', data);
      console.log('   frame_width:', data.frame_width);
      console.log('   frame_height:', data.frame_height);
      console.log('   faces count:', data.faces?.length);
      console.log('   faces:', data.faces);
      
      // Handle BOTH old and new API response formats
      let processedData = data;
      
      // 🔥 NEW FORMAT: Array detections[] (per-bbox with unique direction each)
      if (data.status === 'ok' && data.detections && Array.isArray(data.detections)) {
        console.log('✅ NEW FORMAT detected: detections[] array');
        console.log('📥 Received data:', JSON.stringify(data, null, 2));
        
        // Convert new format (detections[]) to faces array format
        processedData = {
          ...data,
          direction: data.detections.length > 0 ? data.detections[0].direction : 'DEPAN',
          faces: data.detections.map((det: any) => ({
            bbox: [det.x1, det.y1, det.x2, det.y2],
            direction: det.direction,
            confidence: det.confidence || det.face_confidence || 0.8,
            face_confidence: det.face_confidence || 0.8
          }))
        };
        
        console.log('🔄 Converted detections[] to faces array');
        console.log('   Total faces:', processedData.faces.length);
        processedData.faces.forEach((f: any, i: number) => {
          console.log(`   Face ${i}: direction=${f.direction}, confidence=${f.confidence}`);
        });
      }
      // 🔄 OLD FORMAT: Single detection with direction field
      else if (data.status === 'ok' && data.direction) {
        console.log('✅ OLD FORMAT detected: single direction');
        console.log('📥 Received data:', JSON.stringify(data, null, 2));
        console.log('📐 Frame dimensions from backend:', data.frame_width, 'x', data.frame_height);
        
        // Convert faces array format
        if (data.faces && Array.isArray(data.faces) && data.faces.length > 0) {
          // Faces already in correct format - just ensure bbox is valid
          const backendW = data.frame_width || 1280;
          const backendH = data.frame_height || 720;
          const videoW = videoSize.width;
          const videoH = videoSize.height;
          
          console.log(`📏 Scale factor: backend=${backendW}x${backendH}, video=${videoW}x${videoH}`);
          
          // Scale bboxes if backend frame size differs from video size
          const scaleX = videoW / backendW;
          const scaleY = videoH / backendH;
          
          processedData = {
            ...data,
            faces: data.faces.map((face: any) => {
              const [x1, y1, x2, y2] = face.bbox;
              // Scale coordinates to match video display size
              const scaledBbox = [
                Math.round(x1 * scaleX),
                Math.round(y1 * scaleY),
                Math.round(x2 * scaleX),
                Math.round(y2 * scaleY)
              ];
              
              console.log(`🔄 Scaled bbox: [${x1},${y1},${x2},${y2}] → [${scaledBbox[0]},${scaledBbox[1]},${scaledBbox[2]},${scaledBbox[3]}]`);
              
              return {
                bbox: scaledBbox,
                confidence: face.confidence,
                direction: data.direction
              };
            })
          };
          
          console.log('✅ Faces processed with scale correction');
        } 
        // Convert old format ke new format jika perlu
        else if (!data.faces && data.bbox) {
          // Convert normalized bbox format ke faces array
          const [canvasW, canvasH] = [videoSize.width, videoSize.height];
          const bbox = data.bbox;
          const x1 = Math.round(bbox.x * canvasW);
          const y1 = Math.round(bbox.y * canvasH);
          const x2 = Math.round((bbox.x + bbox.width) * canvasW);
          const y2 = Math.round((bbox.y + bbox.height) * canvasH);
          
          processedData = {
            ...data,
            faces: [{
              bbox: [x1, y1, x2, y2],
              direction: data.direction,
              confidence: data.face_confidence || data.confidence || 0.8
            }]
          };
          console.log('🔄 Converted old format to faces array');
        }
      }
      
      // Set detection result untuk display
      setDetectionResult(processedData);
      
      // Draw bounding box dan arah pada overlay canvas
      drawBBoxAndDirection(processedData);
      
      // Check duration with STICKY DIRECTION (debounce rapid changes)
      // 🔥 Use first detection's direction (for multi-person, use primary subject)
      const currentDirection = processedData.direction || 'DEPAN';
      const now = Date.now();
      
      // Initialize sticky direction
      if (!stickyDirectionRef.current) {
        stickyDirectionRef.current = currentDirection;
        lastDirectionTimeRef.current = now;
        setLastDirection(currentDirection);
        setDirectionStartTime(now);
        setDirectionDuration(0);
        console.log(`🎯 Initial sticky direction: ${currentDirection}`);
      } else if (currentDirection !== stickyDirectionRef.current) {
        // Direction changed - check if it's a real change (not jitter)
        const timeSinceLastChange = now - lastDirectionTimeRef.current;
        
        if (timeSinceLastChange >= DIRECTION_DEBOUNCE) {
          // Real change after debounce period
          console.log(`🔄 Direction changed: ${stickyDirectionRef.current} → ${currentDirection} (after ${timeSinceLastChange}ms)`);
          stickyDirectionRef.current = currentDirection;
          lastDirectionTimeRef.current = now;
          setLastDirection(currentDirection);
          setDirectionStartTime(now);
          setDirectionDuration(0);
          capturedDirectionsRef.current.clear(); // Reset capture flag for new direction
        } else {
          // Jitter - ignore and use sticky direction
          console.log(`⏭️ Jitter ignored: ${currentDirection} (only ${timeSinceLastChange}ms since last change)`);
        }
      } else {
        // Direction unchanged - calculate duration using REF (not state!)
        const duration = now - lastDirectionTimeRef.current;
        setDirectionDuration(duration);
        
        console.log(`⏱️ Duration: ${duration}ms, direction: ${stickyDirectionRef.current}`);
        
        // 🆕 TAHAP 3: Capture screenshot saat 3-6 detik (hanya KIRI dan KANAN)
        if (duration >= 3000 && duration < 6000 && stickyDirectionRef.current !== 'DEPAN') {
          console.log(`📸 Capture window OPEN: duration=${duration}ms, direction=${stickyDirectionRef.current}`);
          // Capture hanya 1x per direction trigger
          const captureKey = `${stickyDirectionRef.current}_${lastDirectionTimeRef.current}`;
          if (!capturedDirectionsRef.current.has(captureKey)) {
            capturedDirectionsRef.current.add(captureKey);
            
            console.log(`📸 Starting capture for key: ${captureKey}`);
            
            // Capture dari video element
            if (videoRef.current && videoRef.current.videoWidth > 0) {
              const screenshotCanvas = document.createElement('canvas');
              screenshotCanvas.width = videoRef.current.videoWidth;
              screenshotCanvas.height = videoRef.current.videoHeight;
              
              console.log(`📐 Canvas size: ${screenshotCanvas.width}x${screenshotCanvas.height}`);
              
              const ctx = screenshotCanvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const imageData = screenshotCanvas.toDataURL('image/jpeg', 0.8);
                
                console.log(`📸 Image data length: ${imageData.length}`);
                
                setScreenshots(prev => {
                  const newScreenshots = [...prev, {
                    timestamp: now,
                    direction: stickyDirectionRef.current,
                    image: imageData
                  }];
                  console.log(`✅ Screenshot added! Total: ${newScreenshots.length}`);
                  return newScreenshots;
                });
              } else {
                console.log(`❌ Canvas context failed`);
              }
            } else {
              console.log(`❌ Video ref null or not ready!`);
            }
          } else {
            console.log(`⏭️ Already captured for this trigger`);
          }
        }
      }
    } catch (err: any) {
      console.error('Frame error:', err);
    }
  };
  
  // Draw bbox dan direction text di overlay canvas
  const drawBBoxAndDirection = (data: any) => {
    if (!overlayCanvasRef.current || !videoRef.current) {
      console.log('❌ Canvas or video ref missing');
      return;
    }
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Canvas context missing');
      return;
    }
    
    console.log('🎨 drawBBoxAndDirection called');
    console.log('   Canvas size:', canvas.width, 'x', canvas.height);
    console.log('   Video size:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
    console.log('   data.faces:', data.faces);
    console.log('   data.face_detected:', data.face_detected);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    console.log('🎨 Drawing:', data);
    
    // Draw bounding boxes untuk semua detected faces
    if (data.faces && Array.isArray(data.faces) && data.faces.length > 0) {
      console.log(`📦 Found ${data.faces.length} faces`);
      
      data.faces.forEach((face: any, idx: number) => {
        const [x1, y1, x2, y2] = face.bbox;
        
        // Validate bbox coordinates
        if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
          console.log(`  Face ${idx}: ❌ Invalid bbox coordinates: [${x1},${y1},${x2},${y2}]`);
          return;
        }
        
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        const confidence = face.confidence || 0;
        const direction = data.direction || 'DEPAN';
        
        console.log(`  Face ${idx}: bbox=[${x1},${y1},${x2},${y2}], conf=${confidence}, direction=${direction}`);
        
        // Bbox color: Green for DEPAN, Red for KIRI/KANAN
        const bboxColor = direction === 'DEPAN' ? '#00FF00' : '#FF0000';
        
        // Draw bounding box with dynamic color
        ctx.strokeStyle = bboxColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        console.log(`    ✅ Drew bbox rect (${bboxColor}): [${x1},${y1}] to [${x2},${y2}]`);
        
        // Draw HEAD confidence background
        const confText = `Head: ${(confidence * 100).toFixed(1)}%`;
        // Head color also follows bbox color
        const headBgColor = direction === 'DEPAN' ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        const headTextColor = direction === 'DEPAN' ? '#000000' : '#FFFFFF';
        
        ctx.fillStyle = headBgColor;
        ctx.font = 'bold 14px Arial';
        const textMetrics = ctx.measureText(confText);
        ctx.fillRect(x1, y1 - 25, textMetrics.width + 8, 24);
        
        // Draw HEAD confidence text
        ctx.fillStyle = headTextColor;
        ctx.fillText(confText, x1 + 4, y1 - 8);
        console.log(`    ✅ Drew confidence text`);
        
        // Draw direction label INSIDE bbox (top-left)
        const directionText = direction;
        // Color: Green for DEPAN, Red for KIRI/KANAN
        const dirLabelBgColor = direction === 'DEPAN' ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)';
        const dirLabelTextColor = direction === 'DEPAN' ? '#000000' : '#FFFFFF';
        
        ctx.fillStyle = dirLabelBgColor;
        ctx.font = 'bold 16px Arial';
        const dirMetrics = ctx.measureText(directionText);
        ctx.fillRect(x1 + 4, y1 + 4, dirMetrics.width + 8, 24);
        
        // Draw direction text
        ctx.fillStyle = dirLabelTextColor;
        ctx.fillText(directionText, x1 + 8, y1 + 20);
        console.log(`    ✅ Drew direction label: ${direction}`);
        
        // Draw direction arrow (RED for KIRI/KANAN, GREEN for DEPAN)
        const arrowColor = direction === 'DEPAN' ? '#00FF00' : '#FF0000';
        
        ctx.strokeStyle = arrowColor;
        ctx.fillStyle = arrowColor;
        ctx.lineWidth = 3;
        
        const arrowLength = 80;
        
        if (direction === 'KANAN') {
          // Melihat ke KANAN (ke kanan) → Arrow pointing LEFT [<----] (mirrored)
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx - arrowLength, cy);
          ctx.stroke();
          
          // Arrowhead pointing LEFT
          const headlen = 15;
          ctx.beginPath();
          ctx.moveTo(cx - arrowLength, cy);
          ctx.lineTo(cx - arrowLength + headlen, cy - headlen / 2);
          ctx.lineTo(cx - arrowLength + headlen, cy + headlen / 2);
          ctx.closePath();
          ctx.fill();
          console.log(`    ✅ Drew KANAN arrow (<----)`);
        } else if (direction === 'KIRI') {
          // Melihat ke KIRI (ke kiri) → Arrow pointing RIGHT [---->] (mirrored)
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + arrowLength, cy);
          ctx.stroke();
          
          // Arrowhead pointing RIGHT
          const headlen = 15;
          ctx.beginPath();
          ctx.moveTo(cx + arrowLength, cy);
          ctx.lineTo(cx + arrowLength - headlen, cy - headlen / 2);
          ctx.lineTo(cx + arrowLength - headlen, cy + headlen / 2);
          ctx.closePath();
          ctx.fill();
          console.log(`    ✅ Drew KIRI arrow (---->`);
        } else {
          console.log(`    ℹ️ DEPAN - no arrow`);
        }
      });
    } else {
      console.log('⚠️ No faces array or empty:', {
        hasFaces: !!data.faces,
        isArray: Array.isArray(data.faces),
        length: data.faces?.length
      });
    }
    
    // ✅ REMOVED old direction text UI at top-left
    // Direction sudah ditampilkan di dalam bbox sekarang
    
    console.log('✅ Drawing complete');
  };
  
  // Capture frames
  useEffect(() => {
    if (!isDetecting || !videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Ensure canvas dimensions match video
    if (videoRef.current.videoWidth > 0) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    }
    
    let errorCount = 0;
    let timeoutId: NodeJS.Timeout;
    
    const captureAndSend = () => {
      try {
        ctx.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
        sendFrame(canvas);
        errorCount = 0;
      } catch (err) {
        errorCount++;
        if (errorCount > 5) {
          stopDetection();
          setError('Detection connection lost');
          return;
        }
      }
      
      timeoutId = setTimeout(captureAndSend, 500);
    };
    
    captureAndSend();
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [isDetecting]);

  const startDetection = async () => {
    try {
      setIsLoading(true);
      setError("");
      setDetectionResult(null);
      setLastDirection("");
      setDirectionStartTime(0);
      setDirectionDuration(0);
      
      // 🆕 TAHAP 4: Generate session ID
      const newSessionId = generateUUID();
      const startTime = Date.now();
      
      setSessionId(newSessionId);
      setSessionStartTime(startTime);
      setSessionEndTime(0);
      setScreenshots([]); // Clear screenshots saat session baru
      capturedDirectionsRef.current.clear();

      // 🆕 TAHAP 5: Create session record in Supabase
      if (user) {
        try {
          console.log('💾 Creating detection session in Supabase...');
          await detectionHelpers.createDetectionSession(
            user.id,
            newSessionId,
            new Date(startTime).toISOString()
          );
          console.log('✅ Session created in database');
        } catch (supabaseError: any) {
          console.error('⚠️ Failed to create session in Supabase:', supabaseError);
          setError(`Failed to create session: ${supabaseError.message}`);
          setIsLoading(false);
          return;
        }
      }

      await startWebcam();
      setIsDetecting(true);
      
      console.log(`✅ Detection started - Session ID: ${newSessionId}`);
      console.log(`📅 Session started at: ${new Date(startTime).toLocaleString()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start');
    } finally {
      setIsLoading(false);
    }
  };

  const stopDetection = async () => {
    try {
      stopWebcam();
      setIsDetecting(false);
      setDetectionResult(null);
      
      // 🆕 TAHAP 4: Record session end time
      const endTime = Date.now();
      setSessionEndTime(endTime);
      
      const durationSeconds = (endTime - sessionStartTime) / 1000;
      
      console.log(`🛑 Detection stopped - Session ID: ${sessionId}`);
      console.log(`📅 Session ended at: ${new Date(endTime).toLocaleString()}`);
      console.log(`⏱️ Session duration: ${durationSeconds.toFixed(2)}s`);
      console.log(`📸 Total screenshots: ${screenshots.length}`);
      
      // Clear overlay canvas
      if (overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
      }
      
      // 🆕 TAHAP 5: Save to Supabase (if user is logged in)
      if (user && sessionId) {
        try {
          console.log('💾 Saving detection session to Supabase...');
          
          // Calculate direction summary
          const directionSummary: Record<string, number> = { KIRI: 0, DEPAN: 0, KANAN: 0 };
          screenshots.forEach(screenshot => {
            if (screenshot.direction in directionSummary) {
              directionSummary[screenshot.direction]++;
            }
          });
          
          // 🆕 Upload all screenshots to storage
          if (screenshots.length > 0) {
            console.log(`📸 Uploading ${screenshots.length} screenshots...`);
            for (let i = 0; i < screenshots.length; i++) {
              const screenshot = screenshots[i];
              try {
                await detectionHelpers.uploadScreenshot(
                  user.id,
                  sessionId,
                  screenshot.image,
                  screenshot.direction,
                  0.95, // Default confidence
                  { x1: 0, y1: 0, x2: 0, y2: 0 }, // Placeholder bbox
                  new Date(screenshot.timestamp).toISOString()
                );
                console.log(`✅ Uploaded screenshot ${i + 1}/${screenshots.length}`);
              } catch (uploadError: any) {
                console.error(`⚠️ Failed to upload screenshot ${i + 1}:`, uploadError);
              }
            }
            console.log('✅ All screenshots uploaded');
          }
          
          // Update detection session record with final data
          await detectionHelpers.updateDetectionSession(
            sessionId,
            user.id,
            new Date(endTime).toISOString(),
            Math.round(durationSeconds * 100) / 100, // Round to 2 decimals
            screenshots.length,
            directionSummary
          );
          
          console.log('✅ Session updated in database');
          console.log('Direction summary:', directionSummary);
        } catch (supabaseError: any) {
          console.error('⚠️ Failed to save to Supabase:', supabaseError);
          setError(`Failed to save session: ${supabaseError.message}`);
        }
      }
      
      console.log('Detection stopped');
    } catch (err: any) {
      setError(err.message || 'Failed to stop');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (isDetecting) stopWebcam();
    };
  }, [isDetecting]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      <div className="pt-24">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>
              <span style={{color: '#4DA1B2'}}>Deteksi</span> YOLO
            </h1>
            <p className="text-lg text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>
              Deteksi wajah real-time dengan analisis arah kepala
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            {/* Video Area */}
            <div className="bg-slate-800 relative" style={{ height: '600px' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`absolute inset-0 w-full h-full object-cover ${isDetecting ? '' : 'hidden'}`}
              />
              
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="hidden"
              />
              
              {/* Overlay Canvas untuk draw bbox dan arah */}
              <canvas
                ref={overlayCanvasRef}
                width={1280}
                height={720}
                className="absolute inset-0 w-full h-full cursor-default"
                style={{ display: isDetecting ? 'block' : 'none', background: 'transparent' }}
              />
              
              {/* Placeholder */}
              {!isDetecting && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-300">
                    <div className="mb-4">
                      <svg className="w-20 h-20 mx-auto opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                      </svg>
                    </div>
                    <p className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>Deteksi Tidak Aktif</p>
                    <p className="text-sm opacity-75" style={{fontFamily: 'Poppins, sans-serif'}}>Klik "Mulai Deteksi" untuk memulai</p>
                  </div>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p style={{fontFamily: 'Poppins, sans-serif'}}>Memulai...</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="absolute top-4 left-4 right-4 z-20">
                  <div className="bg-red-500 bg-opacity-90 text-white px-4 py-3 rounded-lg">
                    <p className="font-semibold" style={{fontFamily: 'Poppins, sans-serif'}}>Error</p>
                    <p className="text-sm" style={{fontFamily: 'Poppins, sans-serif'}}>{error}</p>
                  </div>
                </div>
              )}

              {/* Result Display - HIDDEN */}
              {/* Hanya tampilkan arah dari pose estimation di canvas overlay */}
            </div>

            {/* Control Panel */}
            <div className="flex justify-center p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                {/* Control Buttons */}
                <div className="flex justify-center gap-3">
                  {!isDetecting ? (
                    <button
                      onClick={startDetection}
                      disabled={isLoading}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                      </svg>
                      <span style={{fontFamily: 'Poppins, sans-serif'}}>Mulai Deteksi</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopDetection}
                      disabled={isLoading}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"/>
                      </svg>
                      <span style={{fontFamily: 'Poppins, sans-serif'}}>Hentikan Deteksi</span>
                    </button>
                  )}
                </div>

                {/* Status Info */}
                {isDetecting && (
                  <div className="text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Status:</span>
                      <span>🎥 Webcam aktif</span>
                      <span className="text-xs">📋 Session: {sessionId.substring(0, 12)}...</span>
                      <span className="text-xs">⏱️ Durasi: {((Date.now() - sessionStartTime) / 1000).toFixed(1)}s</span>
                      <span className="text-xs">📸 Screenshots: {screenshots.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-center text-3xl font-bold mb-6" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>Cara <span style={{color: '#4DA1B2'}}>Menggunakan</span></h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>Klik "Mulai Deteksi"</p>
                  <p className="text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>Sistem akan menginisialisasi kamera dan memulai deteksi</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>Posisikan Kamera</p>
                  <p className="text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>Hadapkan kamera ke wajah secara langsung</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>Perhatikan Label Arah</p>
                  <p className="text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>Sistem akan menampilkan: DEPAN (Depan), KIRI (Kiri), atau KANAN (Kanan)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <div>
                  <p className="font-semibold" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>Klik "Hentikan Deteksi"</p>
                  <p className="text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>Setelah selesai, hentikan sesi untuk menghemat sumber daya</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">5</span>
                </div>
                <div>
                  <p className="font-semibold" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>Lihat Hasil Preview</p>
                  <p className="text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>Hasil deteksi akan muncul di bagian bawah halaman Deteksi YOLO dan otomatis tersimpan di dalam menu Histori</p>
                </div>
              </div>
            </div>

            {/* Detection Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold mb-3" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>Label Arah:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="font-bold text-red-700" style={{fontFamily: 'Poppins, sans-serif'}}>KIRI</p>
                  <p className="text-xs text-gray-600 mt-1" style={{fontFamily: 'Poppins, sans-serif'}}>Melihat ke Kiri</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="font-bold text-green-700" style={{fontFamily: 'Poppins, sans-serif'}}>DEPAN</p>
                  <p className="text-xs text-gray-600 mt-1" style={{fontFamily: 'Poppins, sans-serif'}}>Melihat ke Depan</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="font-bold text-red-700" style={{fontFamily: 'Poppins, sans-serif'}}>KANAN</p>
                  <p className="text-xs text-gray-600 mt-1" style={{fontFamily: 'Poppins, sans-serif'}}>Melihat ke Kanan</p>
                </div>
              </div>
            </div>
          </div>

          {screenshots.length > 0 && sessionEndTime > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
              {/* 🆕 TAHAP 4: Session Summary */}
              <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                <h2 className="text-2xl font-bold mb-4" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>
                  📊 Ringkasan <span style={{color: '#4DA1B2'}}>Sesi</span>
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Session ID */}
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-600 mb-1 font-semibold" style={{fontFamily: 'Poppins, sans-serif'}}>Session ID</p>
                    <p className="text-sm font-mono text-blue-600 break-all" style={{fontFamily: 'monospace'}}>
                      {sessionId.substring(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-blue-600" 
                       title={sessionId}
                       onClick={() => {
                         navigator.clipboard.writeText(sessionId);
                         alert('Session ID copied!');
                       }}>
                      (klik untuk copy)
                    </p>
                  </div>
                  
                  {/* Duration */}
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-600 mb-1 font-semibold" style={{fontFamily: 'Poppins, sans-serif'}}>Durasi</p>
                    <p className="text-sm font-bold text-green-600" style={{fontFamily: 'Poppins, sans-serif'}}>
                      {((sessionEndTime - sessionStartTime) / 1000).toFixed(1)}s
                    </p>
                  </div>
                  
                  {/* Screenshot count */}
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-600 mb-1 font-semibold" style={{fontFamily: 'Poppins, sans-serif'}}>Screenshots</p>
                    <p className="text-sm font-bold text-orange-600" style={{fontFamily: 'Poppins, sans-serif'}}>
                      {screenshots.length}
                    </p>
                  </div>
                  
                  {/* Time */}
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs text-gray-600 mb-1 font-semibold" style={{fontFamily: 'Poppins, sans-serif'}}>Waktu</p>
                    <p className="text-xs font-semibold text-gray-700" style={{fontFamily: 'Poppins, sans-serif'}}>
                      {new Date(sessionStartTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Direction Summary */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm font-semibold mb-2" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>
                    📍 Arah yang Tertangkap:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(screenshots.map(ss => ss.direction))).map(direction => {
                      const count = screenshots.filter(ss => ss.direction === direction).length;
                      const colors = {
                        'KIRI': 'bg-red-100 text-red-700 border-red-300',
                        'DEPAN': 'bg-green-100 text-green-700 border-green-300',
                        'KANAN': 'bg-red-100 text-red-700 border-red-300'
                      };
                      return (
                        <span 
                          key={direction} 
                          className={`px-3 py-1 rounded-full text-sm font-semibold border ${colors[direction as keyof typeof colors] || 'bg-gray-100'}`}
                          style={{fontFamily: 'Poppins, sans-serif'}}
                        >
                          {direction}: {count}x
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Screenshots Grid */}
              <h3 className="text-center text-3xl font-bold mb-6" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>
                📸 Screenshot <span style={{color: '#4DA1B2'}}>Tertangkap</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {screenshots.map((ss, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg overflow-hidden shadow-md">
                    <img src={ss.image} alt={`Screenshot ${idx}`} className="w-full h-48 object-cover" />
                    <div className="p-3">
                      <p className="font-semibold text-sm" style={{fontFamily: 'Poppins, sans-serif'}}>
                        Direction: <span className={ss.direction === 'DEPAN' ? 'text-green-600' : 'text-red-600'}>
                          {ss.direction}
                        </span>
                      </p>
                      <p className="text-xs text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>
                        {new Date(ss.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1" style={{fontFamily: 'Poppins, sans-serif'}}>
                        +{(ss.timestamp - sessionStartTime)}ms
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
