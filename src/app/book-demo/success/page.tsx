// src/app/book-demo/success/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

/* ---------- Links (edit to match your /public files & env) ---------- */
// Put the PDFs in /public/docs/ so they’re served at /docs/...
const WHITEPAPER_PDF = "/whitepaper-main.pdf";
const CLIENT_BRIEF_PDF = "/whitepaper-client.pdf";

// Set in Vercel → Project Settings → Environment Variables (Public):
const DISCORD_URL =
  process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/your-invite-code";

/* ---------- helpers ---------- */
function pick(...vals: (string | null | undefined)[]) {
  return vals.find((v) => typeof v === "string" && v.length > 0) || "";
}

function BookingSuccessInner() {
  const qs = useSearchParams();

  // Calendly standard params (+ your fallbacks)
  const inviteeName = pick(
    qs.get("invitee_full_name"),
    [qs.get("invitee_first_name"), qs.get("invitee_last_name")]
      .filter(Boolean)
      .join(" "),
    qs.get("name"),
    qs.get("invitee_name")
  );

  const inviteeEmail = pick(
    qs.get("invitee_email"),
    qs.get("email"),
    qs.get("inviteeEmail")
  );
  const organizer = pick(qs.get("assigned_to"));
  const eventName = pick(
    qs.get("event_type_name"),
    qs.get("event"),
    "your demo call"
  );
  const startTime = pick(qs.get("event_start_time"), qs.get("start_time"));
  const endTime = pick(qs.get("event_end_time"));
  const timezone = qs.get("timezone") || "";

  const friendlyTime = useMemo(() => {
    if (!startTime) return "";
    try {
      const d = new Date(startTime);
      return d.toLocaleString(undefined, {
        timeZone: timezone || undefined,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [startTime, timezone]);

  // Empty-state guard
  if (!inviteeName && !inviteeEmail && !startTime) {
    return (
      <section className="section">
        <div className="container max-w-3xl text-center">
          <h1 className="heading-2">No booking details found</h1>
          <p className="small mt-2 text-slate-600">
            It looks like you came here directly. Please book a demo to see
            confirmation details.
          </p>
          <Link href="/book-demo" className="btn mt-4">
            Book a demo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container max-w-3xl">
        <div className="mx-auto w-fit mb-4">
          <span className="badge badge-emerald">🎉 Booked</span>
        </div>

        <div className="card p-6">
          <h1 className="heading-2">You're all set!</h1>
          <p className="small mt-2 text-slate-600">
            Thanks{inviteeName ? `, ${inviteeName}` : ""}! Your{" "}
            <strong>{eventName}</strong> is confirmed. We’ve sent a calendar
            invite and a confirmation email
            {inviteeEmail ? ` to ${inviteeEmail}` : ""}.
          </p>

          {(friendlyTime || timezone || organizer) && (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border p-4 bg-slate-50">
                <div className="text-sm text-slate-700">
                  <div className="font-medium">When</div>
                  <div>
                    {friendlyTime || "See your email for the exact time"}
                    {timezone ? ` (${timezone})` : ""}
                  </div>
                </div>
              </div>
              {endTime && (
                <div className="rounded-xl border p-4 bg-slate-50">
                  <div className="text-sm text-slate-700">
                    <div className="font-medium">Ends</div>
                    <div>
                      {new Date(endTime).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              )}
              {organizer && (
                <div className="rounded-xl border p-4 bg-slate-50">
                  <div className="text-sm text-slate-700">
                    <div className="font-medium">Host</div>
                    <div>{organizer}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Primary CTAs with proper links */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full"
            >
              Join the Discord
            </a>

            {/* White paper PDF (served from /public/docs/...) */}
            <a
              href={WHITEPAPER_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline w-full"
            >
              Download White Paper (PDF)
            </a>

            {/* Optional: client-facing brief */}
            <a
              href={CLIENT_BRIEF_PDF}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline w-full"
            >
              Download Client Brief (PDF)
            </a>
          </div>

          {/* Secondary links */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="link">
              Contact Us
            </Link>
            <Link href="/" className="link">
              ← Back to home
            </Link>
            <Link href="/book-demo" className="link">
              Book another time
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-center">Loading booking details…</div>}
    >
      <BookingSuccessInner />
    </Suspense>
  );
}
