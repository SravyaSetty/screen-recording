'use client';

import { useState } from 'react';
import { Upload, Link2, Check, Loader2, Share2 } from 'lucide-react';
import { StorageService } from '@/lib/storage';
import { VideoMetadata } from '@/lib/types';

interface VideoUploaderProps {
    videoBlob: Blob;
    videoDuration: number;
}

export default function VideoUploader({ videoBlob, videoDuration }: VideoUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [videoData, setVideoData] = useState<VideoMetadata | null>(null);
    const [title, setTitle] = useState('My Screen Recording');
    const [copied, setCopied] = useState(false);

    const handleUpload = async () => {
        try {
            setUploading(true);

            // Simulate upload delay (in production, this would upload to S3/R2)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const metadata = await StorageService.uploadVideo(videoBlob, {
                title,
                filename: `recording-${Date.now()}.webm`,
                duration: videoDuration,
                size: videoBlob.size,
                createdAt: new Date().toISOString(),
            });

            setVideoData(metadata);
            setUploaded(true);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload video. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const copyShareLink = () => {
        if (videoData) {
            const fullUrl = `${window.location.origin}${videoData.shareUrl}`;
            navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDuration = (seconds: number): string => {
        if (!seconds || seconds === 0) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        if (mins === 0) return `${secs}s`;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="card space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-brand-secondary to-brand-primary rounded-xl shadow-md">
                    <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Upload & Share</h2>
                    <p className="text-gray-600 text-sm">Save and generate share link</p>
                </div>
            </div>

            {!uploaded ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Video Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                            placeholder="Enter video title..."
                        />
                    </div>

                    <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">File Size</span>
                            <span className="text-gray-900 font-semibold">{formatFileSize(videoBlob.size)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Duration</span>
                            <span className="text-gray-900 font-semibold">{formatDuration(videoDuration)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Format</span>
                            <span className="text-gray-900 font-semibold">WebM</span>
                        </div>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !title.trim()}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-6 h-6" />
                                Upload Video
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-secondary/20 rounded-full">
                                <Check className="w-6 h-6 text-brand-secondary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Upload Successful!</h3>
                                <p className="text-sm text-gray-600">Your video is ready to share</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Share Link
                                </label>
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={`${window.location.origin}${videoData?.shareUrl}`}
                                        readOnly
                                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                    <button
                                        onClick={copyShareLink}
                                        className="btn-outline px-4 py-2 flex items-center gap-2"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Link2 className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-white border border-gray-200 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 font-medium">Video ID</p>
                                    <p className="text-sm font-mono text-gray-900 truncate">{videoData?.id}</p>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 font-medium">Created</p>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {videoData?.createdAt && new Date(videoData.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <a
                        href={videoData?.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary w-full flex items-center justify-center gap-2 py-4 text-lg"
                    >
                        <Share2 className="w-6 h-6" />
                        View Public Page
                    </a>
                </div>
            )}
        </div>
    );
}
