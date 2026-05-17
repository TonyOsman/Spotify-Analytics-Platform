import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Statify | Spotify AI Analytics",
  description: "Deep-dive into your Spotify listening patterns with AI-powered analytics and playlist generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
