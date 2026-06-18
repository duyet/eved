import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eved — Duyet's assistant",
  description: "Ask eved about Duyet, his work, and his projects.",
};

// Set the theme before paint to avoid a flash of the wrong mode.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
