import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from 'react';
import "./globals.css";

// Move viewport configuration from metadata to viewport export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FECB00',
};

export const metadata: Metadata = {
  title: 'Leach Hockey Scoreboard',
  description: 'Interactive scoreboard for 4-way hockey games',
  manifest: '/manifest.json',
  themeColor: '#FECB00',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Leach Hockey Scoreboard'
  }
};

export default function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
