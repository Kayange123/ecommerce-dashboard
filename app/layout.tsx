import { ModalProvider } from "@/providers/modal-provider";
import { ClerkThemedProvider } from "@/components/clerk-themed-provider";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import ToastProvider from "@/providers/toast-provider";

import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  style: "normal",
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Home - Admin Dashboard",
  description: "A point to manage your stores, categories and products",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={poppins.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkThemedProvider>
            <ToastProvider />
            <ModalProvider />
            {children}
          </ClerkThemedProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
