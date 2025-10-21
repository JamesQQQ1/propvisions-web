// src/app/contact/page.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

type FormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string }

export default function ContactPage() {
  const [state, setState] = useState<FormState>({ status: 'idle' })
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    topic: 'General',
    message: '',
    consent: false,
    // anti-bot honeypot (must stay empty)
    _hp: '',
  })

  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

  const canSubmit =
    form.name.trim().length > 1 &&
    validEmail(form.email) &&
    form.message.trim().length > 5 &&
    form.consent &&
    state.status !== 'submitting'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setState({ status: 'submitting' })

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'contact_page' }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({} as any))
        throw new Error(body?.error || `Request failed (${res.status})`)
      }

      setState({ status: 'success' })
      // reset form (keep topic default)
      setForm({
        name: '',
        email: '',
        company: '',
        role: '',
        phone: '',
        topic: 'General',
        message: '',
        consent: false,
        _hp: '',
      })
    } catch (err: any) {
      setState({ status: 'error', message: err?.message || 'Something went wrong' })
    }
  }

  return (
    <main className="container section">
      {/* Header */}
      <header className="max-w-3xl">
        <span className="badge">We usually reply within one business day</span>
        <h1 className="heading-2 mt-3">Contact PropVisions</h1>
        <p className="subhead mt-2">
          Questions about features, pricing, integrations, or partnerships? Reach out at{" "}
          <a href="mailto:hello@propvisions.com" className="underline">hello@propvisions.com</a>
          {" "}or use the form below.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: contact options */}
        <aside className="lg:col-span-4 space-y-4">
          <article className="card p-5">
            <div className="flex items-start gap-3">
              <div className="icon-wrap"><ChatIcon /></div>
              <div>
                <h3 className="card-title">Product & pricing</h3>
                <p className="card-text">Questions about features, integrations, or plans.</p>
              </div>
            </div>
          </article>
          <article className="card p-5">
            <div className="flex items-start gap-3">
              <div className="icon-wrap"><SupportIcon /></div>
              <div>
                <h3 className="card-title">Technical support</h3>
                <p className="card-text">Issues with runs, exports, or API access.</p>
              </div>
            </div>
          </article>
          <article className="card p-5">
            <div className="flex items-start gap-3">
              <div className="icon-wrap"><HandshakeIcon /></div>
              <div>
                <h3 className="card-title">Partnerships & custom builds</h3>
                <p className="card-text">Enterprise solutions, white-label, data integrations.</p>
              </div>
            </div>
          </article>

          <div className="card p-5">
            <h4 className="font-semibold">Company details</h4>
            <ul className="mt-2 small text-slate-700 space-y-1">
              <li><strong>Hours:</strong> Mon–Fri, 9am–6pm (UK)</li>
              <li><strong>Response time:</strong> under 1 business day</li>
            </ul>
          </div>
        </aside>

        {/* Right: form */}
        <section className="lg:col-span-8">
          {state.status === 'success' ? (
            <div className="card p-6">
              <div className="flex items-center gap-2">
                <SuccessIcon />
                <h3 className="text-xl font-semibold">Thanks — your message is in!</h3>
              </div>
              <p className="small mt-2 text-slate-700">
                We’ll review and get back to you shortly. If it’s urgent, re-submit with “Urgent” in the subject.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="card p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="small">Full name</label>
                  <input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="small">Work email</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="jane@doe.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="company" className="small">Company</label>
                  <input
                    id="company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Acme Estates"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="small">Role</label>
                  <input
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Investor / Agent / Sourcer"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="small">Phone (optional)</label>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+44 7…"
                  />
                </div>
                <div>
                  <label htmlFor="topic" className="small">Topic</label>
                  <select
                    id="topic"
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {['General', 'Product', 'Support', 'Partnerships', 'Press'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="small">Message</label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="mt-1 w-full min-h-[140px] rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about your needs and include any example URLs…"
                  maxLength={2000}
                  required
                />
                <div className="mt-1 small text-slate-500">{form.message.length}/2000</div>
              </div>

              {/* honeypot (must remain empty). Using uncommon name to avoid autofill. */}
              <input
                type="text"
                name="_hp"
                tabIndex={-1}
                autoComplete="off"
                value={form._hp}
                onChange={(e) => setForm({ ...form, _hp: e.target.value })}
                className="hidden"
                aria-hidden
              />

              <label className="flex items-center gap-2 small">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                I agree to be contacted about PropVisions and understand I can opt out at any time.
              </label>

              {state.status === 'error' && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
                  {state.message}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={classNames(
                    'btn btn-primary',
                    !canSubmit && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {state.status === 'submitting' ? 'Sending…' : 'Send message'}
                </button>
                <span className="small text-slate-500">We’ll reply quickly — usually within 1 business day.</span>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

/* ---------------- tiny helpers & icons ---------------- */

function classNames(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function SupportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M6 19a6 6 0 1 1 12 0M12 13v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="8" r="3" />
    </svg>
  )
}
function HandshakeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M4 12l4-4 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function SuccessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
