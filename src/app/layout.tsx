import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora, Space_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Web3Provider } from "@/providers/Web3Provider";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
});

const mono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "LiquiMint - Bonding Curve Launchpad",
  description: "Launch, trade, and secure bonding-curve assets with institutional-grade tooling on Polygon Amoy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${jakarta.variable} ${mono.variable} font-sans antialiased bg-dark-bg-primary text-slate-900`}>
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(59,130,246,0.2),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(255,153,102,0.18),transparent_34%),linear-gradient(180deg,#f7f9fc_0%,#f3f7fd_42%,#eef4fc_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(130,153,189,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(130,153,189,0.12)_1px,transparent_1px)] bg-[size:34px_34px] [mask-image:radial-gradient(ellipse_at_center,black_62%,transparent_96%)]" />
          <div className="absolute inset-0 opacity-55 [background:radial-gradient(circle_at_22%_22%,rgba(255,255,255,0.7)_0,transparent_28%),radial-gradient(circle_at_78%_76%,rgba(255,255,255,0.55)_0,transparent_24%)]" />
        </div>
        <Web3Provider>
          <Navigation />
          <main className="relative pb-8">{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}

