import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { DataProvider } from "@/contexts/data-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { GoogleAuthProvider } from "@/components/GoogleAuthProvider";
import { ReactQueryProvider } from "@/contexts/react-query-provider";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";
import { Inter, Be_Vietnam_Pro, Public_Sans } from "next/font/google";

// 2. CẤU HÌNH FONT INTER VỚI CẢ 2 SUBSETS
const inter = Inter({
  subsets: ["latin", "vietnamese"], // <-- TẢI CẢ KÝ TỰ LATIN VÀ TIẾNG VIỆT
  variable: "--font-sans", // <-- Đặt tên biến CSS là --font-sans
  display: "swap",
});
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"], // Vẫn phải có 'vietnamese'
  variable: "--font-sans",
  weight: ["400", "500", "700"], // Chọn độ đậm bạn cần
  display: "swap",
});
const publicSans = Public_Sans({
  subsets: ["latin", "vietnamese"], // <-- TẢI CẢ KÝ TỰ LATIN VÀ TIẾNG VIỆT
  variable: "--font-sans", // <-- Vẫn giữ tên biến là --font-sans
  display: "swap",
  // Bạn có thể chọn các độ đậm (weight) cụ thể nếu muốn
  // weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  title: "UniClub - Student Club Loyalty & Membership System",
  description: "Modern student club loyalty and membership management system",
  generator: "v0.app",
  icons: {
    icon: "/images/logo_web.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}> */}
      {/* <body className={`font-sans ${inter.variable} ${GeistMono.variable}`}> */}
      {/* <body className={`font-sans ${beVietnamPro.variable} ${GeistMono.variable}`}> */}
      <body
        className={`font-sans ${publicSans.variable} ${GeistMono.variable}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={true}
        >
          <ReactQueryProvider>
            <GoogleAuthProvider>
              <AuthProvider>
                <DataProvider>
                  <NotificationProvider>
                    <Suspense fallback={null}>{children}</Suspense>
                    <Toaster />
                  </NotificationProvider>
                </DataProvider>
              </AuthProvider>
            </GoogleAuthProvider>
          </ReactQueryProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
