import type { File } from 'formdata-node';

export interface InitThemeRequest {
  archive: File
  theme_name: string
  theme_author: string
  theme_version: string
  theme_support_url: string
  theme_documentation_url: string
}

export interface InitThemeResponse {
  id: string
}
