import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is not set. Check your .env file.');
}

const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// if any request comes back 401 (invalid/expired token) it will clear that token and the user will be redirected to the login page
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const headers = error.config?.headers;
    const hadAuthHeader = Boolean(
      headers &&
        (typeof headers.has === "function"
          ? headers.has("Authorization")
          : Object.keys(headers).some((key) => key.toLowerCase() === "authorization"))
    );
    if (error.response?.status === 401 && hadAuthHeader) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;