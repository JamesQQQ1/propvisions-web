import Image from "next/image";

const sources = [
  { src: "public/EPC.jpg",     alt: "EPC Register", note: "EPC Register" },
  { src: "public/ONS.png",     alt: "ONS HPI",      note: "ONS HPI" },
  { src: "public/savills.png", alt: "Savills",      note: "Auction Feeds (Upcoming)", dim: true },
];

export default function Credibility() {
  return (
    <section className="section">
      <div className="container text-center">
        <h2 className="heading-2">Data Sources &amp; Integrations</h2>
        <p className="small mt-1 text-slate-600">
          PropVisions uses official and trusted data sources.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {sources.map((s) => (
            <div
              key={s.alt}
              className={`card p-6 flex flex-col items-center justify-center ${s.dim ? "opacity-60" : ""}`}
            >
              <div className="grayscale hover:grayscale-0 transition">
                <Image
                  src={s.src}
                  alt={s.alt}
                  width={96}
                  height={48}
                  className="h-10 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-slate-500 mt-3">{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
