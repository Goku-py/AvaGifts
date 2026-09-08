import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { CatalogProvider } from "@/components/catalog/catalog-context";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Piku } from "@/components/piku";
import {
  PikuConciergeProvider,
  PikuDock,
  PikuModal,
} from "@/components/piku-concierge";
import { MotionDefaults } from "@/components/ui/reveal";
import "@/components/piku-concierge/piku-concierge.css";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
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
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <MotionDefaults>
          <CatalogProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-paper"
            >
              Skip to content
            </a>
            <PikuConciergeProvider>
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
              <Piku />
              <PikuDock />
              <PikuModal />
            </PikuConciergeProvider>
          </CatalogProvider>
        </MotionDefaults>
      </body>
    </html>
  );
}
