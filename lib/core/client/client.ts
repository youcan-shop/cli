import { FormData } from 'formdata-node';
import type { RequestInit } from 'node-fetch';
import { mergeDeepLeft } from 'ramda';
import type { DeleteThemeFileRequestData, InitThemeRequest as InitThemeRequestData, InitThemeResponse, UpdateThemeFileRequestData } from './types';
import { get, post } from '@/utils/http';
import config from '@/config';

export default class Client {
  public accessToken: string | null = null;

  public constructor() {}

  public setAccessToken(token: string) {
    this.accessToken = token;
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
  }

  public async deleteFile(themeId: string, data: DeleteThemeFileRequestData) {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => form.append(key, value));

    await post(
      `${config.SELLER_AREA_API_BASE_URI}/themes/${themeId}/update`,
      this.withDefaults({ body: form }),
    );
  }

  private withDefaults(override: RequestInit): RequestInit {
    return mergeDeepLeft(override, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      hostname: config.SELLER_AREA_API_BASE_URI,
    }) as RequestInit;
  }
}
