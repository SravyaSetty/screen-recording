'use client';

import { useState, useRef, useEffect } from 'react';
import { Video, Square, Pause, Play, Trash2, Download } from 'lucide-react';
import { RecordingState } from '@/lib/types';

interface ScreenRecorderProps {
    onRecordingComplete: (blob: Blob, duration: number) => void;
}

export default function ScreenRecorder({ onRecordingComplete }: ScreenRecorderProps) {
    const [state, setState] = useState<RecordingState>({
        isRecording: false,
        isPaused: false,
        recordedChunks: [],
        mediaRecorder: null,
        stream: null,
        startTime: null,
        pauseTime: null,
    });

    const [recordingDuration, setRecordingDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const effectiveStartTimeRef = useRef<number | null>(null);
    const pauseTimeRef = useRef<number | null>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            setError(null);

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            // Request screen + audio
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            // Request microphone
            let audioStream: MediaStream | null = null;
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err) {
                console.warn('Microphone access denied, continuing without audio');
            }

            // Combine streams
            const tracks = [
                ...displayStream.getVideoTracks(),
                ...(audioStream ? audioStream.getAudioTracks() : []),
            ];

            const combinedStream = new MediaStream(tracks);
            streamRef.current = combinedStream;

            // Create MediaRecorder
            const recorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9',
            });

            const chunks: Blob[] = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const duration = Date.now() - (effectiveStartTimeRef.current ?? Date.now());
                onRecordingComplete(blob, duration / 1000);

                // Show preview
                if (videoPreviewRef.current) {
                    videoPreviewRef.current.src = URL.createObjectURL(blob);
                }
            };

            recorder.start(100); // Collect data every 100ms

            // Reset and start timer
            setRecordingDuration(0); // Reset to 0
            const startTime = Date.now();
            effectiveStartTimeRef.current = startTime;
            pauseTimeRef.current = null;

            console.log('🎬 Starting timer at:', new Date(startTime).toLocaleTimeString());

            intervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                console.log('⏱️ Timer update:', elapsed);
                setRecordingDuration(elapsed);
            }, 1000);

            setState({
                isRecording: true,
                isPaused: false,
                recordedChunks: chunks,
                mediaRecorder: recorder,
                stream: combinedStream,
                startTime,
                pauseTime: null,
            });

            // Handle user stopping screen share
            displayStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

        } catch (err: any) {
            setError(err.message || 'Failed to start recording');
            console.error('Recording error:', err);
        }
    };

    const pauseRecording = () => {
        if (state.mediaRecorder && state.isRecording) {
            if (state.isPaused) {
                // Resume recording
                console.log('▶️ Resuming recording');
                state.mediaRecorder.resume();

                // Resume timer - adjust start time to account for paused duration
                const pausedDuration = Date.now() - (pauseTimeRef.current ?? Date.now());
                const newStartTime = (effectiveStartTimeRef.current ?? Date.now()) + pausedDuration;
                effectiveStartTimeRef.current = newStartTime;
                pauseTimeRef.current = null;

                console.log('⏱️ Resuming timer. Paused for:', pausedDuration, 'ms');

                // Restart interval
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                intervalRef.current = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - newStartTime) / 1000);
                    console.log('⏱️ Timer update (resumed):', elapsed);
                    setRecordingDuration(elapsed);
                }, 1000);

                setState({ ...state, isPaused: false, startTime: newStartTime, pauseTime: null });
            } else {
                // Pause recording
                console.log('⏸️ Pausing recording at:', recordingDuration, 'seconds');
                state.mediaRecorder.pause();

                // Pause timer - clear interval
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                    console.log('⏸️ Timer paused');
                }

                const now = Date.now();
                pauseTimeRef.current = now;
                setState({ ...state, isPaused: true, pauseTime: now });
            }
        }
    };

    const stopRecording = () => {
        if (state.mediaRecorder && state.stream) {
            state.mediaRecorder.stop();
            state.stream.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            effectiveStartTimeRef.current = null;
            pauseTimeRef.current = null;

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            setState({
                isRecording: false,
                isPaused: false,
                recordedChunks: [],
                mediaRecorder: null,
                stream: null,
                startTime: null,
                pauseTime: null,
            });
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-md">
                    <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Screen Recorder</h2>
                    <p className="text-gray-600 text-sm">Capture your screen with audio</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            {state.isRecording && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                            </div>
                            <span className="text-gray-900 font-semibold">
                                {state.isPaused ? 'Paused' : 'Recording'}
                            </span>
                        </div>
                        <div className="text-2xl font-mono text-gray-900 font-bold">
                            {formatTime(recordingDuration)}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={pauseRecording}
                            className="btn-outline flex-1 flex items-center justify-center gap-2"
                        >
                            {state.isPaused ? (
                                <>
                                    <Play className="w-5 h-5" />
                                    Resume
                                </>
                            ) : (
                                <>
                                    <Pause className="w-5 h-5" />
                                    Pause
                                </>
                            )}
                        </button>
                        <button
                            onClick={stopRecording}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
                        >
                            <Square className="w-5 h-5" />
                            Stop
                        </button>
                    </div>
                </div>
            )}

            {!state.isRecording && (
                <button
                    onClick={startRecording}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                >
                    <Video className="w-6 h-6" />
                    Start Recording
                </button>
            )}

            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Preview
                </h3>
                <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    <video
                        ref={videoPreviewRef}
                        controls
                        className="w-full h-full object-contain"
                    />
                    {!videoPreviewRef.current?.src && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-gray-400">No recording yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
