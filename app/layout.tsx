import { ModalProvider } from '@/providers/modal-provider';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react';
import { Inter } from 'next/font/google';
import ToastProvider from '@/providers/toast-provider';

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Home - Admin Dashboard',
  description: 'A point to manage your stores, categories and products',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Analytics />
          <ToastProvider />
          <ModalProvider />
          {children}
          </body>
      </html>
    </ClerkProvider>
    
  )
}
