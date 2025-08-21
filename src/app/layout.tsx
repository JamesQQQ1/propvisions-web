// src/app/layout.tsx
export const metadata = {
  title: "PropertyScout — From URL to investor-ready ROI",
  description:
    "Paste a listing URL and get valuation, refurb costs, and full financials. Export polished PDF & Excel.",
}

import Link from "next/link"
import "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container flex items-center justify-between py-3">
            <Link href="/" className="font-semibold tracking-tight">PropertyScout</Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="hover:text-brand-700">Home</Link>
              <Link href="/demo-access" className="hover:text-brand-700">Demo</Link>
              <Link href="/contact" className="hover:text-brand-700">Contact</Link>
              <Link href="/demo-access" className="btn btn-primary">Give it a try</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t">
          <div className="container flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-slate-600">
            <p>© {new Date().getFullYear()} PropertyScout. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-700">Terms</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
