// Mock storage service (simulates S3/R2)
// In production, this would integrate with actual cloud storage

import { VideoMetadata, VideoAnalytics } from './types';

const STORAGE_KEY_VIDEOS = 'screen_recorder_videos';
const STORAGE_KEY_ANALYTICS = 'screen_recorder_analytics';

export class StorageService {
    // Video storage
    static async uploadVideo(file: Blob, metadata: Omit<VideoMetadata, 'id' | 'shareUrl'>): Promise<VideoMetadata> {
        const id = this.generateId();
        const shareUrl = `/watch/${id}`;

        // Convert blob to base64 for localStorage (in production, upload to S3/R2)
        const base64 = await this.blobToBase64(file);

        const videoData: VideoMetadata = {
            id,
            ...metadata,
            shareUrl,
        };

        try {
            // Store video data
            const videos = this.getVideos();
            videos.push(videoData);
            localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(videos));

            // Store video blob separately
            localStorage.setItem(`video_blob_${id}`, base64);

            // Initialize analytics
            this.initializeAnalytics(id);

            return videoData;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                console.warn('⚠️ Storage quota exceeded. Cleaning up old videos...');

                // Clean up old videos (keep only the 3 most recent)
                this.cleanupOldVideos(3);

                // Try again after cleanup
                try {
                    const videos = this.getVideos();
                    videos.push(videoData);
                    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(videos));
                    localStorage.setItem(`video_blob_${id}`, base64);
                    this.initializeAnalytics(id);

                    console.log('✅ Video uploaded successfully after cleanup');
                    return videoData;
                } catch (retryError) {
                    console.error('❌ Still not enough space after cleanup');
                    throw new Error('Storage quota exceeded. Please delete some videos manually.');
                }
            }
            throw error;
        }
    }

    static getVideos(): VideoMetadata[] {
        const data = localStorage.getItem(STORAGE_KEY_VIDEOS);
        return data ? JSON.parse(data) : [];
    }

    static getVideo(id: string): VideoMetadata | null {
        const videos = this.getVideos();
        return videos.find(v => v.id === id) || null;
    }

    static getVideoBlob(id: string): string | null {
        return localStorage.getItem(`video_blob_${id}`);
    }

    static deleteVideo(id: string): void {
        const videos = this.getVideos().filter(v => v.id !== id);
        localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(videos));
        localStorage.removeItem(`video_blob_${id}`);
        this.deleteAnalytics(id);
    }

    static cleanupOldVideos(keepCount: number = 3): void {
        const videos = this.getVideos();

        if (videos.length <= keepCount) {
            return; // Nothing to clean up
        }

        // Sort by creation date (newest first)
        videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Get videos to delete (oldest ones)
        const videosToDelete = videos.slice(keepCount);

        console.log(`🗑️ Deleting ${videosToDelete.length} old video(s) to free up space...`);

        // Delete old videos
        videosToDelete.forEach(video => {
            localStorage.removeItem(`video_blob_${video.id}`);
            this.deleteAnalytics(video.id);
        });

        // Keep only the recent videos
        const recentVideos = videos.slice(0, keepCount);
        localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(recentVideos));

        console.log(`✅ Kept ${recentVideos.length} most recent video(s)`);
    }

    // Analytics
    static initializeAnalytics(videoId: string): void {
        const analytics = this.getAllAnalytics();
        analytics[videoId] = {
            videoId,
            views: 0,
            completionData: [],
            averageWatchPercentage: 0,
        };
        localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(analytics));
    }

    static getAllAnalytics(): Record<string, VideoAnalytics> {
        const data = localStorage.getItem(STORAGE_KEY_ANALYTICS);
        return data ? JSON.parse(data) : {};
    }

    static getAnalytics(videoId: string): VideoAnalytics | null {
        const analytics = this.getAllAnalytics();
        return analytics[videoId] || null;
    }

    static incrementView(videoId: string): void {
        const analytics = this.getAllAnalytics();
        if (analytics[videoId]) {
            analytics[videoId].views += 1;
            analytics[videoId].lastViewed = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(analytics));
        }
    }

    static recordCompletion(videoId: string, watchPercentage: number, watchDuration: number): void {
        const analytics = this.getAllAnalytics();
        if (analytics[videoId]) {
            analytics[videoId].completionData.push({
                timestamp: new Date().toISOString(),
                watchPercentage,
                watchDuration,
            });

            // Calculate average watch percentage
            const total = analytics[videoId].completionData.reduce((sum, d) => sum + d.watchPercentage, 0);
            analytics[videoId].averageWatchPercentage = total / analytics[videoId].completionData.length;

            localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(analytics));
        }
    }

    static deleteAnalytics(videoId: string): void {
        const analytics = this.getAllAnalytics();
        delete analytics[videoId];
        localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(analytics));
    }

    // Utility functions
    private static generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private static async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}
