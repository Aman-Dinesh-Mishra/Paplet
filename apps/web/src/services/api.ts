import { supabase } from "../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

export const apiFetch = async (
  path: string,
  options: RequestInit = {},
): Promise<Response> => {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${session.access_token}`);

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
};
