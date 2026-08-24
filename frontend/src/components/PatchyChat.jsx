import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:8010";

export default function PatchyChat({ orgId, results }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [cve, setCve] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ambiguous, setAmbiguous] = useState(null); // { productNames: [], question: string }
  const endRef = useRef(null);

  useEffect(() => {
    // keep scroll anchored to bottom when messages change
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // prefill cve with top result if available
  useEffect(() => {
    if (!cve && results && results.length > 0) setCve(results[0].cve_id);
  }, [results]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    setError(null);
    const userMsg = { id: Date.now() + "u", from: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    if (!cve) {
      setMessages((m) => [...m, { id: Date.now() + "e", from: "bot", text: "Please provide a CVE id (or open a vulnerability card) — Patchy currently answers per-vulnerability questions." }]);
      return;
    }

    await askQuestion(text, null);
  }

  async function handleSelectProduct(productName) {
    if (!ambiguous) return;
    setError(null);
    setLoading(true);
    setAmbiguous(null);
    const question = ambiguous.question;
    // show chosen product confirmation
    setMessages((m) => [...m, { id: Date.now() + "u", from: "user", text: `Selected product: ${productName}` }]);

    try {
      const res = await fetch(`${API_BASE}/api/vulnerabilities/${encodeURIComponent(cve)}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, question, product_name: productName }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail?.message || body?.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const botMsg = { id: Date.now() + "b", from: "bot", text: data.answer || "No answer returned." };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setMessages((m) => [...m, { id: Date.now() + "b", from: "bot", text: "Sorry, I couldn't reach the AI backend." }]);
    } finally {
      setLoading(false);
    }
  }

  // Core request logic reused by both manual send and external events
  async function askQuestion(question, productName) {
    if (!cve) {
      setMessages((m) => [...m, { id: Date.now() + "b", from: "bot", text: "Please set a CVE id before asking." }]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/vulnerabilities/${encodeURIComponent(cve)}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, question, product_name: productName }),
      });

      if (res.status === 409) {
        const body = await res.json().catch(() => null);
        const detail = body?.detail || body || {};
        const productNames = detail.product_names || detail.productNames || [];
        setAmbiguous({ productNames, question });
        setMessages((m) => [...m, { id: Date.now() + "b", from: "bot", text: detail.message || "This CVE matches multiple products — please choose the product." }]);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail?.message || body?.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const botMsg = { id: Date.now() + "b", from: "bot", text: data.answer || "No answer returned." };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setMessages((m) => [...m, { id: Date.now() + "b", from: "bot", text: "Sorry, I couldn't reach the AI backend." }]);
    } finally {
      setLoading(false);
    }
  }

  // Listen for external 'patchy:ask' events emitted by per-card Ask widgets
  useEffect(() => {
    function onPatchyAsk(e) {
      const d = e?.detail || {};
      const incomingCve = d.cveId || d.cve || "";
      const incomingProduct = d.productName || d.product_name || null;
      const incomingQuestion = d.question || "";

      if (!incomingQuestion) return;
      setOpen(true);
      if (incomingCve) setCve(incomingCve);
      // reflect user's question in the chat
      setMessages((m) => [...m, { id: Date.now() + "u", from: "user", text: incomingQuestion }]);
      // fire the ask flow
      askQuestion(incomingQuestion, incomingProduct);
    }

    window.addEventListener("patchy:ask", onPatchyAsk);
    return () => window.removeEventListener("patchy:ask", onPatchyAsk);
  }, [cve, orgId]);

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {open ? (
        <div className="w-80 sm:w-[28rem] rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 text-white">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-xl">P</div>
              <div>
                <div className="text-sm font-bold">Patchy</div>
                <div className="text-xs opacity-90">Your vulnerability assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">Close</button>
            </div>
          </div>

          <div className="flex h-[28rem] flex-col bg-white">
            <div className="p-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">CVE</label>
                <input value={cve} onChange={(e)=>setCve(e.target.value)} placeholder="e.g. CVE-2023-1262" className="ml-2 w-full rounded-md border border-slate-200 px-2 py-1 text-sm" />
              </div>

              {ambiguous && (
                <div className="mt-3 rounded-md bg-yellow-50 border border-yellow-200 p-2">
                  <div className="text-sm font-semibold text-yellow-800">This CVE matches multiple products — choose one:</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ambiguous.productNames.map((p) => (
                      <button key={p} onClick={() => handleSelectProduct(p)} className="rounded-full bg-yellow-200 px-3 py-1 text-sm font-medium text-yellow-900">{p}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-slate-500">Hi — ask me about the selected CVE or type a CVE id.</div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`max-w-full ${m.from === "user" ? "ml-auto text-right" : "mr-auto text-left"}`}>
                  <div className={`inline-block rounded-lg px-4 py-2 text-sm ${m.from === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-slate-100 px-4 py-3 bg-white">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Patchy something..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
                />
                <button type="submit" disabled={loading} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  {loading ? "..." : "Send"}
                </button>
              </div>
              {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl flex items-center justify-center text-2xl font-extrabold"
          title="Open Patchy"
          style={{ backgroundColor: '#f5ead9', color: '#452615' }}
        >
          P
        </button>
      )}
    </div>
  );
}
