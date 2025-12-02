import React from 'react';
import './globals.css'; // This ensures your Tailwind styles (colors, fonts) work

// Global metadata for the site
export const metadata = {
  title: 'MARTA Bus Tracker Live',
  description: 'Real-Time, Persistent Bus Tracking for Atlanta MARTA.',
};

// FIX: We explicitly tell TypeScript that 'children' is a React Node.
// This prevents the "implicitly has an 'any' type" error.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning fixes the Grammarly/Extension black bar error */}
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}