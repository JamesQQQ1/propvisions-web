export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function UploadSuccessPage() {
  return (
    <main className="mx-auto max-w-md p-8 min-h-screen flex flex-col justify-center">
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">Thank you for uploading!</h1>
        <p className="text-slate-600 mt-3">
          Your photos have been successfully uploaded. Our AI analysis will now begin.
        </p>

        <p className="text-sm text-slate-500 mt-4 leading-relaxed">
          You’ll receive an email as soon as your property analysis is complete — including
          downloadable PDF reports and a direct link to view your results online.
        </p>

        <p className="text-sm text-slate-500 mt-4">
          You can now safely close this page — we’ll take care of the rest.
        </p>

        <div className="mt-6">
          <a
            href="https://propvisions.com"
            className="inline-block px-4 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
          >
            Return to Homepage
          </a>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center mt-6">
        PropertyScout · Secure upload confirmation
      </p>
    </main>
  );
}
