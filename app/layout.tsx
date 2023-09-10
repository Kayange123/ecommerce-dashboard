import { ModalProvider } from '@/providers/modal-provider';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next'
import {  Poppins } from 'next/font/google';
import ToastProvider from '@/providers/toast-provider';

import './globals.css'

const poppins = Poppins({ weight: "500", style: "normal", subsets: ["latin"]});

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
        <body className={poppins.className}>
          <ToastProvider />
          <ModalProvider />
          {children}
          </body>
      </html>
    </ClerkProvider>
    
  )
}
