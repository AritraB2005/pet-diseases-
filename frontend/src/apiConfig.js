/**
 * API configuration supporting Web and Native Android (Capacitor)
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  
  // 1. Saved custom URL
  const saved = localStorage.getItem('PET_API_URL');
  if (saved) return saved.replace(/\/+$/, '');

  // 2. Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }

  // 3. Native Capacitor environment detection
  const isNative = Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.hostname === 'localhost' && window.location.port === ''
  );

  if (isNative) {
    // 10.0.2.2 is Android emulator loopback alias to host machine localhost:8000
    return 'http://10.0.2.2:8000';
  }

  // 4. Default web environment uses relative path (proxied by Vite)
  return '';
}

export function apiFetch(endpoint, options = {}) {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  return fetch(url, options);
}
