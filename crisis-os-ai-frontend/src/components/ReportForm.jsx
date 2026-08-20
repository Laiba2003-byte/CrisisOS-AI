import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Radio, Send, Square, Volume2 } from "lucide-react";
import { sampleReports } from "../data/dashboardData.js";
import { fetchJson } from "../utils/api.js";

const hotlineCallAudioSamples = [
  "Hotline 1122 Transcript #401: Emergency on Mall Road Lahore! Commercial plaza on fire, trapped occupants yelling for help.",
  "Hotline 1122 Transcript #402: Severe flash flooding reported in Shahdara near Ravi river! Water entering houses, immediate rescue boat needed.",
  "Hotline 1122 Transcript #403: Serious multi-vehicle collision at Kalma Chowk Model Town! Overturned car, multiple injuries reported."
];

function ReportForm({ onIncidentCreated, onResourcesRefresh }) {
  const [rawText, setRawText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);
  const [message, setMessage] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }

        if (transcript) {
          setRawText((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setMessage({ type: "warning", text: `Voice recording note: ${event.error}` });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setHasSpeechSupport(false);
    }
  }, []);

  function toggleVoiceRecording() {
    if (!hasSpeechSupport || !recognitionRef.current) {
      // Browser fallback for environments without Web Speech API
      const randomSample = hotlineCallAudioSamples[Math.floor(Math.random() * hotlineCallAudioSamples.length)];
      setRawText((prev) => (prev ? `${prev}\n${randomSample}` : randomSample));
      setMessage({ type: "info", text: "Simulated Hotline Audio Transcript loaded into intake form." });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setMessage({ type: "info", text: "Voice recording paused." });
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setMessage({ type: "info", text: "🎙️ Live Hotline Listening active... Speak emergency report." });
      } catch (err) {
        console.error("Failed to start voice recognition:", err);
      }
    }
  }

  function handleLoadAudioSample(sampleText) {
    setRawText(sampleText);
    setMessage({ type: "info", text: "Loaded Hotline Call Audio Transcript." });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const reportText = rawText.trim();

    if (!reportText) {
      setMessage({ type: "error", text: "Report text is required." });
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
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
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">Incoming Incident Report</h2>
            {isListening ? (
              <span className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-300">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                LIVE AUDIO INTAKE
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">Operator intake & hotline speech-to-text transcript</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleVoiceRecording}
            type="button"
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              isListening
                ? "border-red-500/50 bg-red-500/20 text-red-200 shadow-lg shadow-red-500/10"
                : "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
            }`}
          >
            {isListening ? <Square className="h-3.5 w-3.5 fill-red-400 text-red-400" /> : <Mic className="h-3.5 w-3.5 text-sky-400" />}
            {isListening ? "Stop Recording" : "Voice Intake (STT)"}
          </button>

          <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

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

      {/* Hotline Audio Transcripts Toolbar */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Volume2 className="h-3.5 w-3.5 text-amber-400" />
          Hotline Transcripts:
        </span>
        {hotlineCallAudioSamples.map((audioText, idx) => (
          <button
            key={audioText}
            onClick={() => handleLoadAudioSample(audioText)}
            type="button"
            className="rounded border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20"
          >
            Call #{401 + idx} Audio
          </button>
        ))}
      </div>

      <form className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">Emergency report text</span>
          <textarea
            className={`h-28 w-full resize-none rounded-lg border px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 ${
              isListening
                ? "border-red-500/50 bg-red-950/20 ring-2 ring-red-500/20"
                : "border-white/10 bg-[#07111d] focus:border-red-400/50 focus:ring-2 focus:ring-red-400/10"
            }`}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Caller reports a fire near Mall Road Lahore with people trapped inside... (or use Voice Intake)"
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
                : message.type === "info"
                  ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
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