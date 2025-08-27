// src/components/Testimonials.tsx
export default function Testimonials() {
    const quotes = [
      {
        text: "Fast, structured analysis — saves me hours.",
        author: "Beta User, London Investor",
      },
      {
        text: "Clearer refurb costs than my spreadsheet.",
        author: "Sourcing Agent, Midlands",
      },
      {
        text: "Great to see EPC data integrated automatically.",
        author: "Early Pilot User, Manchester",
      },
    ];
  
    return (
      <section className="my-12">
        <h2 className="text-2xl font-bold mb-4">Early Beta Feedback</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <blockquote
              key={i}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <p className="italic text-slate-700">“{q.text}”</p>
              <footer className="mt-2 text-sm text-slate-500">— {q.author}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    );
  }
  