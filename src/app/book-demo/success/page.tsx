"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function BookingSuccessPage() {
  const qs = useSearchParams();

  // Pull common Calendly redirect params
  const inviteeName =
    qs.get("name") || qs.get("invitee_name") || "";
  const inviteeEmail =
    qs.get("email") || qs.get("invitee_email") || "";
  const eventName =
    qs.get("event") || qs.get("event_type_name") || "your demo call";
  const startTime = qs.get("start_time") || ""; // Calendly sends ISO string
  const timezone = qs.get("timezone") || "";

  // Format startTime → nice local display
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

  // Guard: no params? Likely a direct visit → show helpful message
  if (!inviteeName && !inviteeEmail && !startTime) {
    return (
      <section className="section">
        <div className="container max-w-3xl text-center">
          <h1 className="heading-2">No booking details found</h1>
          <p className="small mt-2 text-slate-600">
            It looks like you came here directly. Please book a demo to see confirmation details.
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
        {/* Status pill */}
        <div className="mx-auto w-fit mb-4">
          <span className="badge badge-emerald">🎉 Booked</span>
        </div>

        <div className="card p-6">
          <h1 className="heading-2">You're all set!</h1>
          <p className="small mt-2 text-slate-600">
            Thanks{inviteeName ? `, ${inviteeName}` : ""}! 
            Your <strong>{eventName}</strong> is confirmed. 
            We’ve sent a calendar invite and a confirmation email
            {inviteeEmail ? ` to ${inviteeEmail}` : ""}.
          </p>

          {/* When block */}
          {(friendlyTime || timezone) && (
            <div className="mt-4 rounded-xl border p-4 bg-slate-50">
              <div className="text-sm text-slate-700">
                <div className="font-medium">When</div>
                <div>
                  {friendlyTime || "See your email for the exact time"}
                  {timezone ? ` (${timezone})` : ""}
                </div>
              </div>
            </div>
          )}

          {/* Next steps */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <a
              href="https://discord.gg/your-invite-code"
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full"
            >
              Join the Discord
            </a>
            <Link href="/whitepaper" className="btn btn-outline w-full">
              Read the Whitepaper
            </Link>
            <Link href="/contact" className="btn btn-outline w-full">
              Contact Us
            </Link>
          </div>

          {/* Manage booking */}
          <div className="mt-6 small text-slate-600">
            <p className="mb-2">
              Need to reschedule or cancel? Use the links in your Calendly email —
              they’ll update our system automatically.
            </p>
            <p className="text-slate-500">
              If you don’t see the email, check spam or contact us and we’ll resend.
            </p>
          </div>

          {/* Back links */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="link">← Back to home</Link>
            <Link href="/book-demo" className="link">Book another time</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
