'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Scissors, Download, Loader2, Play, Pause } from 'lucide-react';
import { TrimSettings } from '@/lib/types';

interface VideoTrimmerProps {
    videoBlob: Blob;
    onTrimComplete: (trimmedBlob: Blob, duration: number) => void;
    onDurationLoaded?: (duration: number) => void; // Optional callback when video duration is loaded
}

export default function VideoTrimmer({ videoBlob, onTrimComplete, onDurationLoaded }: VideoTrimmerProps) {
    const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [trimming, setTrimming] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const [trimSettings, setTrimSettings] = useState<TrimSettings>({
        startTime: 0,
        endTime: 0,
        duration: 0,
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const videoUrl = useRef<string>('');

    useEffect(() => {
        loadFFmpeg();
        videoUrl.current = URL.createObjectURL(videoBlob);

        return () => {
            if (videoUrl.current) {
                URL.revokeObjectURL(videoUrl.current);
            }
        };
    }, [videoBlob]);

    const loadFFmpeg = async () => {
        try {
            setLoading(true);
            const ffmpegInstance = new FFmpeg();

            ffmpegInstance.on('log', ({ message }) => {
                console.log(message);
            });

            ffmpegInstance.on('progress', ({ progress: prog }) => {
                setProgress(Math.round(prog * 100));
            });

            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
            await ffmpegInstance.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            setFFmpeg(ffmpegInstance);
            setLoaded(true);
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            console.log('📹 Video duration loaded:', dur);

            // Only validate for truly invalid values
            if (isNaN(dur)) {
                console.error('❌ Invalid video duration: NaN');
                return;
            }

            // If duration is Infinity or 0, use seek method to force calculation
            if (!isFinite(dur) || dur === 0) {
                console.log('⚠️ Duration is', dur, '- using seek method to calculate...');

                // This is a known issue with WebM videos from MediaRecorder
                // Solution: Seek to a very large time, which forces the browser to calculate duration
                const video = videoRef.current;

                const handleDurationChange = () => {
                    const newDur = video.duration;
                    console.log('🔄 Duration changed to:', newDur);

                    if (isFinite(newDur) && newDur > 0) {
                        console.log('✅ Duration calculated successfully:', newDur);

                        // Reset video to start
                        video.currentTime = 0;

                        setDuration(newDur);
                        setTrimSettings({
                            startTime: 0,
                            endTime: newDur,
                            duration: newDur,
                        });

                        if (onDurationLoaded) {
                            onDurationLoaded(newDur);
                        }

                        // Remove the event listener
                        video.removeEventListener('durationchange', handleDurationChange);
                    }
                };

                // Listen for duration change
                video.addEventListener('durationchange', handleDurationChange);

                // Seek to a very large time to force duration calculation
                // The browser will automatically set currentTime to the actual duration
                video.currentTime = 1e101;

                // Fallback: If durationchange doesn't fire, try after a delay
                setTimeout(() => {
                    if (video.duration && isFinite(video.duration) && video.duration > 0) {
                        handleDurationChange();
                    } else {
                        console.error('❌ Failed to calculate duration using seek method');
                        // Last resort: Set a default duration
                        const fallbackDur = 10; // 10 seconds default
                        console.log('⚠️ Using fallback duration:', fallbackDur);
                        setDuration(fallbackDur);
                        setTrimSettings({
                            startTime: 0,
                            endTime: fallbackDur,
                            duration: fallbackDur,
                        });
                    }
                }, 1000);

                return;
            }

            if (dur < 0) {
                console.error('❌ Invalid video duration: < 0');
                return;
            }

            console.log('✅ Duration loaded immediately:', dur);
            setDuration(dur);
            setTrimSettings({
                startTime: 0,
                endTime: dur,
                duration: dur,
            });

            // Notify parent of the loaded duration
            if (onDurationLoaded) {
                onDurationLoaded(dur);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleStartTimeChange = (value: number) => {
        const newStart = Math.min(value, trimSettings.endTime - 0.1);
        setTrimSettings({
            ...trimSettings,
            startTime: newStart,
            duration: trimSettings.endTime - newStart,
        });
        if (videoRef.current) {
            videoRef.current.currentTime = newStart;
        }
    };

    const handleEndTimeChange = (value: number) => {
        const newEnd = Math.max(value, trimSettings.startTime + 0.1);
        setTrimSettings({
            ...trimSettings,
            endTime: newEnd,
            duration: newEnd - trimSettings.startTime,
        });
    };

    const trimVideo = async () => {
        if (!ffmpeg || !loaded) return;

        try {
            setTrimming(true);
            setProgress(0);

            // Write input file
            await ffmpeg.writeFile('input.webm', await fetchFile(videoBlob));

            // Trim video
            const duration = trimSettings.endTime - trimSettings.startTime;
            await ffmpeg.exec([
                '-i', 'input.webm',
                '-ss', trimSettings.startTime.toString(),
                '-t', duration.toString(),
                '-c', 'copy',
                'output.webm',
            ]);

            // Read output file
            const data = await ffmpeg.readFile('output.webm');
            // Convert to Uint8Array to ensure ArrayBuffer compatibility
            const uint8Data = new Uint8Array(data as Uint8Array);
            const trimmedBlob = new Blob([uint8Data], { type: 'video/webm' });

            onTrimComplete(trimmedBlob, duration);

            // Update preview
            if (videoRef.current) {
                URL.revokeObjectURL(videoUrl.current);
                videoUrl.current = URL.createObjectURL(trimmedBlob);
                videoRef.current.src = videoUrl.current;
            }

        } catch (error) {
            console.error('Trimming error:', error);
            alert('Failed to trim video. Please try again.');
        } finally {
            setTrimming(false);
            setProgress(0);
        }
    };

    const formatTime = (seconds: number): string => {
        // Handle invalid values
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
            return '00:00.00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div className="card space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-brand-secondary to-brand-primary rounded-xl shadow-md">
                    <Scissors className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Video Trimmer</h2>
                    <p className="text-gray-600 text-sm">Trim start and end times</p>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                    <span className="ml-3 text-gray-600">Loading video processor...</span>
                </div>
            )}

            {loaded && (
                <>
                    <div className="space-y-4">
                        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-300 shadow-inner">
                            <video
                                ref={videoRef}
                                src={videoUrl.current}
                                preload="metadata"
                                onLoadedMetadata={handleLoadedMetadata}
                                onTimeUpdate={handleTimeUpdate}
                                className="w-full h-full object-contain"
                            />

                            <button
                                onClick={togglePlayPause}
                                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                            >
                                {isPlaying ? (
                                    <Pause className="w-16 h-16 text-white drop-shadow-lg" />
                                ) : (
                                    <Play className="w-16 h-16 text-white drop-shadow-lg" />
                                )}
                            </button>

                            {/* Timeline indicator */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                                <div
                                    className="h-full bg-brand-primary transition-all"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Trim controls */}
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">Start Time</label>
                                    <span className="text-brand-primary font-mono font-bold text-lg">{formatTime(trimSettings.startTime)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={duration}
                                    step={0.1}
                                    value={trimSettings.startTime}
                                    onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">End Time</label>
                                    <span className="text-brand-secondary font-mono font-bold text-lg">{formatTime(trimSettings.endTime)}</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={duration}
                                    step={0.1}
                                    value={trimSettings.endTime}
                                    onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
                                />
                            </div>

                            <div className="pt-2 border-t border-gray-300">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 font-medium">Trimmed Duration</span>
                                    <span className="text-gray-900 font-bold text-lg">{formatTime(trimSettings.duration)}</span>
                                </div>
                            </div>
                        </div>

                        {trimming && (
                            <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-700 font-medium">Processing video...</span>
                                    <span className="text-sm font-semibold text-brand-primary">{progress}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={trimVideo}
                            disabled={trimming || !loaded}
                            className="btn-secondary w-full flex items-center justify-center gap-2 py-4 text-lg"
                        >
                            {trimming ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Trimming...
                                </>
                            ) : (
                                <>
                                    <Scissors className="w-6 h-6" />
                                    Trim Video
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
