const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
/** API base URL from the environment. Empty string means same-origin /api (e.g. a proxy). */
export const API_BASE = raw.replace(/\/$/, "");
