const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  health: () => request('/health'),

  /** Get short-lived Anam AI session token for the given persona */
  getAnamSession: (personaId) =>
    request('/api/anam/session', {
      method: 'POST',
      body: JSON.stringify({ persona_id: personaId }),
    }),

  /** Send transcribed speech to backend; get avatar response text */
  chat: (message) =>
    request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  /** Fetch real persona list from the Anam AI account */
  getPersonas: () => request('/api/anam/personas'),

  /** Direct weather fetch (optional, for weather-card display) */
  weather: (city, units = 'metric') =>
    request(`/api/weather?city=${encodeURIComponent(city)}&units=${units}`),
};
