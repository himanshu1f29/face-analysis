import React, { useEffect, useRef, useState } from 'react';
import { Loader } from './components/Loader';
import { MatchCard } from './components/MatchCard';
import { Login } from './components/Login';
import { AppState, FaceMatchResult } from './types';
import { MODEL_URL } from './constants';
import { Upload, Play, RefreshCw, Video, AlertCircle, Image as ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [state, setState] = useState<AppState>(AppState.LOADING_MODELS);
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [bestMatch, setBestMatch] = useState<FaceMatchResult | null>(null);
  const [currentSimilarity, setCurrentSimilarity] = useState<number>(0);
  const [targetDescriptor, setTargetDescriptor] = useState<Float32Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  // Load Models on Mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceapi = window.faceapi;
        if (!faceapi) {
          throw new Error("FaceAPI script not loaded correctly.");
        }
        
        // Use explicit net loading for maximum compatibility
        await Promise.all([
          faceapi.loadSsdMobilenetv1Model(MODEL_URL),
          faceapi.loadFaceLandmarkModel(MODEL_URL),
          faceapi.loadFaceRecognitionModel(MODEL_URL),
          faceapi.loadFaceExpressionModel(MODEL_URL),
          faceapi.loadAgeGenderModel(MODEL_URL)
        ]);
        
        setState(AppState.IDLE);
      } catch (err) {
        console.error(err);
        setError("Failed to load AI models. Please check your internet connection.");
      }
    };
    loadModels();
  }, []);

  // Handle Target Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setTargetImage(url);
    setBestMatch(null);

    // Compute descriptor immediately
    try {
      const img = await window.faceapi.fetchImage(url);
      const detection = await window.faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      
      if (detection) {
        setTargetDescriptor(detection.descriptor);
        setError(null);
      } else {
        setError("No face detected in the target image. Please choose another.");
        setTargetDescriptor(null);
      }
    } catch (err) {
      setError("Error processing target image.");
    }
  };

  // Handle Video Upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoSource(url);
    setBestMatch(null);
    setCurrentSimilarity(0);
  };

  // Core Processing Loop
  const startProcessing = () => {
    if (!videoRef.current || !canvasRef.current || !targetDescriptor) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // We use the video's actual display dimensions to align the canvas drawing
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    
    window.faceapi.matchDimensions(canvas, displaySize);
    setState(AppState.PROCESSING);
    video.play();

    const processFrame = async () => {
      if (video.ended) {
        setState(AppState.FINISHED);
        return;
      }

      // If manually paused via controls, keep the loop alive but skip detection
      // This ensures detection resumes automatically when user hits play
      if (video.paused) {
        requestRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // IMPROVEMENT: Increased minConfidence to 0.6 to reduce ghost/noise detections
      const detections = await window.faceapi
        .detectAllFaces(video, new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender()
        .withFaceDescriptors();

      const resizedDetections = window.faceapi.resizeResults(detections, displaySize);
      
      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Logic: Find best match in this frame
      let frameBestSim = 0;

      resizedDetections.forEach((detection: any) => {
        const distance = window.faceapi.euclideanDistance(targetDescriptor, detection.descriptor);
        
        // IMPROVED: Use linear inverted distance for clearer 0-100% score
        // 0 distance = 1.0 score (Perfect)
        // 0.5 distance = 0.5 score (Threshold)
        // >1.0 distance = 0.0 score (Mismatch)
        const similarity = Math.max(0, 1 - distance);

        if (similarity > frameBestSim) frameBestSim = similarity;

        // Extract Biometrics
        const age = Math.round(detection.age);
        const gender = detection.gender;
        const expressions = detection.expressions;
        const sortedExpressions = Object.keys(expressions).sort((a, b) => expressions[b] - expressions[a]);
        const dominantExpression = sortedExpressions[0];

        // Draw Box Logic
        const box = detection.detection.box;
        
        // Match thresholds
        const isTarget = similarity >= 0.5;
        const isPossible = similarity >= 0.4 && similarity < 0.5;

        let boxColor = '#ef4444'; // Red (Default)
        let labelText = `Scan: ${(similarity * 100).toFixed(0)}%`;
        let lineWidth = 1;

        if (isTarget) {
            boxColor = '#10b981'; // Emerald (Match)
            labelText = `TARGET MATCH ${(similarity * 100).toFixed(0)}%`;
            lineWidth = 3;
        } else if (isPossible) {
            boxColor = '#f59e0b'; // Amber (Possible)
            labelText = `Possible ${(similarity * 100).toFixed(0)}%`;
            lineWidth = 2;
        }

        // Custom drawing for better visual analysis hierarchy
        const drawBox = new window.faceapi.draw.DrawBox(box, { 
            label: labelText,
            boxColor: boxColor,
            lineWidth: lineWidth,
            drawLabelOptions: { 
                fontSize: isTarget ? 18 : 12,
                padding: isTarget ? 10 : 4,
                fontColor: isTarget ? '#ffffff' : '#ef4444' // Red text for non-matches
            }
        });
        
        // Only draw non-matches with transparency to avoid clutter, 
        // draw matches fully opaque
        if (ctx) {
            ctx.globalAlpha = isTarget ? 1.0 : 0.6;
            drawBox.draw(canvas);
            ctx.globalAlpha = 1.0; // Reset
        }

        // Update Global Best Match if this is the new best
        setBestMatch((prev) => {
          if (!prev || frameBestSim > prev.score) {
            // Capture frame
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = video.videoWidth;
            offscreenCanvas.height = video.videoHeight;
            offscreenCanvas.getContext('2d')?.drawImage(video, 0, 0);
            
            return {
              score: frameBestSim,
              frameDataUrl: offscreenCanvas.toDataURL('image/jpeg'),
              timestamp: video.currentTime,
              age: age,
              gender: gender,
              genderProbability: detection.genderProbability,
              expression: dominantExpression
            };
          }
          return prev;
        });
      });

      setCurrentSimilarity(frameBestSim);
      requestRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  const stopProcessing = () => {
    if (videoRef.current) videoRef.current.pause();
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setState(AppState.FINISHED);
  };

  const resetApp = () => {
    stopProcessing();
    setTargetImage(null);
    setVideoSource(null);
    setBestMatch(null);
    setTargetDescriptor(null);
    setCurrentSimilarity(0);
    setState(AppState.IDLE);
    setError(null);
  };

  // Condition 1: Authentication Check
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Condition 2: Model Loading Check
  if (state === AppState.LOADING_MODELS) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader text="Initializing Neural Networks..." subText="Loading SSD MobileNet, Face Landmarks, & Biometric Models" />
      </div>
    );
  }

  // Condition 3: Main Application
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-md flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Video size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              FaceTrace AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {state !== AppState.IDLE && (
               <button 
                onClick={resetApp}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
               >
                 <RefreshCw size={14} /> Reset
               </button>
             )}
             <button 
                onClick={() => setIsAuthenticated(false)}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors ml-4 border-l border-slate-700 pl-4"
               >
                 Sign Out
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Inputs & Controls */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
               <ImageIcon size={18} className="text-indigo-400"/> Target Identity
             </h2>
             
             {!targetImage ? (
               <div className="relative group border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg h-48 transition-colors">
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={handleImageUpload}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 group-hover:text-indigo-400">
                    <Upload size={32} className="mb-2" />
                    <span className="text-sm">Upload Target Face (Image)</span>
                 </div>
               </div>
             ) : (
               <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-black">
                 <img src={targetImage} alt="Target" className="w-full h-48 object-contain bg-black" />
                 <button 
                   onClick={() => { setTargetImage(null); setTargetDescriptor(null); }}
                   className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-500/80 text-white p-1.5 rounded-full transition-colors"
                 >
                   <RefreshCw size={14} />
                 </button>
                 {targetDescriptor && (
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-500/90 text-white text-xs py-1 text-center font-medium">
                      Face Encoding Ready
                    </div>
                 )}
               </div>
             )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
             <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
               <Video size={18} className="text-indigo-400"/> Source Video
             </h2>
             {!videoSource ? (
                <div className="relative group border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg h-32 transition-colors">
                <input 
                  type="file" 
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 group-hover:text-indigo-400">
                   <Upload size={32} className="mb-2" />
                   <span className="text-sm">Upload Surveillance Video</span>
                </div>
              </div>
             ) : (
                <div className="space-y-4">
                   <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>Video Loaded</span>
                      <button onClick={() => setVideoSource(null)} className="text-red-400 hover:text-red-300">Remove</button>
                   </div>
                   <button
                     onClick={state === AppState.PROCESSING ? stopProcessing : startProcessing}
                     disabled={!targetDescriptor}
                     className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                        !targetDescriptor 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : state === AppState.PROCESSING
                             ? 'bg-red-500/10 text-red-500 border border-red-500/50'
                             : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                     }`}
                   >
                     {state === AppState.PROCESSING ? (
                        <>Stop Scanning</>
                     ) : (
                        <><Play size={18} /> Start Analysis</>
                     )}
                   </button>
                   {!targetDescriptor && videoSource && (
                      <p className="text-xs text-amber-500 flex items-center gap-1">
                        <AlertCircle size={12} /> Upload a target face first.
                      </p>
                   )}
                </div>
             )}
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-500/30 text-red-400 p-4 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Center: Video Feed */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative aspect-video flex items-center justify-center">
              {!videoSource ? (
                 <div className="text-slate-600 flex flex-col items-center">
                    <Video size={48} className="mb-4 opacity-20" />
                    <p>No Video Feed</p>
                 </div>
              ) : (
                 <>
                   {/* Wrapper for Video and Canvas. 'inline-flex' ensures the wrapper shrinks to fit the video exactly. */}
                   <div className="relative inline-flex items-center justify-center max-w-full max-h-full">
                     <video
                       ref={videoRef}
                       src={videoSource}
                       muted
                       playsInline
                       controls
                       onEnded={() => setState(AppState.FINISHED)}
                       className="block max-w-full max-h-full object-contain"
                     />
                     <canvas 
                       ref={canvasRef}
                       className="absolute inset-0 w-full h-full pointer-events-none"
                     />
                   </div>
                   
                   {/* Overlay Status */}
                   <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-white flex items-center gap-2 pointer-events-none z-10">
                      <div className={`w-2 h-2 rounded-full ${state === AppState.PROCESSING ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                      {state === AppState.PROCESSING ? 'REC' : 'STANDBY'}
                   </div>

                   {state === AppState.PROCESSING && (
                     <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10 pointer-events-none z-10">
                       <p className="text-xs text-slate-400 uppercase">Match Confidence</p>
                       <p className={`text-xl font-mono font-bold ${currentSimilarity >= 0.5 ? 'text-emerald-400' : 'text-slate-300'}`}>
                         {(currentSimilarity * 100).toFixed(1)}%
                       </p>
                     </div>
                   )}
                 </>
              )}
           </div>

           {/* Results Panel */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-fit">
                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Search Statistics</h3>
                <div className="space-y-4">
                   <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">Status</span>
                      <span className="text-white font-medium">{state.replace('_', ' ')}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">Model</span>
                      <span className="text-emerald-400 font-mono text-xs">SSD MobileNet V1 + Age/Gender</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-500">Threshold</span>
                      <span className="text-white font-mono">50.0% (Strict)</span>
                   </div>
                </div>
              </div>

              {bestMatch ? (
                 <MatchCard match={bestMatch} />
              ) : (
                <div className="h-[450px] w-full bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-slate-600 text-sm text-center">
                   <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                     {state === AppState.FINISHED ? (
                       <AlertCircle size={24} className="opacity-40 text-amber-500" />
                     ) : (
                       <Video size={24} className="opacity-40" />
                     )}
                   </div>
                   
                   {state === AppState.FINISHED ? (
                     <>
                        <p className="text-slate-400 font-medium">No faces detected</p>
                        <p className="text-xs text-slate-500 mt-1">No matches found in the video.</p>
                     </>
                   ) : state === AppState.PROCESSING ? (
                     <>
                        <p className="animate-pulse">Processing video...</p>
                        <p className="text-xs text-slate-500 mt-1">Best matches will appear here.</p>
                     </>
                   ) : (
                     <>
                        <p>Ready to analyze</p>
                        <p className="text-xs text-slate-500 mt-1">Upload video to start.</p>
                     </>
                   )}
                </div>
              )}
           </div>
        </div>

      </main>
    </div>
  );
};

export default App;