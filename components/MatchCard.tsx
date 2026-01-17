import React, { useState } from 'react';
import { FaceMatchResult } from '../types';
import { Download, Sparkles, Loader2, Clock, User, Smile, AlertTriangle, CheckCircle, Activity, ScanFace } from 'lucide-react';
import { analyzeBestMatch } from '../services/geminiService';

interface MatchCardProps {
  match: FaceMatchResult;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeBestMatch(match.frameDataUrl, match.score);
      if (result) {
        setAnalysis(JSON.parse(result));
      }
    } catch (err) {
      setError("Failed to analyze with Gemini.");
    } finally {
      setLoading(false);
    }
  };

  const confidencePercent = (match.score * 100).toFixed(1);
  const isMatch = match.score >= 0.5;

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden shadow-2xl flex flex-col h-full ring-1 transition-all duration-500 ${isMatch ? 'border-emerald-500/30 ring-emerald-500/10 shadow-emerald-900/10' : 'border-red-500/30 ring-red-500/10 shadow-red-900/10'}`}>
      
      {/* Header Status Bar */}
      <div className={`px-4 py-3 border-b flex justify-between items-center backdrop-blur-md ${isMatch ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-red-950/30 border-red-500/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-full ${isMatch ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
             {isMatch ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          </div>
          <div>
            <h3 className={`text-sm font-bold tracking-wide uppercase ${isMatch ? 'text-emerald-100' : 'text-red-100'}`}>
              {isMatch ? 'Target Identified' : 'No Match'}
            </h3>
            <p className={`text-[10px] font-medium ${isMatch ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
              {isMatch ? 'High Confidence Match' : 'Low Similarity Detected'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/50 px-2.5 py-1.5 rounded-md border border-slate-800">
          <Clock size={12} className="text-slate-500" />
          <span>{match.timestamp.toFixed(2)}s</span>
        </div>
      </div>

      {/* Main Feature: Matched Frame */}
      <div className="relative group w-full bg-black aspect-video flex items-center justify-center overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/20 to-black/80 pointer-events-none"></div>
        <img 
          src={match.frameDataUrl} 
          alt="Best Match Frame" 
          className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${isMatch ? 'opacity-100' : 'opacity-70 grayscale-[0.8]'}`}
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
           <a 
            href={match.frameDataUrl} 
            download={`match-${match.score.toFixed(3)}.jpg`}
            className="flex items-center gap-2 bg-slate-100 text-slate-900 hover:bg-emerald-400 hover:text-emerald-950 font-bold px-6 py-3 rounded-full transition-all transform hover:scale-105 shadow-xl"
           >
             <Download size={18} /> 
             <span>Download Evidence</span>
           </a>
        </div>

        {/* Scan line effect overlay for visual flair */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,_rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
        
        {!isMatch && (
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border border-red-400/30 flex items-center gap-2 tracking-wide uppercase">
             <AlertTriangle size={12} fill="currentColor"/> Below Threshold
           </div>
        )}
      </div>

      {/* Data Panel */}
      <div className="p-5 flex flex-col gap-5 flex-1 bg-slate-900">
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
           {/* Confidence Card */}
           <div className={`relative overflow-hidden rounded-xl p-4 border flex flex-col justify-between ${isMatch ? 'bg-emerald-950/10 border-emerald-500/20' : 'bg-red-950/10 border-red-500/20'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Confidence</span>
                <Activity size={14} className={isMatch ? 'text-emerald-500' : 'text-red-500'} />
              </div>
              <div>
                <span className={`text-3xl font-black tracking-tighter ${isMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                  {confidencePercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800/50 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isMatch ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(parseFloat(confidencePercent), 100)}%` }}
                ></div>
              </div>
           </div>
           
           {/* Similarity Score Card */}
           <div className="rounded-xl p-4 border border-slate-800 bg-slate-950/50 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Similarity</span>
                <ScanFace size={14} className="text-slate-500" />
              </div>
              <div>
                <span className="text-2xl font-mono text-slate-200 tracking-tight">
                  {match.score.toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Vector Distance Inv.</span>
              </div>
           </div>
        </div>

        {/* Biometrics (Only if available) */}
        {(match.age || match.gender) && (
          <div className="flex items-center gap-4 py-3 px-4 rounded-lg bg-slate-950 border border-slate-800/60">
             <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
                <div className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-400"><User size={16}/></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Gender</span>
                  <span className="text-sm font-medium text-slate-200 capitalize">{match.gender || 'N/A'}</span>
                </div>
             </div>
             <div className="flex items-center gap-3 pr-4 border-r border-slate-800">
                 <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Age Est.</span>
                  <span className="text-sm font-medium text-slate-200">~{Math.round(match.age || 0)} yrs</span>
                </div>
             </div>
             <div className="flex items-center gap-3">
                 <div className="p-1.5 bg-amber-500/10 rounded-md text-amber-400"><Smile size={16}/></div>
                 <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Mood</span>
                  <span className="text-sm font-medium text-slate-200 capitalize">{match.expression || 'N/A'}</span>
                </div>
             </div>
          </div>
        )}

        {/* AI Action Area */}
        <div className="flex-1 flex flex-col mt-auto">
           {isMatch ? (
             <>
                {!analysis && !loading && (
                  <button 
                    onClick={handleAnalyze}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-900/20 group relative overflow-hidden mt-auto border border-indigo-400/20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <Sparkles size={18} className="text-indigo-200" /> 
                    <span className="font-semibold tracking-wide">Generate Forensic Report</span>
                  </button>
                )}

                {loading && (
                  <div className="flex flex-col items-center justify-center gap-3 py-6 bg-slate-950/30 rounded-xl border border-indigo-500/30 border-dashed animate-pulse mt-auto">
                    <Loader2 className="animate-spin text-indigo-400" size={28} />
                    <span className="text-xs font-medium text-indigo-300">Consulting Gemini Vision Model...</span>
                  </div>
                )}
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center mt-auto">
                    {error}
                  </div>
                )}

                {analysis && (
                  <div className="bg-slate-950 rounded-xl p-5 text-sm border border-slate-800 shadow-inner mt-auto">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                         <div className="flex items-center gap-2 text-indigo-400 font-bold">
                            <Sparkles size={16} /> 
                            <span>AI Analysis Result</span>
                         </div>
                         <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">Gemini 2.5</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Subject Description</span>
                          <p className="text-slate-300 text-xs leading-relaxed">{analysis.personDescription}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Distinguishing Features</span>
                          <p className="text-slate-300 text-xs leading-relaxed">{analysis.distinguishingFeatures}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 mt-2">
                           <span className="text-[10px] text-slate-500 font-bold uppercase">AI Reliability Score</span>
                           <span className="text-xs font-bold text-emerald-400">{analysis.matchReliability}</span>
                        </div>
                      </div>
                  </div>
                )}
             </>
           ) : (
             <div className="flex flex-col items-center justify-center py-6 border-t border-slate-800/50 text-slate-500 mt-auto">
               <p className="text-sm font-medium">Forensic Analysis Unavailable</p>
               <p className="text-xs opacity-60">Match confidence below threshold (50%)</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
