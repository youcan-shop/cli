import { FormData } from 'formdata-node';
import type { RequestInit } from 'node-fetch';
import { mergeDeepLeft } from 'ramda';
import fetch from 'node-fetch';
import type { DeleteThemeFileRequestData, InitThemeRequest as InitThemeRequestData, InitThemeResponse, StoreInfoResponse, ThemeMetaResponse, UpdateThemeFileRequestData } from './types';
import { get, post } from '@/utils/http';
import config from '@/config';
import { delay } from '@/utils/common';

export default class Client {
  private accessToken: string | null = null;

  public constructor() {}

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  public getAccessToken() {
    return this.accessToken;
  }

  public isAuthenticated(): boolean {
    return this.accessToken != null;
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
