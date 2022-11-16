export interface FileEventOptions {
  path: string
  size: number
  roundtrip: number
  event: string
}

export interface ThemeMetaData {
  id: string
  name: string
  size: number
  version: string
  live: boolean
}

export interface listThemesResponse {
  dev: ThemeMetaData[]
  published: ThemeMetaData[]
}
