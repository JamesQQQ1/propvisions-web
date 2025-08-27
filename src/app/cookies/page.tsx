// src/app/cookies/page.tsx
"use client";

export default function CookiesPage() {
  return (
    <main className="container section prose prose-slate max-w-3xl">
      <h1 className="heading-2">Cookies</h1>
      <p>We use cookies and similar technologies to operate and improve the Service.</p>

      <h2>Categories</h2>
      <ul>
        <li><strong>Essential</strong> — required for authentication, security, and core features.</li>
        <li><strong>Analytics</strong> — help us understand usage to improve the Service (disabled unless you consent).</li>
      </ul>

      <h2>Managing preferences</h2>
      <p>You can control non-essential cookies via your browser settings and our cookie banner. Clearing cookies may log you out or reset preferences.</p>

      <h2>Example cookies</h2>
      <table className="w-full text-sm border rounded-xl overflow-hidden">
        <thead><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Purpose</th><th className="p-2 text-left">Duration</th></tr></thead>
        <tbody className="divide-y">
          <tr><td className="p-2">pv_session</td><td className="p-2">Essential</td><td className="p-2">Keeps you logged in</td><td className="p-2">Session</td></tr>
          <tr><td className="p-2">pv_cc</td><td className="p-2">Essential</td><td className="p-2">Stores cookie consent</td><td className="p-2">6–12 months</td></tr>
          <tr><td className="p-2">analytics_* (if enabled)</td><td className="p-2">Analytics</td><td className="p-2">Usage insights</td><td className="p-2">Varies</td></tr>
        </tbody>
      </table>

      <p className="small text-slate-500 mt-4">Vendors and cookie names may change as we iterate; we’ll keep this page updated.</p>
    </main>
  );
}
