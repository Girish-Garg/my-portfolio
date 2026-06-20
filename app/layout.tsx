import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Hanken_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { profile } from "@/content/portfolio";
import { BottomFade } from "@/components/bottom-fade";
import "./globals.css";

// Display / UI - variable font, no weights needed.
const display = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
});

// Body - IBM Plex Sans ships static weights on Google Fonts.
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});

// Metadata / code accents.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: `${profile.name} - ${profile.role}`,
  description: profile.tagline,
  openGraph: {
    title: `${profile.name} - ${profile.role}`,
    description: profile.tagline,
    type: "website",
  },
};

// Match the browser chrome to the page background in each theme. (Next 16
// requires viewport fields in their own export, not inside `metadata`.)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

// Set theme before paint to avoid a flash. Default is dark unless the visitor
// previously chose light.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-dvh bg-base font-sans text-ink antialiased"
        suppressHydrationWarning
      >
        {/* Set theme before paint. `beforeInteractive` injects this into the
            document head and runs it ahead of hydration, so there is no flash
            of the wrong theme. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInit}
        </Script>

        <a
          href="#main"
          className="sr-only z-[100] rounded-md bg-accent px-4 py-2 font-mono text-xs uppercase tracking-widest text-accent-ink focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4"
        >
          Skip to content
        </a>

        {/* Film grain: backmost fixed layer, gives the flat fields depth. */}
        <div aria-hidden className="grain pointer-events-none fixed inset-0 -z-10" />

        {/* Drafting frame: two full-height hairlines at the content column
            edges, behind everything. Turns the whole page into a measured
            sheet without adding any per-section chrome. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 flex justify-center"
        >
          <div className="h-full w-full max-w-[1800px] border-x border-line" />
        </div>

        {children}

        {/* Bottom fade scrim - softens the lower edge mid-scroll, clears at the end. */}
        <BottomFade />
      </body>
    </html>
  );
}
