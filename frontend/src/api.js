const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');

export function apiUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error('API paths must start with /.');
  }

  return configuredApiBase ? `${configuredApiBase}${path}` : path;
}