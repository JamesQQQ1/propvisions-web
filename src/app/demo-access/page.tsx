'use client';
import { useState } from 'react';

export default function DemoAccessPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/demo-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      window.location.href = '/demo'; // ✅ now safe
    } else {
      setError('Invalid code');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md flex flex-col gap-4 w-80"
      >
        <h1 className="text-xl font-semibold text-center">Enter Access Code</h1>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border rounded px-3 py-2"
          placeholder="Access code"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </main>
  );
}
