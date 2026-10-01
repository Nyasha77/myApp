import axios from 'axios';

// Default to whatever host the page itself was loaded from (with the API's port)
// rather than a hardcoded "localhost" - so the same dev server works whether
// it's opened on this machine or from another device on the LAN (e.g. a phone),
// with no env-var juggling required. VITE_API_URL still overrides this for
// production, where frontend and backend are on different domains entirely.
const baseURL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;

const client = axios.create({
  baseURL,
  withCredentials: true,
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
