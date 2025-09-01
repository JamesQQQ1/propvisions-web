// src/app/layout.tsx
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import NavSelect from "@/components/NavSelect";

export const metadata = {
  title: "PropVisions — From URL to investor-ready ROI",
  description:
    "Paste a listing URL and get valuation, refurb costs, and full financials. Export polished PDF & Excel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container py-1">
            {/* Mobile header: dropdown (left) + logo (center) + CTA (right) */}
            <div className="flex md:hidden items-center justify-between gap-2">
              <NavSelect />
              <Link href="/" className="flex items-center justify-center">
                <Image
                  src="/propvisions_logo.png"
                  alt="PropVisions logo"
                  width={84}
                  height={22}
                  priority
                />
              </Link>
              <Link
                href="/book-demo"
                className="btn btn-primary px-3 py-1.5 text-sm"
              >
                Book a demo
              </Link>
            </div>

            {/* Desktop header */}
            <div className="hidden md:flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/propvisions_logo.png"
                  alt="PropVisions logo"
                  width={96}
                  height={24}
                  priority
                />
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="hover:text-brand-700">Home</Link>
                <Link href="/how-it-works" className="hover:text-brand-700">How it works</Link>
                <Link href="/metrics" className="hover:text-brand-700">Metrics</Link>
                <Link href="/accuracy" className="hover:text-brand-700">Accuracy</Link>
                <Link href="/roadmap" className="hover:text-brand-700">Roadmap</Link>
                <Link href="/demo-access" className="hover:text-brand-700">Pricing</Link>
                <Link href="/book-demo" className="btn btn-primary px-3 py-1.5">Book a demo</Link>
              </nav>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <CookieBanner />

        <footer id="site-footer" className="border-t">
          <div className="container flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-8 text-sm text-slate-600">
            <div>
              <p>© {new Date().getFullYear()} PropVisions AI Ltd. All rights reserved.</p>
              <p className="mt-1">Registered in England & Wales · Company No. 16676263</p>
              <p className="mt-1">Registered Office: 71–75 Shelton Street, Covent Garden, London WC2H 9JQ</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-700">Terms</Link>
              <Link href="/cookies" className="hover:text-brand-700">Cookies</Link>
              <Link href="/contact" className="hover:text-brand-700">Contact</Link>
              <Link href="/whitepaper-client.pdf" target="_blank" rel="noopener" className="hover:text-brand-700">
                White Paper (PDF)
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
