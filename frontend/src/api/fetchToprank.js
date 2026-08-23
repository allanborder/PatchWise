export async function fetchToprank(orgId) {
  const res = await fetch(`http://localhost:8010/api/toprank?org_id=${orgId}`);
  if (!res.ok) throw new Error("Failed to fetch results");
  return res.json();
}

export async function fetchProfiles() {
  const res = await fetch("http://localhost:8010/api/profiles");
  if (!res.ok) throw new Error("Failed to fetch profiles");
  return res.json();
}