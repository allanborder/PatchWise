const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function fetchToprank(orgId) {
  const res = await fetch(`${API_BASE_URL}/api/toprank?org_id=${orgId}`);
  if (!res.ok) throw new Error("Failed to fetch results");
  return res.json();
}

export async function fetchProfiles() {
  const res = await fetch(`${API_BASE_URL}/api/profiles`);
  if (!res.ok) throw new Error("Failed to fetch profiles");
  return res.json();
}
