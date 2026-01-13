'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { StorageService } from '@/lib/storage';
import { VideoMetadata, VideoAnalytics } from '@/lib/types';
import { Video, Eye, TrendingUp, Calendar, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function WatchPage() {
    const params = useParams();
    const videoId = params.id as string;

    const [video, setVideo] = useState<VideoMetadata | null>(null);
    const [analytics, setAnalytics] = useState<VideoAnalytics | null>(null);
    const [videoBlob, setVideoBlob] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const viewCountedRef = useRef(false);
    const watchStartTimeRef = useRef<number>(0);
    const maxWatchPercentageRef = useRef<number>(0);

    useEffect(() => {
        loadVideo();
    }, [videoId]);

    const loadVideo = () => {
        const videoData = StorageService.getVideo(videoId);
        const videoAnalytics = StorageService.getAnalytics(videoId);
        const blob = StorageService.getVideoBlob(videoId);

        if (videoData && blob) {
            setVideo(videoData);
            setAnalytics(videoAnalytics);
            setVideoBlob(blob);

            // Increment view count (once per session)
            if (!viewCountedRef.current) {
                StorageService.incrementView(videoId);
                viewCountedRef.current = true;
                // Reload analytics to show updated count
                setTimeout(() => {
                    setAnalytics(StorageService.getAnalytics(videoId));
                }, 100);
            }
        }

        setLoading(false);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && video) {
            const currentTime = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            const watchPercentage = (currentTime / duration) * 100;

            // Track maximum watch percentage
            if (watchPercentage > maxWatchPercentageRef.current) {
                maxWatchPercentageRef.current = watchPercentage;
            }
        }
    };

    const handleVideoEnd = () => {
        // Record completion when video ends or user navigates away
        if (videoRef.current && video) {
            const watchDuration = Date.now() - watchStartTimeRef.current;
            StorageService.recordCompletion(
                videoId,
                maxWatchPercentageRef.current,
                watchDuration / 1000
            );
        }
    };

    const handlePlay = () => {
        if (watchStartTimeRef.current === 0) {
            watchStartTimeRef.current = Date.now();
        }
    };

    const handleDownload = () => {
        if (videoBlob) {
            const a = document.createElement('a');
            a.href = videoBlob;
            a.download = video?.filename || 'video.webm';
            a.click();
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex p-6 bg-blue-100 rounded-full mb-4 animate-pulse">
                        <Video className="w-12 h-12 text-blue-600" />
                    </div>
                    <p className="text-gray-600 font-medium">Loading video...</p>
                </div>
            </div>
        );
    }

    if (!video || !videoBlob) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex p-6 bg-gray-100 rounded-full mb-4">
                        <Video className="w-12 h-12 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Video not found</h2>
                    <p className="text-gray-600 mb-6">This video may have been deleted or the link is invalid</p>
                    <Link href="/" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft className="w-5 h-5" />
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </Link>
                            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl shadow-md">
                                <Video className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Screen Recorder Pro</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="space-y-8">
                    {/* Video Player */}
                    <div className="card">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">{video.title}</h1>

                        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden mb-6 shadow-inner">
                            <video
                                ref={videoRef}
                                src={videoBlob}
                                controls
                                className="w-full h-full"
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={handleVideoEnd}
                                onPlay={handlePlay}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(video.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </div>
                                <div>
                                    {formatDuration(video.duration)} • {formatFileSize(video.size)}
                                </div>
                            </div>

                            <button
                                onClick={handleDownload}
                                className="btn-outline flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                        </div>
                    </div>

                    {/* Analytics */}
                    {analytics && (
                        <div className="card">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                                Analytics
                            </h2>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 rounded-xl">
                                            <Eye className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Total Views</p>
                                            <p className="text-3xl font-bold text-gray-900">{analytics.views}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-orange-100 rounded-xl">
                                            <TrendingUp className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Avg. Completion</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {analytics.averageWatchPercentage.toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-green-100 rounded-xl">
                                            <Video className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Total Watches</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {analytics.completionData.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {analytics.completionData.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Watch Sessions</h3>
                                    <div className="space-y-3">
                                        {analytics.completionData.slice(-5).reverse().map((data, index) => (
                                            <div key={index} className="flex items-center justify-between bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4">
                                                <div>
                                                    <p className="text-sm text-gray-700 font-medium">
                                                        {new Date(data.timestamp).toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Watched for {data.watchDuration.toFixed(0)}s
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold text-gray-900">
                                                        {data.watchPercentage.toFixed(0)}%
                                                    </p>
                                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-600 to-orange-500"
                                                            style={{ width: `${data.watchPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
