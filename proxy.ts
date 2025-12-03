import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes are protected (The Tracker Dashboard)
const isProtectedRoute = createRouteMatcher(['/tracker(.*)']);

// This is the "export default" the error is asking for!
export default clerkMiddleware((auth, req) => {
  // If they try to go to tracker, block them if not logged in
  if (isProtectedRoute(req)) auth().protect();
});

export const config = {
  // This matcher tells Next.js which pages to check
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};