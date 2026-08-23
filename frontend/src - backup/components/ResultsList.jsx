import ResultCard from "./ResultCard";

export default function ResultsList({ results }) {
  return (
    <div>
      {results.map((r) => (
        <ResultCard key={r.cve_id} result={r} />
      ))}
    </div>
  );
}