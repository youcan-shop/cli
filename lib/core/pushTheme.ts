import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import type { InitThemeResponse } from './types';
import { getUserToken } from '@/utils/common';
import config from '@/config';
import zipFolder from '@/utils/system/zipFolder';
import deleteFile from '@/utils/system/deleteFile';

/**
 * Publish the initialized theme and return theme Id
 * @param themeFolderName string
 * @returns Id string
 */
export default async function pushTheme(themeFolderName: string): Promise<string> {
  const userToken = await getUserToken();
  const zippedTheme = await zipFolder('./', themeFolderName);
  const themeFolderRs = await fileFromPath(zippedTheme);
  const { themeAuthor, themeVersion, themeSupportUrl, themeDocumentationUrl } = config.starterTheme;

  const formData = new FormData();
  formData.append('archive', themeFolderRs);
  formData.append('theme_name', themeFolderName);
  formData.append('theme_author', themeAuthor);
  formData.append('theme_version', themeVersion);
  formData.append('theme_support_url', themeSupportUrl);
  formData.append('theme_documentation_url', themeDocumentationUrl);

  const response = await fetch('https://api.youcan.shop/themes/init', {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
  });
  const { id } = await response.json() as InitThemeResponse;

  deleteFile(zippedTheme);
  return id;
}

