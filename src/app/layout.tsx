import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="fr">
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Script 
          src="https://stats.killianherzer.com/script.js" 
          data-website-id="64124224-260b-4d98-b58c-fef58a9d8070"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
