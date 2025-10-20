// src/components/NavSelect.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { label: string; href: string };

const PAGES: Option[] = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Book a demo", href: "/book-demo" },
  { label: "Contact", href: "/contact" },
];

export default function NavSelect() {
  const router = useRouter();
  const [val, setVal] = useState<string>("");

  return (
    <div className="relative">
      <label htmlFor="nav-select" className="sr-only">Navigate</label>
      <select
        id="nav-select"
        className="block w-[142px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-600"
        value={val}
        onChange={(e) => {
          const v = e.target.value;
          setVal(v);
          if (v) router.push(v);
        }}
      >
        <option value="">Menu</option>
        {PAGES.map((o) => (
          <option key={o.href} value={o.href}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
