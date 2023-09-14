import { exit } from 'process';
import { FormData } from 'formdata-node';
import type { RequestInit } from 'node-fetch';
import { mergeDeepLeft } from 'ramda';
import fetch from 'node-fetch';
import type { CreateAppRequest, CreateAppResponse, DeleteThemeFileRequestData, InitThemeRequest as InitThemeRequestData, InitThemeResponse, LoginRequest, LoginResponse, SelectStoreRequest, SelectStoreResponse, StoreInfoResponse, ThemeMetaResponse, UpdateThemeFileRequestData } from './types';
import { get, post } from '@/utils/http';
import config from '@/config';
import { delay } from '@/utils/common';
import type { listStoresResponse } from '@/cli/commands/store/types';

export default class Client {
  private accessToken: string | null = null;

  public constructor() { }

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  public getAccessToken() {
    return this.accessToken;
  }

  public isAuthenticated(): boolean {
    return this.accessToken != null;
  }

  public async auth(data: LoginRequest): Promise<LoginResponse> {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => form.append(key, value));

    return await post<LoginResponse>(
      `${config.SELLER_AREA_API_BASE_URI}/auth/login`,
      this.withDefaults({ body: form }),
    );
  }

  public async listStores(): Promise<listStoresResponse> {
    return await get<listStoresResponse>(`${config.SELLER_AREA_API_BASE_URI}/stores`, this.withDefaults({}));
  }

  public async selectStore(data: SelectStoreRequest): Promise<SelectStoreResponse> {
    return await post<SelectStoreResponse>(
      `${config.SELLER_AREA_API_BASE_URI}/switch-store/${data.id}`,
      this.withDefaults({}),
    );
  }

  public async initTheme(data: InitThemeRequestData) {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => form.append(key, value));

    const { id } = await post<InitThemeResponse>(
      `${config.SELLER_AREA_API_BASE_URI}/themes/init`,
      this.withDefaults({ body: form }),
    );

    return id;
  }

  public async getThemeMeta(themeId: string): Promise<ThemeMetaResponse> {
    return await get(`${config.SELLER_AREA_API_BASE_URI}/themes/${themeId}/metadata`, this.withDefaults({}));
  }

  public async pullTheme(themeId: string) {
    return await fetch(`${config.SELLER_AREA_API_BASE_URI}/themes/${themeId}`, this.withDefaults({}));
  }

  public async listThemes() {
    return await get(`${config.SELLER_AREA_API_BASE_URI}/themes`, this.withDefaults({}));
  }

  public async deleteTheme(themeId: string) {
    return await post(`${config.SELLER_AREA_API_BASE_URI}/themes/${themeId}/delete`, this.withDefaults({}));
  }

  public async updateFile(themeId: string, data: UpdateThemeFileRequestData) {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => form.append(key, value));
    await post(
      `${config.SELLER_AREA_API_BASE_URI}/themes/${themeId}/update`,
      this.withDefaults({ body: form }),
    );
    await delay(100);
  }

  public async deleteFile(themeId: string, data: DeleteThemeFileRequestData) {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => form.append(key, value));

    await post(
      `${config.SELLER_AREA_API_BASE_URI}/themes/${themeId}/update`,
      this.withDefaults({ body: form }),
    );
    await delay(100);
  }

  public async getStoreInfo(): Promise<StoreInfoResponse> {
    return await get<StoreInfoResponse>(`${config.SELLER_AREA_API_BASE_URI}/me`, this.withDefaults());
  }

  public async createApp(data: CreateAppRequest): Promise<CreateAppResponse> {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => form.append(key, value));

    return await post<CreateAppResponse>(
      `${config.SELLER_AREA_API_BASE_URI}/apps/create`,
      this.withDefaults({ body: form }),
    );
  }

  private withDefaults(override: RequestInit = {}): RequestInit {
    return mergeDeepLeft(override, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      hostname: config.SELLER_AREA_API_BASE_URI,
    }) as RequestInit;
  }
}
