export interface FaceMatchResult {
  score: number;
  frameDataUrl: string;
  timestamp: number;
  age?: number;
  gender?: string;
  genderProbability?: number;
  expression?: string;
}

// Extend window to include the global faceapi object loaded via script tag
declare global {
  interface Window {
    faceapi: any;
  }
}

export enum AppState {
  LOADING_MODELS = 'LOADING_MODELS',
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  FINISHED = 'FINISHED'
}