import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavigationWrapper from "@/components/NavigationWrapper";
import ClerkAuthControls from "@/components/ClerkAuthControls";
import DevNavigationWrapper from "@/components/DevNavigationWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fitcore.ai";
const TAGLINE = "Your AI fitness coach that builds consistency";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `FitCore AI — ${TAGLINE}`,
    template: "%s · FitCore AI",
  },
  description:
    "FitCore AI is your always-on AI coach: adaptive workout and nutrition plans, a coach that remembers you, daily habits, and streaks that keep you consistent — on web and (soon) WhatsApp.",
  applicationName: "FitCore AI",
  keywords: [
    "AI fitness coach",
    "workout plan",
    "nutrition tracker",
    "habit tracker",
    "consistency",
    "streaks",
    "personal trainer",
    "WhatsApp fitness coach",
  ],
  authors: [{ name: "FitCore AI" }],
  creator: "FitCore AI",
  publisher: "FitCore AI",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "FitCore AI",
    title: `FitCore AI — ${TAGLINE}`,
    description:
      "Adaptive plans, a coach that remembers you, and streaks that keep you consistent.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "FitCore AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitCore AI",
    description: TAGLINE,
    images: ["/logo.png"],
  },
  icons: { icon: "/favicon.ico", apple: "/icon.png" },
  appleWebApp: { capable: true, title: "FitCore AI", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0d0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`} suppressHydrationWarning>
      <body
        className="min-h-full bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans"
        suppressHydrationWarning
      >
        {clerkConfigured ? (
          <ClerkProvider>
            <ClerkAuthControls />
            <NavigationWrapper>{children}</NavigationWrapper>
          </ClerkProvider>
        ) : (
          <DevNavigationWrapper>{children}</DevNavigationWrapper>
        )}
      </body>
    </html>
  );
}
