'use client';

import { useState } from 'react';
import ScreenRecorder from '@/components/ScreenRecorder';
import VideoTrimmer from '@/components/VideoTrimmer';
import VideoUploader from '@/components/VideoUploader';
import { Video, List } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
    const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
    const [trimmedVideo, setTrimmedVideo] = useState<Blob | null>(null);
    const [videoDuration, setVideoDuration] = useState(0);

    const handleRecordingComplete = (blob: Blob, duration: number) => {
        setRecordedVideo(blob);
        setTrimmedVideo(blob); // Initially, trimmed = recorded
        setVideoDuration(duration);
    };

    const handleTrimComplete = (blob: Blob, duration: number) => {
        setTrimmedVideo(blob);
        setVideoDuration(duration); // Update duration with trimmed duration
    };

    const resetWorkflow = () => {
        setRecordedVideo(null);
        setTrimmedVideo(null);
        setVideoDuration(0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-md">
                                <Video className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Screen Recorder Pro</h1>
                        </div>
                        <nav className="flex items-center gap-4">
                            <Link
                                href="/videos"
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <List className="w-5 h-5" />
                                My Videos
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12 animate-fade-in">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Record, Trim & Share
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Professional screen recording with built-in trimming and instant sharing
                    </p>
                </div>

                {/* Workflow Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${!recordedVideo ? 'bg-blue-100 border-2 border-blue-500' : 'bg-green-100 border-2 border-green-500'
                            }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${!recordedVideo ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                                }`}>
                                1
                            </div>
                            <span className="text-gray-900 font-semibold">Record</span>
                        </div>

                        <div className="w-8 h-1 bg-gray-300 hidden sm:block" />

                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${recordedVideo && !trimmedVideo ? 'bg-blue-100 border-2 border-blue-500' :
                            trimmedVideo ? 'bg-green-100 border-2 border-green-500' :
                                'bg-gray-100 border-2 border-gray-300'
                            }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${recordedVideo && !trimmedVideo ? 'bg-blue-600 text-white' :
                                trimmedVideo ? 'bg-green-600 text-white' :
                                    'bg-gray-400 text-white'
                                }`}>
                                2
                            </div>
                            <span className={`font-semibold ${recordedVideo ? 'text-gray-900' : 'text-gray-500'}`}>
                                Trim
                            </span>
                        </div>

                        <div className="w-8 h-1 bg-gray-300 hidden sm:block" />

                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${trimmedVideo ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100 border-2 border-gray-300'
                            }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${trimmedVideo ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
                                }`}>
                                3
                            </div>
                            <span className={`font-semibold ${trimmedVideo ? 'text-gray-900' : 'text-gray-500'}`}>
                                Share
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid lg:grid-cols-2 gap-8 animate-slide-up">
                    {/* Left Column - Recording */}
                    <div className="space-y-8">
                        <ScreenRecorder onRecordingComplete={handleRecordingComplete} />
                    </div>

                    {/* Right Column - Trimming & Upload */}
                    <div className="space-y-8">
                        {recordedVideo && (
                            <VideoTrimmer
                                videoBlob={recordedVideo}
                                onTrimComplete={handleTrimComplete}
                                onDurationLoaded={(dur) => setVideoDuration(dur)}
                            />
                        )}

                        {trimmedVideo && (
                            <VideoUploader
                                videoBlob={trimmedVideo}
                                videoDuration={videoDuration}
                            />
                        )}
                    </div>
                </div>

                {/* Reset Button */}
                {recordedVideo && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={resetWorkflow}
                            className="btn-outline"
                        >
                            Start New Recording
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 mt-20 bg-white/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <p className="text-center text-gray-600 text-sm">
                        Built with Next.js, TypeScript, and FFmpeg.wasm
                    </p>
                </div>
            </footer>
        </div>
    );
}
