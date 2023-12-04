import type { RequestInit } from 'node-fetch';
import fetch from 'node-fetch';
import { mergeDeepLeft } from 'ramda';
import * as Env from './env';
function scheme(): 'http' | 'https' {
  return Env.get('HOST_ENV') === 'dev' ? 'http' : 'https';
}

async function agent() {
  const { Agent } = await import(scheme());

  return new Agent({ keepAlive: true, keepAliveMsecs: 5 * 60 * 1000 });
}

export const DEFAULT_HTTP_CLIENT_OPTIONS = {
  headers: {
    Accept: 'application/json',
    // 'Content-Type': 'application/json',
  },
  agent: await agent(),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, mergeDeepLeft(options, DEFAULT_HTTP_CLIENT_OPTIONS) as RequestInit);
  if (!response.ok) {
    throw new Error(await response.text(), { cause: response });
  }

  return response.json() as Promise<T>;
}

export async function get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(`${scheme()}://${endpoint}`, { ...options, method: 'GET' });
}

export async function post<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(`${scheme()}://${endpoint}`, { ...options, method: 'POST' });
}
