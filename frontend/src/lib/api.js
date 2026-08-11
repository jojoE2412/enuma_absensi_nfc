const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3001";
const API_URL = `${API_BASE}/api`;

export { API_BASE, API_URL };
