export interface InitialAppConfig {
  [key: string]: unknown
  name: string
}

export type AppConfig = {
  id: string
  url: string

  oauth: {
    client_id: string
    scopes: string[]
  }
} & InitialAppConfig;

export interface ExtensionConfig {
  type: string
  name: string
}

export interface ExtensionFlavor {
  name: string
  path?: string
  value: 'liquid'
}

export interface ExtensionTemplateType {
  url: string
  type: string
  flavors: ExtensionFlavor[]
}

export interface ExtensionTemplate {
  identifier: string
  name: string
  description: string
  types: ExtensionTemplateType[]
}
