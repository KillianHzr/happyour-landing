import type { Metadata } from "next";
import { Inter, Parkinsans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "./design-system.css";
import { ThemeProvider, noFlashThemeScript, themeCss } from "@/theme";
import SmoothScroll from "@/components/SmoothScroll";

// Variable font so every token weight (100–900) is available, exposed as --font-sans.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Display font, self-hosted by Next at build time. Use via var(--font-parkinsans).
const parkinsans = Parkinsans({ subsets: ["latin"], variable: "--font-parkinsans" });

export const metadata: Metadata = {
  title: "HappyOur - Beta Test",
  description: "Capturez vos moments intimes avec vos cercles proches et revivez votre semaine.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${parkinsans.variable}`} suppressHydrationWarning>
      <head>
        {/* Design-token CSS variables (Light default + Dark override). */}
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
        {/* Apply persisted mode before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </ThemeProvider>
        <Script
          src="https://stats.killianherzer.com/script.js" 
          data-website-id="64124224-260b-4d98-b58c-fef58a9d8070"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
