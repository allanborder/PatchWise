import { useState, useEffect } from "react";
import ResultsList from "./components/ResultsList";
import NegativeTestPanel from "./components/NegativeTestPanel";
import ProfileSelector from "./components/ProfileSelector";
import ElasticGridBackground from "./components/ElasticGridBackground";
import PlainLanguageToggle from "./components/PlainLanguageToggle";
import { fetchToprank } from "./api/fetchToprank";
import PatchyChat from "./components/PatchyChat";

function App() {
  const [orgId, setOrgId] = useState("ORG-001");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plainMode, setPlainMode] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchToprank(orgId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  return (
    <div className="relative min-h-screen bg-[#452615]">
      <ElasticGridBackground
        spacing={72}
        lineColor="rgba(231, 210, 188, 0.045)"
        diagonalColor="rgba(231, 210, 188, 0)"
        radius={180}
        strength={0.15}
        stiffness={0.04}
        damping={0.9}
      />

      <div className="relative z-10 mx-auto w-full px-6 py-10 sm:px-12 sm:py-14 lg:px-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e7d2bc]/70">
              Patchwise
            </p>
            <h1 className="mt-1 text-4xl font-bold text-[#f5ead9] sm:text-5xl">
              Vulnerability triage
            </h1>
          </div>
        </div>

        <ProfileSelector selectedId={orgId} onChange={setOrgId} />

        {loading && (
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-2xl bg-[#5a3420]/60" />
            <div className="h-40 animate-pulse rounded-2xl bg-[#5a3420]/60" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-300/40 bg-red-950/30 p-4 text-sm text-red-200">
            <p className="font-semibold mb-1">Couldn't reach the backend</p>
            <p>
              Make sure the API server is available. ({error})
            </p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#f5ead9]">Your priority queue</h2>
                <p className="text-base text-[#e7d2bc]/70">
                  {data.results.length} vulnerabilities selected specifically for this profile
                </p>
              </div>
              <PlainLanguageToggle plainMode={plainMode} onToggle={setPlainMode} />
            </div>

            <ResultsList results={data.results} orgId={orgId} plainMode={plainMode} />
            <NegativeTestPanel negativeTest={data.excluded_negative_test} />
          </>
        )}
        {/* Global chatbot - fixed bottom-right */}
        <PatchyChat orgId={orgId} results={data?.results || []} />
      </div>
    </div>
  );
}

export default App;
