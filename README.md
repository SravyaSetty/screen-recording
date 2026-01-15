# Screen Recorder Pro

A professional screen recording MVP built with Next.js, TypeScript, and modern web APIs. Record your screen with audio, trim videos client-side, upload to storage, and share with built-in analytics.

## Features

### 🎥 Screen Recording
- **MediaRecorder API** for high-quality screen + microphone capture
- Real-time recording timer
- Pause/Resume functionality
- Live preview
- Automatic cleanup on stop

### ✂️ Video Trimming
- **Client-side processing** with ffmpeg.wasm (no server required)
- Dual range sliders for precise start/end time selection
- Live video preview with playback controls
- Progress tracking during trim operations
- Export to WebM format

### 📤 Upload & Share
- Mock storage service (simulates S3/R2 with localStorage)
- Automatic share link generation
- Copy-to-clipboard functionality
- Video metadata management
- Direct link to public viewing page

### 📊 Analytics
- **View count tracking** - Increments on each unique session
- **Watch completion percentage** - Tracks how much of the video was watched
- **Session duration tracking** - Records total watch time
- **Analytics dashboard** - View metrics for each video
- **Persistent storage** - All data saved to localStorage

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Video Processing**: FFmpeg.wasm
- **Recording**: MediaRecorder API
- **Storage**: localStorage (mock S3/R2)
- **Icons**: Lucide React

## Project Structure

```
screen-recording/
├── app/
│   ├── layout.tsx          # Root layout with SEO
│   ├── page.tsx            # Main recording page
│   ├── globals.css         # Global styles & design system
│   ├── videos/
│   │   └── page.tsx        # Video library
│   └── watch/
│       └── [id]/
│           └── page.tsx    # Public watch page with analytics
├── components/
│   ├── ScreenRecorder.tsx  # Recording component
│   ├── VideoTrimmer.tsx    # Trimming component
│   └── VideoUploader.tsx   # Upload & share component
├── lib/
│   ├── types.ts            # TypeScript definitions
│   └── storage.ts          # Mock storage service
├── next.config.ts          # Next.js config (CORS headers for ffmpeg)
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## Architecture Decisions

- **Next.js App Router**: Routes map cleanly to the product flows (`/`, `/videos`, `/watch/[id]`) while keeping the UI as React components.
- **Client-side recording**: Uses the browser MediaRecorder APIs to avoid any server dependency during capture.
- **Client-side trimming (FFmpeg.wasm)**: Keeps trimming private (no upload required) and works as a self-contained MVP.
- **Cross-origin isolation headers (COOP/COEP)**: Enabled in `next.config.ts` to support FFmpeg.wasm runtime requirements in modern browsers.
- **Mock storage + analytics via `localStorage`**: Simple persistence for an MVP without a backend. This also makes demo/testing easy.

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Browser Requirements
- **Recommended**: Chrome or Edge (best MediaRecorder + WebM codec support)
- **Notes**: Some browsers may not support the chosen recording `mimeType` (`video/webm;codecs=vp9`).

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

### Common Setup Issues
- If trimming fails to load, confirm the app is serving the **COOP/COEP headers** from `next.config.ts` (required for FFmpeg.wasm in many setups).
- If microphone capture is missing, check the browser permission prompt and OS audio input permissions.

## Usage

### Recording a Video
1. Click "Start Recording" on the home page
2. Select the screen/window to capture
3. Grant microphone permissions (optional)
4. Click "Stop" when finished

### Trimming a Video
1. After recording, the trimmer appears automatically
2. Adjust start and end time sliders
3. Preview your selection
4. Click "Trim Video" to process

### Uploading & Sharing
1. Enter a title for your video
2. Click "Upload Video"
3. Copy the share link
4. Share with anyone!

### Viewing Analytics
1. Navigate to "My Videos"
2. Click "View" on any video
3. See view counts, completion rates, and watch sessions

## Design Philosophy

### Premium UI/UX
- **Glassmorphism effects** for modern aesthetics
- **Gradient accents** with curated color palette
- **Smooth animations** for enhanced user experience
- **Responsive design** works on all screen sizes
- **Dark mode** optimized interface

### Performance
- **Client-side video processing** - No server uploads needed for trimming
- **Lazy loading** - Components load only when needed
- **Optimized builds** - Next.js automatic optimization

### Developer Experience
- **TypeScript** for type safety
- **Clean architecture** with separation of concerns
- **Reusable components** following DRY principles
- **Comprehensive comments** for maintainability

## Storage Implementation

Currently uses **localStorage** as a mock storage service. In production, replace with:

### AWS S3 Integration
```typescript
// lib/storage.ts
export class StorageService {
  static async uploadVideo(file: Blob, metadata: VideoMetadata) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }
}
```

### Cloudflare R2 Integration
```typescript
// Similar to S3, use R2 SDK or API
```

## Analytics Implementation

Current implementation uses localStorage. For production:

### Database Integration
```typescript
// Use Prisma, Supabase, or MongoDB
await prisma.analytics.create({
  data: {
    videoId,
    views: 1,
    watchPercentage,
    timestamp: new Date(),
  },
});
```

## What I’d Improve for Production

### Storage & Delivery
- Move video blobs from `localStorage` to **object storage** (S3 / R2) with signed URLs.
- Use **streaming-friendly delivery** (HLS/DASH) for large videos and faster playback start.
- Generate **thumbnails** and basic metadata server-side for the library view.

### Data & Analytics
- Store analytics in a database (Postgres/Supabase/etc.) instead of localStorage.
- Record watch sessions not only on `onEnded`, but also on **route changes / tab close** (e.g., `visibilitychange`, `beforeunload`).
- Add basic event validation and bot filtering if links are public.

### Recording & Processing
- Add MediaRecorder `mimeType` **fallback selection** (vp9 -> vp8 -> default) for broader browser support.
- Consider recording to **IndexedDB** (or streaming to server) for long sessions and to avoid RAM pressure.
- Offload heavy work to **Web Workers** where possible to keep UI responsive.

### Product/Platform
- Authentication + per-user storage quotas.
- Server-side rate limits and abuse protection for public links.
- Monitoring/telemetry (error reporting + performance traces).
- Test coverage for `StorageService` and route-level behavior.

## Browser Compatibility

- **Chrome/Edge**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Partial support (MediaRecorder may need polyfill)

## Limitations & Future Enhancements

### Current Limitations
- localStorage has ~5-10MB limit (use IndexedDB for larger videos)
- WebM format only (can add MP4 conversion)
- No user authentication
- No video thumbnails

### Potential Enhancements
- [ ] User authentication & accounts
- [ ] Video thumbnails generation
- [ ] MP4 export option
- [ ] Advanced editing (filters, text overlays)
- [ ] Batch operations
- [ ] Video compression options
- [ ] Real-time collaboration
- [ ] Comments & reactions

## Performance Notes

- FFmpeg.wasm loads ~30MB on first use (cached afterward)
- Trimming performance depends on video length
- Large videos (>100MB) may hit localStorage limits

## License

MIT

## Credits

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
