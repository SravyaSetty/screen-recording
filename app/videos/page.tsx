'use client';

import { useEffect, useState } from 'react';
import { StorageService } from '@/lib/storage';
import { VideoMetadata, VideoAnalytics } from '@/lib/types';
import { Video, Eye, TrendingUp, Trash2, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VideosPage() {
    const [videos, setVideos] = useState<VideoMetadata[]>([]);
    const [analytics, setAnalytics] = useState<Record<string, VideoAnalytics>>({});

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = () => {
        const allVideos = StorageService.getVideos();
        const allAnalytics = StorageService.getAllAnalytics();
        setVideos(allVideos);
        setAnalytics(allAnalytics);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this video?')) {
            StorageService.deleteVideo(id);
            loadVideos();
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDuration = (seconds: number): string => {
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
            return '0:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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
                            <h1 className="text-xl font-bold text-gray-900">My Videos</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {videos.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-flex p-6 bg-gray-100 rounded-full mb-4">
                            <Video className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No videos yet</h2>
                        <p className="text-gray-600 mb-6">Start by recording your first screen capture</p>
                        <Link href="/" className="btn-primary inline-flex items-center gap-2">
                            <Video className="w-5 h-5" />
                            Create Recording
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
                            </h2>
                            <Link href="/" className="btn-outline">
                                New Recording
                            </Link>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map((video) => {
                                const videoAnalytics = analytics[video.id];
                                return (
                                    <div key={video.id} className="card group hover:scale-105 transition-transform">
                                        <div className="aspect-video bg-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                                            <Video className="w-12 h-12 text-gray-400" />
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                                            {video.title}
                                        </h3>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Duration</span>
                                                <span className="text-gray-900 font-semibold">
                                                    {formatDuration(video.duration)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Size</span>
                                                <span className="text-gray-900 font-semibold">
                                                    {formatFileSize(video.size)}
                                                </span>
                                            </div>
                                            {videoAnalytics && (
                                                <>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600 flex items-center gap-1">
                                                            <Eye className="w-4 h-4" />
                                                            Views
                                                        </span>
                                                        <span className="text-blue-600 font-semibold">
                                                            {videoAnalytics.views}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600 flex items-center gap-1">
                                                            <TrendingUp className="w-4 h-4" />
                                                            Avg. Watch
                                                        </span>
                                                        <span className="text-orange-600 font-semibold">
                                                            {videoAnalytics.averageWatchPercentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href={video.shareUrl}
                                                className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(video.id)}
                                                className="btn-outline py-2 px-3 text-sm hover:bg-red-500 hover:border-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <p className="text-xs text-gray-500">
                                                Created {new Date(video.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
