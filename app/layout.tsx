// app/layout.tsx
import React from 'react'; // <--- ADD THIS IMPORT

export const metadata = {
  title: 'MARTA Bus Tracker Live',
  description: 'Real-Time, Persistent Bus Tracking for Atlanta MARTA.',
};

// FIX: We define 'children' as a standard React Node type.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* The hydration fix is here to stop errors from browser extensions */}
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}