import type { Metadata, Viewport } from "next";
import { Geist_Mono, Schibsted_Grotesk } from "next/font/google";
import Link from "next/link";
import { PaletteProvider } from "@/components/command-palette";
import { Nav } from "@/components/nav";
import { ScentLensLink } from "@/components/scentlens-link";
import { ExternalLinkIcon } from "@/components/icons";
import { Toaster } from "@/components/toaster";
import { AccordProvider } from "@/lib/store";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
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
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-10 text-sm text-ink-3 sm:px-8 md:grid-cols-[1fr_auto] lg:px-16">
        <p className="max-w-2xl leading-relaxed">
          Catalog text from the <span className="text-ink-2">doevent/perfume</span> dataset as cleaned by <ScentLensLink />. Accord shows no
          catalog photos, prices or ratings. Bottle recognition by{" "}
          <ScentLensLink />
          .
        </p>
        <ul className="flex gap-6">
          <li>
            <Link href="/how-it-works" className="hover:text-ink">
              How it works
            </Link>
          </li>
          <li>
            <a href="https://github.com/bhnsadhu/accord" className="project-link">
              Repository <ExternalLinkIcon width={12} height={12} />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
