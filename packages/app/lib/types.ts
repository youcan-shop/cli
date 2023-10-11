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
