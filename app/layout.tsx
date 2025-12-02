// app/layout.tsx
import './globals.css'; // Assuming your global CSS is here

// Global metadata for the site's default tab name
export const metadata = {
  title: 'MARTA Bus Tracker Live',
  description: 'Real-Time, Persistent Bus Tracking for Atlanta MARTA.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* The suppressHydrationWarning is the fix for browser extension errors (like Grammarly)
        It tells React to ignore minor differences on the body tag between the server and the client.
      */}
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}