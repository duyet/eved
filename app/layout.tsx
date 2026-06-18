import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eved — Duyet's assistant",
  description: "Ask eved about Duyet, his work, and his projects.",
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
