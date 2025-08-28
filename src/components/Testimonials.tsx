export default function Testimonials() {
    const quotes = [
      { text: "Fast, structured analysis — saves me hours.", author: "Beta User, London Investor" },
      { text: "Clearer refurb costs than my spreadsheet.",  author: "Sourcing Agent, Midlands" },
      { text: "Great to see EPC data integrated automatically.", author: "Early Pilot User, Manchester" },
    ];
  
    return (
      <section className="section">
        <div className="container">
          <h2 className="heading-2">Early Beta Feedback</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
            {quotes.map((q, i) => (
              <blockquote key={i} className="card p-6">
                <p className="italic text-slate-700">“{q.text}”</p>
                <footer className="mt-2 text-sm text-slate-500">— {q.author}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
    );
  }
  