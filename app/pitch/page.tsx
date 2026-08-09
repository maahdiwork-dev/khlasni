"use client";

// Pitch deck as part of the product. Arrow keys / click / space to advance.
// Slide 4 ends on the demo cue — switch tab to /dashboard/new.

import { useCallback, useEffect, useState } from "react";

const SLIDES = [0, 1, 2, 3];

export default function Pitch() {
  const [i, setI] = useState(0);

  const next = useCallback(() => setI((v) => Math.min(v + 1, SLIDES.length - 1)), []);
  const prev = useCallback(() => setI((v) => Math.max(v - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div
      className="fixed inset-0 bg-ink text-ivory flex flex-col cursor-pointer select-none"
      onClick={next}
    >
      <div className="flex-1 flex items-center justify-center px-12">
        {/* SLIDE 1 — HOOK */}
        {i === 0 && (
          <div className="max-w-4xl text-center">
            <p className="font-mono-tabular text-sm tracking-[0.25em] text-gold uppercase">
              The Build Room · Gravv&apos;s first North Africa use case
            </p>
            <h1 className="font-display text-7xl mt-8 leading-[1.05] tracking-tight">
              khlas<span className="text-chase">ni</span>
            </h1>
            <p className="font-display text-3xl mt-6 text-ivory/90">
              The agent that gets you paid.
            </p>
            <p className="mt-10 text-muted text-lg">
              Built in one day on Gravv · Claude · Mastra
            </p>
          </div>
        )}

        {/* SLIDE 2 — PROBLEM */}
        {i === 1 && (
          <div className="max-w-5xl w-full">
            <p className="font-mono-tabular text-xs tracking-[0.2em] text-chase uppercase">
              The problem
            </p>
            <h2 className="font-display text-5xl mt-4 leading-tight">
              In Tunisia, doing the work is easy.
              <br />
              <span className="text-chase">Getting paid is the job.</span>
            </h2>
            <div className="mt-14 grid grid-cols-3 gap-10">
              <div>
                <p className="font-display text-6xl text-gold">0</p>
                <p className="mt-3 text-ivory font-medium leading-snug">
                  PayPal payouts to Tunisia
                </p>
                <p className="mt-2 text-muted text-sm">
                  No TND support, no local withdrawal. Structurally locked out.
                </p>
              </div>
              <div>
                <p className="font-display text-6xl text-gold">8.8B</p>
                <p className="mt-3 text-ivory font-medium leading-snug">
                  TND in remittances (2025)
                </p>
                <p className="mt-2 text-muted text-sm">
                  Money already fights its way home — through workarounds.
                </p>
              </div>
              <div>
                <p className="font-display text-6xl text-gold">55–80%</p>
                <p className="mt-3 text-ivory font-medium leading-snug">
                  of e-commerce is cash-on-delivery
                </p>
                <p className="mt-2 text-muted text-sm">
                  Digital collection is broken, so cash wins.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3 — SOLUTION */}
        {i === 2 && (
          <div className="max-w-5xl w-full">
            <p className="font-mono-tabular text-xs tracking-[0.2em] text-chase uppercase">
              The product
            </p>
            <h2 className="font-display text-5xl mt-4 leading-tight">
              The agent <em className="italic">is</em> the collections department.
            </h2>
            <div className="mt-14 grid grid-cols-3 gap-10">
              <div className="border-t border-white/15 pt-5">
                <span className="font-mono-tabular text-chase">01</span>
                <h3 className="font-display text-2xl mt-2">Forward the job</h3>
                <p className="mt-2 text-muted leading-relaxed">
                  Paste the client thread or contract. The agent reads the deal —
                  scope, terms, deadline.
                </p>
              </div>
              <div className="border-t border-white/15 pt-5">
                <span className="font-mono-tabular text-chase">02</span>
                <h3 className="font-display text-2xl mt-2">It invoices &amp; chases</h3>
                <p className="mt-2 text-muted leading-relaxed">
                  Writes the email itself, sends the Gravv payment link, follows up —
                  politely, then firmly.
                </p>
              </div>
              <div className="border-t border-white/15 pt-5">
                <span className="font-mono-tabular text-chase">03</span>
                <h3 className="font-display text-2xl mt-2">It moves the money</h3>
                <p className="mt-2 text-muted leading-relaxed">
                  Detects payment, checks live rates, settles through Gravv&apos;s
                  stablecoin rails. Agentic execution.
                </p>
              </div>
            </div>
            <p className="mt-12 text-lg text-ivory/80 border-l-2 border-chase pl-5">
              Remove the payment rail and there is no product left.
            </p>
          </div>
        )}

        {/* SLIDE 4 — VISION + DEMO CUE */}
        {i === 3 && (
          <div className="max-w-4xl text-center">
            <p className="font-mono-tabular text-xs tracking-[0.2em] text-chase uppercase">
              The wedge and the moat
            </p>
            <h2 className="font-display text-5xl mt-6 leading-tight">
              Every invoice it collects builds the freelancer&apos;s
              <span className="text-gold"> financial record</span>.
            </h2>
            <p className="mt-8 text-xl text-muted leading-relaxed max-w-2xl mx-auto">
              Clients, revenue, follow-ups, cash flow — structured. &ldquo;Who owes me
              money? Can I afford this? My end-of-year bilan.&rdquo; The agent that gets
              you paid becomes the agent that understands your money.
            </p>
            <p className="mt-14 font-display text-3xl text-ivory">
              Let&apos;s watch it get someone paid. <span className="text-chase">Live.</span>
            </p>
          </div>
        )}
      </div>

      <div className="pb-6 flex items-center justify-center gap-2">
        {SLIDES.map((s) => (
          <span
            key={s}
            className={`h-1.5 rounded-full transition-all ${s === i ? "w-8 bg-chase" : "w-1.5 bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
}
