import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  throw new Error('VITE_API_BASE_URL is not set. Check your .env file.');
}

const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export default axiosClient;