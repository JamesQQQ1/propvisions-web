// src/app/privacy/page.tsx
"use client";

export default function PrivacyPage() {
  const UPDATED = "27 August 2025";

  return (
    <main className="container section prose prose-slate max-w-3xl">
      <h1 className="heading-2">Privacy Policy</h1>
      <p className="small text-slate-500">Last updated: {UPDATED}</p>

      <p>
        This Privacy Policy describes how <strong>PropVisions</strong> (“<strong>we</strong>”, “<strong>us</strong>”, “<strong>our</strong>”) collects, uses, shares, and safeguards information in connection with our websites, apps, and services (the “<strong>Service</strong>”).
        We act as <strong>data controller</strong> for personal data we determine the purposes and means of processing. Where we process personal data on a customer’s behalf (e.g., through a managed workspace), we act as <strong>data processor</strong>.
      </p>

      <h2 id="contact">Who we are & how to contact us</h2>
      <p>
        Controller: <strong>PropVisions</strong><br />
        Email: <a href="mailto:hello@propvisions.com">hello@propvisions.com</a><br />
        Registered company name/number and address will be added once incorporation completes.
      </p>
      <p className="small text-slate-500">
        We have not appointed a Data Protection Officer (DPO). For privacy questions or to exercise your rights, email <a href="mailto:hello@propvisions.com">hello@propvisions.com</a>.
      </p>

      <h2 id="scope">Scope & definitions</h2>
      <ul>
        <li><strong>Personal data</strong>: any information relating to an identified or identifiable natural person.</li>
        <li><strong>Processing</strong>: any operation performed on personal data, incl. collection, storage, use, disclosure.</li>
        <li><strong>UK GDPR</strong>: the UK General Data Protection Regulation and the Data Protection Act 2018.</li>
      </ul>

      <h2 id="data-we-collect">Data we collect</h2>
      <ul>
        <li><strong>Account & contact data</strong> (you provide): name, email, role, company, optional phone.</li>
        <li><strong>Property inputs</strong> (you provide): URLs, notes, assumptions, scenario toggles.</li>
        <li><strong>Generated outputs</strong>: refurb line-items, valuations, rent bands, financial snapshots, exports (PDF/Excel).</li>
        <li><strong>Usage & device data</strong>: IP address, device identifiers, browser/OS, pages viewed, actions, timestamps, diagnostics and error logs.</li>
        <li><strong>Support content</strong>: messages you send via forms, email, or Discord, including attachments you choose to share.</li>
        <li><strong>Cookies/trackers</strong>: essential cookies for auth/session; optional analytics as described on our <a href="/cookies">Cookies</a> page.</li>
      </ul>

      <h2 id="sources">Sources of personal data</h2>
      <ul>
        <li><strong>Directly from you</strong>: forms, demo inputs, emails, support channels.</li>
        <li><strong>Automatically</strong>: via our Service (logs, telemetry, cookies).</li>
        <li><strong>Third parties</strong>: payment providers, analytics, error tracking, communications tools.</li>
      </ul>

      <h2 id="purposes">Purposes & lawful bases</h2>
      <ul>
        <li><strong>Provide the Service</strong> (Contract): account setup, runs/exports, user support.</li>
        <li><strong>Improve & secure</strong> (Legitimate interests): monitoring, debugging, preventing abuse, QA, product analytics in aggregate.</li>
        <li><strong>Communications</strong> (Legitimate interests/Consent): operational emails, updates; marketing only with consent or soft-opt-in where allowed.</li>
        <li><strong>Compliance</strong> (Legal obligation): record-keeping, law enforcement requests where applicable.</li>
      </ul>

      <h2 id="automated">Automated processing & profiling</h2>
      <p>
        The Service uses AI/ML to propose refurb line-items, rent bands, valuations, and scenario outputs. These are <strong>estimates</strong> intended to assist your workflow; they are not financial advice, nor a RICS valuation. Where we display confidence or ranges, they are indicative only.
      </p>

      <h2 id="sharing">How we share information</h2>
      <ul>
        <li><strong>Service providers (processors)</strong>: hosting, storage, email delivery, analytics, error tracking, logging, payment processing. Access is limited to what is necessary under data processing agreements.</li>
        <li><strong>Legal & safety</strong>: in response to valid legal requests or to protect rights, property, or safety.</li>
        <li><strong>Business transfers</strong>: in a merger, acquisition, or asset sale; your data may transfer subject to this Policy’s protections.</li>
        <li><strong>No sale of personal data</strong>.</li>
      </ul>

      <h2 id="international">International transfers</h2>
      <p>
        Where we transfer personal data outside the UK/EEA, we rely on appropriate safeguards such as the UK IDTA/EU SCCs (and any required addenda). We assess the destination’s laws and implement technical and organizational measures proportionate to risk.
      </p>

      <h2 id="retention">Retention</h2>
      <ul>
        <li><strong>Account data</strong>: for as long as your account is active and for a reasonable period thereafter for records/security (typically up to 24 months) unless longer is legally required.</li>
        <li><strong>Runs/outputs</strong>: for your access and auditability; you can request deletion. Aggregated statistics may be retained.</li>
        <li><strong>Support tickets</strong>: typically up to 24 months from last interaction.</li>
        <li><strong>Logs</strong>: short-lived operational logs (e.g., 30–180 days), longer for security as necessary.</li>
      </ul>

      <h2 id="security">Security</h2>
      <p>
        We employ reasonable and appropriate safeguards such as encryption in transit, least-privilege access, secrets management, backups, and monitoring. No method of transmission or storage is 100% secure; residual risk remains.
      </p>

      <h2 id="your-rights">Your rights</h2>
      <ul>
        <li>Access, rectification, erasure, restriction, portability, and objection under UK GDPR.</li>
        <li>Withdraw consent at any time (where processing relies on consent).</li>
        <li>Lodge a complaint with the UK Information Commissioner’s Office (ICO) or your local authority. See <a href="https://ico.org.uk/" target="_blank" rel="noreferrer">ico.org.uk</a>.</li>
      </ul>
      <p>
        To exercise rights, email <a href="mailto:hello@propvisions.com">hello@propvisions.com</a>. We may need to verify your identity and will respond within applicable statutory timeframes.
      </p>

      <h2 id="children">Children</h2>
      <p>The Service is not directed to children under 16. We do not knowingly collect their personal data.</p>

      <h2 id="third-party-links">Third-party links</h2>
      <p>Our Service may link to third-party sites/services. Their privacy practices are outside our control.</p>

      <h2 id="changes">Changes to this policy</h2>
      <p>We may update this Policy to reflect changes in law or our practices. We will update the “Last updated” date and, where appropriate, notify you.</p>

      <h2 id="contact-2">Contact</h2>
      <p>Questions or requests? Email <a href="mailto:hello@propvisions.com">hello@propvisions.com</a>.</p>

      <hr />
      <p className="small text-slate-500">
        This Privacy Policy is provided for transparency and does not constitute legal advice. Please consult a solicitor for tailored guidance.
      </p>
    </main>
  );
}
