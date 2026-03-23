import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "[noname] - Beta Test",
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
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}
