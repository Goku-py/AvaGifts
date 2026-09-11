import type { Metadata } from "next";
import { Inter, Jost } from "next/font/google";
import { CatalogProvider } from "@/components/catalog/catalog-context";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Piku } from "@/components/piku";
import { PikuConciergeProvider, PikuModal } from "@/components/piku-concierge";
import { PikuGameProvider } from "@/components/piku-game/piku-game-context";
import { MotionDefaults } from "@/components/ui/reveal";
import "./globals.css";

/*
 * Jost is the primary CONTENT face in the Figma design — section labels,
 * headlines and body copy are all Jost. Inter is used only for UI controls
 * (the button label is Inter Semi Bold 14). That split is reflected in the
 * theme tokens in globals.css: --font-sans/--font-display -> Jost,
 * --font-ui -> Inter.
 */
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const display = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jost",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "AvadheshCo — Corporate gifting, curated",
    template: "%s — AvadheshCo",
  },
  description:
    "AvadheshCo curates, customises and delivers premium gifts from India’s finest makers — for teams, clients and the moments that matter.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
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
