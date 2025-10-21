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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-40 dark:opacity-20" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container section relative z-10">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
              🔐 Private beta
            </span>
            <h1 className="text-4xl font-bold mt-6 text-slate-900 dark:text-slate-100">Enter your access code</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-3">
              Access to the live demo is currently gated. If you don't have a code,{' '}
              <a className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors underline" href="/contact">contact us</a>.
            </p>
          </header>

          <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-[2px] shadow-2xl">
            <form onSubmit={submit} className="rounded-2xl bg-white dark:bg-slate-900 p-8 space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Access code</label>
                <input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="e.g. partner-2025"
                  autoComplete="one-time-code"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-300 font-medium">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="btn btn-primary px-6 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
          </div>
        </div>
      </div>
    </main>
  )
}
