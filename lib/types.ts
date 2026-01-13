// Type definitions for the application

export interface VideoMetadata {
    id: string;
    title: string;
    filename: string;
    duration: number;
    size: number;
    createdAt: string;
    shareUrl: string;
    thumbnailUrl?: string;
}

export interface VideoAnalytics {
    videoId: string;
    views: number;
    completionData: CompletionDataPoint[];
    averageWatchPercentage: number;
    lastViewed?: string;
}

export interface CompletionDataPoint {
    timestamp: string;
    watchPercentage: number;
    watchDuration: number;
}

export interface RecordingState {
    isRecording: boolean;
    isPaused: boolean;
    recordedChunks: Blob[];
    mediaRecorder: MediaRecorder | null;
    stream: MediaStream | null;
    startTime: number | null;
    pauseTime: number | null;
}

export interface TrimSettings {
    startTime: number;
    endTime: number;
    duration: number;
}
