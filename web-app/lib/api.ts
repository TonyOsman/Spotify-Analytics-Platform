const EDGE_URL = process.env.NEXT_PUBLIC_EDGE_API_URL ?? "http://localhost:3000";

export async function edgeGet(path: string) {
  const response = await fetch(`${EDGE_URL}${path}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? `GET ${path} failed`);
  }
  return data;
}

export async function edgePost(path: string, body?: unknown) {
  const response = await fetch(`${EDGE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? `POST ${path} failed`);
  }
  return data;
}
