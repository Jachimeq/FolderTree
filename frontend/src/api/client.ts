import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// Optional API key support (matches backend x-api-key)
export function setApiKey(key: string) {
  if (!key) {
    delete api.defaults.headers.common["x-api-key"];
    return;
  }
  api.defaults.headers.common["x-api-key"] = key;
}
