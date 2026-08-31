// Central API base URL — prioritizes VITE_API_URL if set,
// otherwise defaults to live backend in production, or localhost in development
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://prakrithi.onrender.com/api'
    : 'http://127.0.0.1:8000/api'
);

export default API_BASE_URL;
