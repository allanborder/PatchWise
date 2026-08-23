import { useEffect, useState } from "react";
import { fetchProfiles } from "../api/fetchToprank";

export default function ProfileSelector({ selectedId, onChange }) {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    fetchProfiles().then(setProfiles).catch(console.error);
  }, []);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-600 mb-2">
        Organisation Profile
      </label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {profiles.map((p) => (
          <option key={p.org_id} value={p.org_id}>
            {p.name} — {p.sector}
          </option>
        ))}
      </select>
    </div>
  );
}