import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Jarvis OS web shell — Phase 0 placeholder layout. */
export const metadata: Metadata = {
  title: "Jarvis OS",
  description: "AI Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
