// src/components/CookieBanner.tsx – replace the return with this version that lifts above the footer
"use client";
import { useEffect, useState } from "react";

const KEY = "pv_cc";

export default function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const has = document.cookie.split("; ").some((c) => c.startsWith(`${KEY}=`));
    if (!has) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const footer = document.getElementById("site-footer");
    if (!footer) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) {
          const h = e.target.getBoundingClientRect().height;
          setOffset(h + 16);
        } else {
          setOffset(0);
        }
      },
      { threshold: 0 }
    );

    obs.observe(footer);
    return () => obs.disconnect();
  }, [open]);

  function setConsent(value: "accepted" | "rejected") {
    const oneYear = 365 * 24 * 60 * 60;
    document.cookie = `${KEY}=${value}; Path=/; Max-Age=${oneYear}; SameSite=Lax; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`;
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 z-50" style={{ bottom: offset }}>
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
