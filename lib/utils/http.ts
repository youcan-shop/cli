import type { RequestInit } from 'node-fetch';
import fetch from 'node-fetch';
import { mergeDeepLeft } from 'ramda';

export const DEFAULT_HTTP_CLIENT_OPTIONS = {
  headers: {
    Accept: 'application/json',
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, mergeDeepLeft(options, DEFAULT_HTTP_CLIENT_OPTIONS));
  if (!response.ok)
    throw new Error(await response.text(), { cause: response });

  return response.json() as Promise<T>;
}

export async function get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'GET' });
}

export async function post<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(endpoint, { ...options, method: 'POST' });
}
