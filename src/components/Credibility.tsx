// src/components/Credibility.tsx
import Image from "next/image";

export default function Credibility() {
  return (
    <section className="my-12 text-center">
      <h2 className="text-2xl font-bold mb-4">Data Sources & Integrations</h2>
      <p className="text-slate-600 mb-6">
        PropVisions uses official and trusted data sources.
      </p>
      <div className="flex justify-center gap-8 flex-wrap">
        <div className="text-center">
          <Image src="/epc.png" alt="EPC Register" width={80} height={40} />
          <p className="text-sm text-slate-500 mt-2">EPC Register</p>
        </div>
        <div className="text-center">
          <Image src="/ons.png" alt="ONS" width={80} height={40} />
          <p className="text-sm text-slate-500 mt-2">ONS HPI</p>
        </div>
        <div className="text-center opacity-60">
          <Image src="/savills.png" alt="Savills" width={80} height={40} />
          <p className="text-sm text-slate-500 mt-2">Auction Feeds (Upcoming)</p>
        </div>
      </div>
    </section>
  );
}
