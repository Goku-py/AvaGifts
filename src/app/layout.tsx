import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { CatalogProvider } from "@/components/catalog/catalog-context";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Piku } from "@/components/piku";
import { PikuConciergeProvider, PikuModal } from "@/components/piku-concierge";
import { PikuGameProvider } from "@/components/piku-game/piku-game-context";
import { MotionDefaults } from "@/components/ui/reveal";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});

const serif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-serif",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "AvaGifts — Corporate gifting, curated",
    template: "%s — AvaGifts",
  },
  description:
    "AvaGifts curates, customises and delivers premium gifts from India’s finest makers — for teams, clients and the moments that matter.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <MotionDefaults>
          <CatalogProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-interactive focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-white"
              >
              Skip to content
            </a>
            <PikuConciergeProvider>
              <PikuGameProvider>
                <Header />
                <main id="main" className="flex-1">
                  {children}
                </main>
                <Footer />
                <Piku />
                <PikuModal />
              </PikuGameProvider>
            </PikuConciergeProvider>
          </CatalogProvider>
        </MotionDefaults>
      </body>
    </html>
  );
}
