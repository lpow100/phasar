/**
 * Utility to manage backend URLs for HTTP and WebSockets
 */

// Prefix based on your build tool (Vite vs CRA)
const BASE_URL = import.meta.env.MY_IP || 'http://localhost:3000';

/**
 * Returns the full HTTP URL for API requests
 * Usage: getHttpUrl('/users') -> 'http://192.168.1.15:5000/users'
 */
export const getHttpUrl = (endpoint: string = ''): string => {
  // Ensure we don't end up with double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BASE_URL}${cleanEndpoint === '/' ? '' : cleanEndpoint}`;
};

/**
 * Returns the WebSocket URL based on the API URL
 * Usage: getWsUrl() -> 'ws://192.168.1.15:5000'
 */
export const getWsUrl = (): string => {
  // Automatically transforms http://... to ws://... or https://... to wss://...
  return BASE_URL.replace(/^http/, 'ws');
};