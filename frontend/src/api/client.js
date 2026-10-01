import axios from 'axios';

// Default to whatever host the page itself was loaded from (with the API's port)
// rather than a hardcoded "localhost" - so the same dev server works whether
// it's opened on this machine or from another device on the LAN (e.g. a phone),
// with no env-var juggling required. VITE_API_URL still overrides this for
// production, where frontend and backend are on different domains entirely.
const baseURL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

const TOKEN_KEY = 'ascend:token';

// Auth is carried as a bearer token in localStorage/Authorization header rather
// than a cookie. Frontend and backend sit on different domains in production
// (vercel.app / onrender.com), making every call cross-site - a cross-site
// cookie needs SameSite=None, and Safari/iOS (this app's primary target
// device) blocks exactly that under its cross-site tracking protection,
// regardless of the SameSite setting. A bearer token has none of that baggage.
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const client = axios.create({
  baseURL,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default client;
