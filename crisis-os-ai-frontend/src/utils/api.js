export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
export const API_KEY = import.meta.env.VITE_API_KEY || "CRISISOS_DEV_KEY_2026";

export async function fetchJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...(options?.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {
      // Keep the HTTP status fallback.
    }

    throw new Error(message);
  }

  return response.json();
}

export function subscribeToEvents(onEvent) {
  try {
    const eventSourceUrl = `${API_BASE_URL.replace(/\/api$/, "")}/api/events`;
    const eventSource = new EventSource(eventSourceUrl);

    const eventTypes = ["connected", "incident_created", "incident_updated", "incident_merged", "resource_updated", "shelter_updated"];

    eventTypes.forEach((type) => {
      eventSource.addEventListener(type, (event) => {
        try {
          const data = JSON.parse(event.data);
          onEvent({ type, data });
        } catch {
          // ignore parsing error
        }
      });
    });

    return () => {
      eventSource.close();
    };
  } catch (error) {
    console.error("SSE stream subscription failed:", error);
    return () => {};
  }
}