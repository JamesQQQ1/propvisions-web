// src/app/demo-access/page.tsx
'use client'

import { useState } from 'react'

export default function DemoAccessPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!code.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      // IMPORTANT: body must be { code: "<value>" }
      const res = await fetch('/api/demo-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      // Helpful diagnostics while you’re iterating:
      // (leave these in for now — remove later)
      // eslint-disable-next-line no-console
      console.log('[demo-access] status:', res.status)

      const data = await res.json().catch(() => ({} as any))
      // eslint-disable-next-line no-console
      console.log('[demo-access] body:', data)

      if (res.ok) {
        // Server set the cookie ps_demo=ok; redirect is now safe
        window.location.href = '/demo'
        return
      }

      // Bubble up server-side hint (if any)
      setError(
        data?.error === 'invalid_code'
          ? 'Invalid access code.'
          : data?.error
          ? `Error: ${data.error}`
          : 'Invalid code'
      )
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container section">
      <header className="max-w-xl">
        <span className="badge">Private beta</span>
        <h1 className="heading-2 mt-3">Enter your access code</h1>
        <p className="subhead mt-2">
          Access to the live demo is currently gated. If you don’t have a code,{' '}
          <a className="link" href="/contact">contact us</a>.
        </p>
      </header>

      <form onSubmit={submit} className="card p-6 mt-6 max-w-xl space-y-4">
        <div>
          <label htmlFor="code" className="small">Access code</label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. partner-2025"
            autoComplete="one-time-code"
            autoCapitalize="off"
            spellCheck={false}
            required
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="btn btn-primary disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Unlock demo'}
          </button>

          {/* Optional small debug helper; flip to true if needed */}
          {false && (
            <a
              className="link small"
              href="/api/run/demo-debug"
              target="_blank"
              rel="noreferrer"
              title="See what keys the server currently has"
            >
              Debug keys on server →
            </a>
          )}
        </div>
      </form>
    </main>
  )
}
