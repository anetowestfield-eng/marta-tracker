import { type Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Hamilton Bus Tracker',
  description: 'Real-Time Fleet Recovery System',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        {/* Added suppressHydrationWarning to fix browser extension errors */}
        <body 
          className={`${geistSans.variable} ${geistMono.variable} antialiased`} 
          suppressHydrationWarning
        >
          {/* This Header will now appear on EVERY page automatically */}
          <header className="flex justify-end items-center p-4 gap-4 h-16 bg-gray-100 border-b border-gray-200">
            <SignedOut>
              <SignInButton />
              <SignUpButton>
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-[#5639cc] transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              {/* This puts the User Profile Circle in the top right corner of every page */}
              <UserButton />
            </SignedIn>
          </header>
          
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}