import API_BASE_URL from '../config';

/**
 * Normalizes backend URL strictly from application config.
 * User configuration/overrides are disabled for security.
 */
export function getBackendBaseUrl() {
  return (API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
}

/**
 * Probes the backend actuator health endpoint.
 *
 * Expected UP response:
 * { "status": "UP", "groups": ["liveness", "readiness"] }
 */
export async function checkServerHealth(timeoutMs = 6000) {
  const baseUrl = getBackendBaseUrl();
  const targetUrl = `${baseUrl}/actuator/health`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => null);
      const isUp = String(data?.status || '').toUpperCase() === 'UP';
      return {
        isUp,
        status: data?.status || (isUp ? 'UP' : 'UNKNOWN'),
        data,
        httpStatus: response.status,
      };
    } else {
      return {
        isUp: false,
        status: `HTTP_${response.status}`,
        httpStatus: response.status,
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error.name === 'AbortError';
    return {
      isUp: false,
      status: isTimeout ? 'TIMEOUT' : 'STARTING',
      error: 'Waiting for server to become ready...',
    };
  }
}
