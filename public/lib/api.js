export async function fetchJson(url, options) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    const message = data && data.error ? data.error : `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.detail = data?.detail;
    throw err;
  }
  return data;
}
