import { useState } from "react";
import { CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from "lucide-react";

const checks = [
  {
    id: "responsive",
    label: "Responsive layout",
    description: "The dashboard adapts across desktop and mobile widths."
  },
  {
    id: "alerts",
    label: "Alert workflow",
    description: "Alerts can be opened from the header and sidebar."
  },
  {
    id: "reports",
    label: "Report intake",
    description: "Incoming reports remain available from the Reports view."
  },
  {
    id: "backend",
    label: "Backend connection",
    description: "Live API status is reported by the dashboard shell."
  }
];

function TestView({ apiOnline }) {
  const [completedChecks, setCompletedChecks] = useState([]);

  function toggleCheck(checkId) {
    setCompletedChecks((current) =>
      current.includes(checkId)
        ? current.filter((id) => id !== checkId)
        : [...current, checkId]
    );
  }

  function resetChecks() {
    setCompletedChecks([]);
  }

  const completedCount = completedChecks.length;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-sky-400/20 bg-sky-400/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-sky-200">
              <ClipboardCheck className="h-4 w-4" />
              Isolated test workspace
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">CrisisOS checks</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Use this page to record a quick manual smoke test without changing live incident or resource data.
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-white/10 bg-black/15 px-4 py-3 text-sm text-slate-300">
            <span className="font-semibold text-white">{completedCount}</span> / {checks.length} complete
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-white/10 bg-[#0b1725] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Manual smoke checks</h2>
              <p className="mt-1 text-sm text-slate-400">Mark each workflow after verifying it.</p>
            </div>
            <button
              aria-label="Reset smoke checks"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              onClick={resetChecks}
              title="Reset smoke checks"
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 divide-y divide-white/10 rounded-lg border border-white/10 bg-black/10">
            {checks.map((check) => {
              const isComplete = completedChecks.includes(check.id);

              return (
                <button
                  aria-pressed={isComplete}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-white/[0.04]"
                  key={check.id}
                  onClick={() => toggleCheck(check.id)}
                  type="button"
                >
                  {isComplete ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                  )}
                  <span>
                    <span className="block text-sm font-semibold text-white">{check.label}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-400">{check.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-[#0b1725] p-5">
          <h2 className="text-base font-semibold text-white">Environment snapshot</h2>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-sm">
              <span className="text-slate-400">API status</span>
              <span className={apiOnline ? "text-emerald-300" : "text-amber-300"}>
                {apiOnline ? "Connected" : "Demo data"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-sm">
              <span className="text-slate-400">Test state</span>
              <span className="text-slate-200">Local only</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-400">Checks remaining</span>
              <span className="font-semibold text-white">{checks.length - completedCount}</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default TestView;
