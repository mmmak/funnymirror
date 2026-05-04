import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import './App.css';

const EFFECTS = ['normal', 'fat', 'thin', 'tall', 'short', 'accessories'];

export default function App() {
  const webcamRef = useRef(null);
  const [effectIdx, setEffectIdx] = useState(0);
  const [faceData, setFaceData] = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [flash, setFlash] = useState(false);

  // 1. LOAD MODELS
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Loading models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        console.log("✅ Models Loaded Successfully");
      } catch (err) {
        console.error("❌ Model Load Error:", err);
      }
    };
    loadModels();
  }, []);

  // 2. DETECTION LOOP (Crucial: Use RequestAnimationFrame for smoothness)
  useEffect(() => {
    let requestRef;
    const detect = async () => {
      if (webcamRef.current && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        
        if (result) {
          setFaceData(result.landmarks);
        }
      }
      requestRef = requestAnimationFrame(detect);
    };

    if (EFFECTS[effectIdx] === 'accessories') {
      requestRef = requestAnimationFrame(detect);
    }
    return () => cancelAnimationFrame(requestRef);
  }, [effectIdx]);

  // 3. VOICE DETECTION
  useEffect(() => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;

    const rec = new Speech();
    rec.continuous = true;
    rec.lang = 'en-US';

    rec.onstart = () => console.log("🎙️ Microphone is now LISTENING...");
    
    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      console.log("🗣️ I heard:", transcript); // Check your console for this!
      
      if (transcript.includes('snapshot')) {
        handleSnapshot();
      }
    };

    rec.onerror = (event) => {
      console.error("❌ Speech Error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone blocked! Click the 'Lock' icon in the URL bar to allow.");
      }
    };

    // If it stops (it usually does after 60s of silence), restart it.
    rec.onend = () => {
      console.log("🔄 Restarting Speech Engine...");
      try { rec.start(); } catch (e) {} 
    };

    try {
      rec.start();
    } catch (e) {
      console.log("Speech already started");
    }

    return () => {
      rec.onend = null;
      rec.stop();
    };
  }, []);

  const handleSnapshot = () => {
    console.log("📸 Taking Snapshot!");
    setIsFrozen(true);
    // Send to backend logic here...
    setTimeout(() => setIsFrozen(false), 5000);
  };

  // 4. AUTO-CYCLE EFFECTS
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     if (!isFrozen) setEffectIdx(prev => (prev + 1) % EFFECTS.length);
  //   }, 10000);
  //   return () => clearInterval(timer);
  // }, [isFrozen]);

// 2. Update your return statement:
return (
  <div className={`app-container effect-${EFFECTS[effectIdx]}`}>
    {flash && <div className="camera-flash" />}
    
    {/* Navigation Bar */}
    <nav className="effect-selector">
      {EFFECTS.map((effect, index) => (
        <button 
          key={effect}
          className={effectIdx === index ? 'active' : ''}
          onClick={() => setEffectIdx(index)}
        >
          {effect.toUpperCase()}
        </button>
      ))}
      <button className="snap-btn" onClick={handleSnapshot}>📸 SNAP</button>
    </nav>

    <div className="video-wrapper">
      <Webcam 
        ref={webcamRef} 
        mirrored 
        className="webcam-feed"
        screenshotFormat="image/jpeg"
      />

      {/* Accessories / Frozen overlays remain the same */}
      {EFFECTS[effectIdx] === 'accessories' && faceData && (() => {
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;
        
        const leftEye = faceData.getLeftEye()[0];  
        const rightEye = faceData.getRightEye()[3];

        // Calculate distance for sizing
        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Flip the angle for mirrored tilt
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <div style={{
            position: 'absolute',
            // The "100 - ..." here is what fixes the "left goes right" issue
            left: `${100 - (((leftEye.x + rightEye.x) / 2) / videoWidth) * 100}%`,
            top: `${((leftEye.y + rightEye.y) / 2 / videoHeight) * 100}%`,
            
            fontSize: `${distance * 2.5}px`, 
            transform: `translate(-50%, -50%) rotate(${-angle}deg)`, // Note the negative angle
            
            pointerEvents: 'none',
            zIndex: 100,
            transition: 'left 0.05s linear, top 0.05s linear' 
          }}>
            🕶️
          </div>
        );
      })()}

      {/* BUNNY EARS (HEADBAND STYLE) */}
      {EFFECTS[effectIdx] === 'accessories' && faceData && (() => {
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;
        
        const leftEye = faceData.getLeftEye()[0];  
        const rightEye = faceData.getRightEye()[3];
        const dx = rightEye.x - leftEye.x;
        const dy = rightEye.y - leftEye.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <div style={{
            position: 'absolute',
            left: `${100 - (((leftEye.x + rightEye.x) / 2) / videoWidth) * 100}%`,
            
            /* Reduced the multiplier from 110 to 65 to drop them down */
            top: `${((leftEye.y + rightEye.y) / 2 / videoHeight) * 100 - (distance / videoHeight * 15)}%`,
            
            fontSize: `${distance * 3.5}px`, 
            /* We use translate( -50%, -85% ) instead of -100% to let the bottom 
              of the ears overlap your head slightly for a better fit */
            transform: `translate(-50%, -85%) rotate(${-angle}deg)`,
            
            clipPath: 'inset(0% 0% 48% 0%)', 
            
            pointerEvents: 'none',
            zIndex: 90,
            transition: 'left 0.05s linear, top 0.05s linear' 
          }}>
            🐰
          </div>
        );
      })()}  

      {/* FACE OUTLINE (GREEN LINE) */}
      {faceData && (() => {
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;
        
        // Get the 17 points that make up the jawline
        const jaw = faceData.getJawOutline();
        
        // Create the SVG path string
        // We flip the X coordinates just like we did for the accessories
        const points = jaw.map(p => ({
          x: (1 - p.x / videoWidth) * 100, // Mirrored percentage
          y: (p.y / videoHeight) * 100     // Vertical percentage
        }));

        // Construct the SVG path (M = move to, L = line to)
        const d = `M ${points[0].x} ${points[0].y} ` + 
                  points.map(p => `L ${p.x} ${p.y}`).join(' ');

        return (
          <svg 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 80
            }}
          >
            <path
              d={d}
              fill="none"
              stroke="#00FF00" 
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'all 0.05s linear' }}
            />
          </svg>
        );
      })()}      


      {isFrozen && (
        <div className="frozen-overlay">
          <h2 className="frozen-text">SMILE SAVED!</h2>
        </div>
      )}
    </div>
  </div>
);
}