// src/app/privacy/page.tsx
"use client";

export default function PrivacyPage() {
  const UPDATED = "27 August 2025";

  return (
    <main className="container section prose prose-slate max-w-3xl">
      <h1 className="heading-2">Privacy Policy</h1>
      <p className="small text-slate-500">Last updated: {UPDATED}</p>

      <p>
        This Privacy Policy explains how <strong>PropVisions</strong> (“we”, “us”, “our”) collects, uses, and protects
        your information when you use our website and services (the “Service”).
      </p>

      <h2>Who we are</h2>
      <p>
        Data Controller: <strong>PropVisions</strong><br />
        Contact: <a href="mailto:hello@propvisions.com">hello@propvisions.com</a>
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account & contact data:</strong> name, email, company, role, optional phone.</li>
        <li><strong>Property URLs & inputs:</strong> links you provide, scenario settings, and assumptions.</li>
        <li><strong>Generated outputs:</strong> refurb line-items, valuations, financial calculations, PDFs/Excels.</li>
        <li><strong>Usage & device data:</strong> page events, IP address, browser/OS, cookies, diagnostic logs.</li>
        <li><strong>Support messages:</strong> content you submit via forms or email/Discord.</li>
      </ul>

      <h2>How we use your information (lawful bases)</h2>
      <ul>
        <li><strong>Provide the Service</strong> (contract): run analysis from your inputs and generate outputs.</li>
        <li><strong>Improve & secure</strong> (legitimate interests): debugging, analytics, abuse prevention.</li>
        <li><strong>Communications</strong> (consent/legitimate interests): product updates and support.</li>
        <li><strong>Compliance</strong> (legal obligation): record-keeping, fraud prevention.</li>
      </ul>

      <h2>Cookies & analytics</h2>
      <p>
        We use essential cookies for authentication and session state, and analytics cookies to understand usage. You can
        control non-essential cookies via your browser or a cookie banner (where shown).
      </p>

      <h2>Data sharing</h2>
      <ul>
        <li><strong>Vendors:</strong> hosting, email, analytics, error tracking—only what’s necessary to run the Service.</li>
        <li><strong>Legal:</strong> if required by law or to protect rights, property, or safety.</li>
        <li><strong>No sale of personal data.</strong></li>
      </ul>

      <h2>International transfers</h2>
      <p>
        Where data is transferred outside the UK/EEA, we rely on appropriate safeguards (e.g., UK Addendum/EU SCCs).
      </p>

      <h2>Retention</h2>
      <p>
        We keep personal data only as long as needed for the purposes above. You may request deletion of your account
        and associated personal data, subject to legal retention.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>Access, rectification, erasure, restriction, portability, and objection.</li>
        <li>Withdraw consent where processing is based on consent.</li>
        <li>Complain to the ICO (UK) or your local authority.</li>
      </ul>

      <h2>Children</h2>
      <p>Our Service is not directed to children under 16. We do not knowingly collect their data.</p>

      <h2>Third-party links</h2>
      <p>We may link to third-party sites. Their privacy practices are outside our control.</p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy to reflect changes to our practices or legal requirements. We will revise the
        “Last updated” date above and, where appropriate, notify you.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests? Email <a href="mailto:hello@propvisions.com">hello@propvisions.com</a>.
      </p>
    </main>
  );
}
