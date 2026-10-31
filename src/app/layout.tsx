import type { Metadata, Viewport } from "next";
import { Geist_Mono, Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
import { PaletteProvider } from "@/components/command-palette";
import { Nav } from "@/components/nav";
import { ScentLensLink } from "@/components/scentlens-link";
import { Toaster } from "@/components/toaster";
import { AccordProvider } from "@/lib/store";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://accord.bhanusadhu.com"),
  title: { default: "Accord: know the bottle, find the next one", template: "%s · Accord" },
  description:
    "Identify fragrances from a photo, explore 24,642 perfumes by note and accord, and get recommendations that show their evidence.",
};

export const viewport: Viewport = { themeColor: "#f0f1f3" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${schibsted.variable} ${geistMono.variable}`}>
      <body className="flex min-h-dvh flex-col bg-bench pb-16 md:pb-0">
        <a
          href="#main"
          className="sr-only z-50 bg-paper px-4 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <AccordProvider>
          <PaletteProvider>
            <Nav />
            <main id="main" className="flex flex-1 flex-col">
              {children}
            </main>
            <Footer />
            <Toaster />
          </PaletteProvider>
        </AccordProvider>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-section-rule">
      <div className="site-frame grid gap-6 py-10 text-sm text-ink-3 md:grid-cols-[1fr_auto]">
        <p className="max-w-2xl leading-relaxed">
          Catalog text from the <span className="text-ink-2">doevent/perfume</span> dataset as cleaned by <ScentLensLink />. Accord shows no
          catalog photos, prices or ratings. Bottle recognition by{" "}
          <ScentLensLink />
          .
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-3">
          <li><Link href="/learn" className="hover:text-ink">Fragrance guide</Link></li>
          <li>
            <Link href="/how-it-works" className="hover:text-ink">
              How it works
            </Link>
          </li>
          <li>
            <a href="https://github.com/bhnsadhu/accord" className="project-link">
              Repository
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
