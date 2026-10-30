import axios from 'axios';

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const isBrowser = typeof window !== 'undefined';
const defaultBaseURL = isBrowser && window.location.port === '5173' ? '' : 'http://127.0.0.1:8000';

const axiosClient = axios.create({
  baseURL: defaultBaseURL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  },
});

// Ensure CSRF token is attached to mutating requests
axiosClient.interceptors.request.use(async (config) => {
  let csrfToken = getCookie('csrftoken');

  if (!csrfToken && ['post', 'put', 'patch', 'delete'].includes((config.method || '').toLowerCase())) {
    try {
      const res = await axios.get(`${defaultBaseURL}/api/auth/csrf/`, { withCredentials: true });
      csrfToken = res.data?.csrfToken || getCookie('csrftoken');
    } catch {
      // Proceed with available cookie if automatic retrieval fails
    }
  }

  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosClient;
