import type { Metadata } from "next";
import "./globals.css";

// Keep the Google Fonts stylesheet remote so production builds do not need network access.
/* eslint-disable @next/next/no-page-custom-font */

export const metadata: Metadata = {
  title: "Octen | Merchant operations",
  description: "Wholesale operations, customer credit, and deliveries in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@14..144,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
