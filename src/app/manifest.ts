import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MYBC — Mind Your Birth Code",
    short_name: "MYBC",
    description: "Your personalised birth-chart report, decoded for daily life.",
    start_url: "/hub",
    display: "standalone",
    background_color: "#1a1c21",
    theme_color: "#1a1c21",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
