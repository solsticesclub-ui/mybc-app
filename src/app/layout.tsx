import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MYBC — Mind Your Birth Code",
  description: "Your personalised birth-chart report, decoded for daily life.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MYBC" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="theme-color" content="#1a1c21" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full" suppressHydrationWarning>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        ` }} />
      </body>
    </html>
  );
}
