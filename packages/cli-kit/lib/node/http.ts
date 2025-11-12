import type { RequestInit } from 'node-fetch';
import https from 'node:https';
import process from 'node:process';
import { isJson } from '@/common/string';
import fetch from 'node-fetch';
import { is, mergeDeepLeft } from 'ramda';
import { Env, Session } from '..';

async function agent() {
  if (Env.get('HOST_ENV') === 'dev') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  return new https.Agent({ keepAlive: true, keepAliveMsecs: 5 * 60 * 1000 });
}

async function defaults() {
  const session = await Session.get();

  return {
    agent: await agent(),
    headers: {
      Accept: 'application/json',
      Authorization: session ? `Bearer ${session.access_token}` : undefined,
    },
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (is(String)(options.body) && isJson(options.body)) {
    options = mergeDeepLeft(options, { headers: { 'Content-Type': 'application/json' } });
  }

  const response = await fetch(endpoint, mergeDeepLeft(options, await defaults()) as RequestInit);

  if (!response.ok) {
    throw new Error(await response.text(), { cause: response });
  }

  return response.json() as Promise<T>;
}

export async function get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(`https://${endpoint}`, { ...options, method: 'GET' });
}

export async function post<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(`https://${endpoint}`, { ...options, method: 'POST' });
}
