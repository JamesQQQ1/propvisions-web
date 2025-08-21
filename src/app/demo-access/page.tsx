// src/app/demo-access/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function DemoAccessPage() {
  const sp = useSearchParams()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // default next to /demo, but preserve any ?next=/something passed in the URL
  const next = sp.get('next') || '/demo'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/demo-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send BOTH names; backend will accept either
        body: JSON.stringify({ code: code.trim(), key: code.trim(), next }),
      })

      // Try to read the JSON body either way
      let body: any = {}
      try {
        body = await res.json()
      } catch {
        body = {}
      }

      if (res.ok && body?.ok) {
        // ✅ cookie set by server; now go to the intended page
        window.location.href = typeof body?.next === 'string' ? body.next : next
        return
      }

      // Not ok → show a helpful message from backend
      const msg =
        body?.error === 'invalid_key'
          ? `Invalid code (server sees ${body?.keys_count ?? 0} keys)`
          : body?.error === 'missing_key'
          ? 'Please enter a code'
          : body?.error
          ? `Error: ${body.error}`
          : `Request failed (${res.status})`

      setError(msg)
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container section max-w-md">
      <h1 className="heading-2">Enter demo access code</h1>
      <p className="subhead mt-2">Ask us for a code if you don’t have one yet.</p>

      <form onSubmit={onSubmit} className="card p-5 mt-6 space-y-3">
        <label htmlFor="code" className="small">Access code</label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. abc123"
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="btn btn-primary disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Continue'}
        </button>
        <p className="small text-slate-500">You’ll be redirected to the demo afterwards.</p>
      </form>
    </main>
  )
}
