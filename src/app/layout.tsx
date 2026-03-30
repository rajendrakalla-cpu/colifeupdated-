import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "./providers";
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "CoLife — India's Smartest Co-Living Platform",
  description: "Discover premium co-living spaces across India. Book furnished rooms with modern amenities, pay rent seamlessly, and join a vibrant community of young professionals.",
  keywords: "co-living, PG, paying guest, rental, rooms, Bangalore, Mumbai, Pune, Hyderabad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <Providers>
          <Navbar />
          <main style={{ paddingTop: 72, minHeight: '100vh' }}>
            {children}
          </main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
