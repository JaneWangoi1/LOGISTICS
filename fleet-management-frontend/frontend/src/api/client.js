import axios from 'axios';

// One shared axios instance for the whole app. Every module we build from
// Phase 3 onward (trucks, drivers, trips...) imports this instead of
// calling axios directly, so the auth handling below only has to exist once.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Runs before every outgoing request: if we have a token saved, attach it.
// This is what makes protected backend routes usable without remembering
// to add the header manually on every single API call we write later.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Runs on every response. If the backend ever says 401 (token missing,
// invalid, or expired), that means we're no longer really logged in —
// clear what we saved and send the user back to the login screen instead
// of leaving them looking at a broken, half-authenticated page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
