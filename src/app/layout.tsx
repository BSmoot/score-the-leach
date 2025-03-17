import type { Metadata, Viewport } from "next";
import type { ReactNode } from 'react';
import { jakarta, orbitron } from './fonts';
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
    <html lang="en" className={`${jakarta.variable} ${orbitron.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}