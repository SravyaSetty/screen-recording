import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Screen Recorder Pro - Record, Trim & Share',
    description: 'Professional screen recording with trimming, analytics, and easy sharing',
    keywords: ['screen recording', 'video editing', 'screen capture', 'video trimming'],
    icons: {
        icon: '/favicon.ico',
    },
    openGraph: {
        title: 'Screen Recorder Pro',
        description: 'Professional screen recording with trimming, analytics, and easy sharing',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
