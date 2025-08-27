// src/components/CookieBanner.tsx
"use client";

import { useEffect, useState } from "react";

const KEY = "pv_cc"; // cookie consent key

export default function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const has = document.cookie.split("; ").some((c) => c.startsWith(`${KEY}=`));
    if (!has) setOpen(true);
  }, []);

  function setConsent(value: "accepted" | "rejected") {
    const oneYear = 365 * 24 * 60 * 60;
    document.cookie = `${KEY}=${value}; Path=/; Max-Age=${oneYear}; SameSite=Lax; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`;
    setOpen(false);
    // TODO: Enable/disable analytics here based on value
  }

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="container">
        <div className="mb-4 rounded-2xl border bg-white shadow-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-slate-700">
            We use cookies to operate and improve PropVisions. Read more in our <a className="link" href="/cookies">Cookies</a> and <a className="link" href="/privacy">Privacy</a> pages.
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => setConsent("rejected")}>Reject non-essential</button>
            <button className="btn btn-primary btn-sm" onClick={() => setConsent("accepted")}>Accept</button>
          </div>
        </div>
      </div>
    </div>
  );
}
