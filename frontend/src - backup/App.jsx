import { useState, useEffect } from "react";
import ResultsList from "./components/ResultsList";
import NegativeTestPanel from "./components/NegativeTestPanel";
import ProfileSelector from "./components/ProfileSelector";
import { fetchToprank } from "./api/fetchToprank";

function App() {
  const [orgId, setOrgId] = useState("ORG-001");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchToprank(orgId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Patchwise</h1>
        <p className="text-slate-500 mb-6">Top 5 things worth your attention right now</p>

        <ProfileSelector selectedId={orgId} onChange={setOrgId} />

        {loading && <p className="text-slate-400">Loading results...</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            <p className="font-semibold mb-1">Couldn't reach the backend</p>
            <p>
              Make sure the API server is running at{" "}
              <code className="bg-red-100 px-1 rounded">localhost:8000</code>.
              <br />
              ({error})
            </p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <ResultsList results={data.results} />
            <NegativeTestPanel negativeTest={data.excluded_negative_test} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;