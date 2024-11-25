export interface FileDescriptor {
  id: string
  type: string
  name: string
  file_name: string
  updated: boolean
  deleted: boolean
  size: number
  hash: string
}

export interface Metadata {
  theme_name: string
  theme_author: string
  theme_version: string
  theme_support_url: string
  theme_documentation_url: string
  config: FileDescriptor[]
  layouts: FileDescriptor[]
  sections: FileDescriptor[]
  templates: FileDescriptor[]
  locales: FileDescriptor[]
  snippets: FileDescriptor[]
  assets: FileDescriptor[]
}

export interface Theme {
  root: string
  theme_id: string
  metadata?: Metadata
}

export interface ThemeInfo {
  id: string
  name: string
  size: number
  version: string
  live: boolean
}

export interface Store {
  domain: string
  slug: string
}

export default {}
