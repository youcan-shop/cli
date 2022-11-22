import type { File } from 'formdata-node';

export interface InitThemeRequest {
  archive: File
  theme_name: string
  theme_author: string
  theme_version: string
  theme_support_url: string
  theme_documentation_url: string
}

export interface UpdateThemeFileRequestData {
  file_type: string
  file_name: string
  file_content: File
  file_operation: 'save'
}

export interface DeleteThemeFileRequestData {
  file_type: string
  file_name: string
  file_operation: 'delete'
}

export interface InitThemeResponse {
  id: string
}

export interface StoreInfoResponse {
  name: string
  slug: string
  domain: string
}

export interface ThemeFileInfo {
  id: string
  type: string
  name: string
  file_name: string
  updated: boolean
  deleted: boolean
  size: number
  hash: string
}

export interface ThemeMetaResponse {
  theme_name: string
  theme_author: string
  theme_version: string
  theme_support_url: string
  theme_documentation_url: string
  config: ThemeFileInfo[]
  layout: ThemeFileInfo[]
  sections: ThemeFileInfo[]
  templates: ThemeFileInfo[]
  locales: ThemeFileInfo[]
  snippets: ThemeFileInfo[]
  assets: ThemeFileInfo[]
}
