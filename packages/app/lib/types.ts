import type { PathLike } from 'fs';
import type { Cli } from '@youcan/cli-kit';

export interface InitialAppConfig {
  [key: string]: unknown
  name: string
}

export interface ExtensionWorkerConstructor<T extends Extension = Extension> {
  new(command: Cli.Command, app: App, extension: T): ExtensionWorker
}

export interface ExtensionWorker {
  run(): Promise<void>
  boot(): Promise<void>
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
  [key: string]: unknown
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

export interface Extension {
  // post boot
  id?: string
  metadata?: ExtensionMetadata

  root: PathLike
  config: ExtensionConfig
}

export interface App {
  root: string
  config: AppConfig
  extensions: Extension[]
}

export interface ExtensionFileDescriptor {
  id: string
  type: string
  name: string
  file_name: string
  size: number
  hash: string
}

export interface ExtensionMetadata {

  [key: string]: ExtensionFileDescriptor[]
}
