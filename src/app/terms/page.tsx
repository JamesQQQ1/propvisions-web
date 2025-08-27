// src/app/terms/page.tsx
"use client";

export default function TermsPage() {
  const UPDATED = "27 August 2025";

  return (
    <main className="container section prose prose-slate max-w-3xl">
      <h1 className="heading-2">Terms of Service</h1>
      <p className="small text-slate-500">Last updated: {UPDATED}</p>

      <p>
        These Terms of Service (“Terms”) govern your access to and use of the <strong>PropVisions</strong> website and
        services (the “Service”). By using the Service you agree to these Terms.
      </p>

      <h2>1. Eligibility & account</h2>
      <p>
        You must be at least 18 and able to form a binding contract. You are responsible for account activity and keeping
        credentials secure.
      </p>

      <h2>2. Beta disclaimer</h2>
      <p>
        The Service is in beta. Features may change, be rate-limited, or become unavailable. You understand outputs are
        estimates with uncertainties and must be independently verified before making financial decisions.
      </p>

      <h2>3. Acceptable use</h2>
      <ul>
        <li>No unlawful, infringing, or abusive activity.</li>
        <li>No scraping of restricted sources or circumvention of technical restrictions.</li>
        <li>No reverse engineering or interfering with the Service.</li>
      </ul>

      <h2>4. Inputs & outputs</h2>
      <p>
        You retain rights to your inputs (e.g., property URLs) and generated exports. You grant us a limited license to
        process inputs/outputs to provide and improve the Service, including quality, security, and diagnostics.
      </p>

      <h2>5. Third-party content</h2>
      <p>
        We may interface with third-party sites or data sources. We are not responsible for their availability or accuracy.
      </p>

      <h2>6. Plans, billing & taxes</h2>
      <p>
        Paid plans (when enabled) are billed via our payment provider (e.g., Stripe). Prices are subject to change with
        notice. You are responsible for applicable taxes. Unless required by law, fees are non-refundable once the billing
        period starts.
      </p>

      <h2>7. Privacy</h2>
      <p>
        Our <a href="/privacy">Privacy Policy</a> explains how we process personal data. By using the Service, you agree
        to our data practices.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Service, including software, design, and branding, is our IP or our licensors’. No rights are granted except as
        expressly set out in these Terms.
      </p>

      <h2>9. Feedback</h2>
      <p>
        If you submit feedback or suggestions, you grant us a royalty-free, perpetual license to use it without restriction.
      </p>

      <h2>10. Warranty disclaimer</h2>
      <p>
        The Service is provided “as is” and “as available” without warranties of any kind, express or implied, including
        accuracy, fitness for a particular purpose, and non-infringement.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we will not be liable for any indirect, incidental, special, consequential,
        or punitive damages, or any loss of profits, revenues, data, or goodwill. Our total liability for any claim relating
        to the Service will not exceed the amount you paid to use the Service in the 6 months preceding the event (or £100
        if greater protection is not required by law).
      </p>

      <h2>12. Indemnity</h2>
      <p>
        You agree to indemnify and hold us harmless from claims arising out of your misuse of the Service or violation of
        these Terms.
      </p>

      <h2>13. Suspension & termination</h2>
      <p>
        We may suspend or terminate access if you breach these Terms or use the Service in a way that risks harm. You may
        stop using the Service at any time.
      </p>

      <h2>14. Governing law & disputes</h2>
      <p>
        These Terms are governed by the laws of England and Wales. Courts of England and Wales shall have exclusive jurisdiction,
        except that you may also have rights under local consumer laws.
      </p>

      <h2>15. Changes</h2>
      <p>
        We may update these Terms to reflect changes to the Service or legal requirements. We will post the updated Terms
        with the “Last updated” date above.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions? Email <a href="mailto:hello@propvisions.com">hello@propvisions.com</a>.
      </p>
    </main>
  );
}
