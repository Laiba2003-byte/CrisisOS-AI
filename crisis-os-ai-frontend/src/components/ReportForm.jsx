import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { sampleReports } from "../data/dashboardData.js";
import { fetchJson } from "../utils/api.js";

function ReportForm({ onIncidentCreated, onResourcesRefresh }) {
  const [rawText, setRawText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const reportText = rawText.trim();

    if (!reportText) {
      setMessage({ type: "error", text: "Report text is required." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const incident = await fetchJson("/incidents", {
        method: "POST",
        body: JSON.stringify({ rawText: reportText })
      });
      onIncidentCreated(incident);
      onResourcesRefresh();
      setRawText("");
      setMessage({
        type: incident.status === "needs_review" ? "warning" : "success",
        text:
          incident.status === "needs_review"
            ? "Saved for manual review."
            : "Incident analyzed and saved."
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#0b1725] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Incoming Report</h2>
          <p className="mt-1 text-sm text-slate-400">Operator intake</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleReports.map((sample, index) => (
            <button
              key={sample}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
              onClick={() => setRawText(sample)}
              type="button"
            >
              Sample {index + 1}
            </button>
          ))}
        </div>
      </div>

      <form className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">Emergency report text</span>
          <textarea
            className="h-28 w-full resize-none rounded-lg border border-white/10 bg-[#07111d] px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-red-400/50 focus:ring-2 focus:ring-red-400/10"
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Caller reports a fire near Mall Road Lahore with people trapped inside the building."
            value={rawText}
          />
        </label>
        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-red-500 px-5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit Report
        </button>
      </form>

      {message ? (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : message.type === "warning"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {message.text}
        </div>
      ) : null}
    </section>
  );
}

export default ReportForm;