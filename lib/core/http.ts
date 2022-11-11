import type { RequestInit } from 'node-fetch';
import fetch from 'node-fetch';
import { mergeDeepLeft } from 'ramda';

export const DEFAULT_HTTP_CLIENT_OPTIONS = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'multipart/form-data',
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, mergeDeepLeft(options, DEFAULT_HTTP_CLIENT_OPTIONS));
  if (!response.ok)
    throw new Error('Failed to fetch resource', { cause: response });

  return response.json() as Promise<T>;
}

export async function get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(endpoint, mergeDeepLeft({ method: 'GET' }, options));
}

export async function post<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(endpoint, mergeDeepLeft({ method: 'POST' }, options));
}
