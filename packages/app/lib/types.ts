export interface InitialAppConfig {
  [key: string]: unknown;
  name: string;
}

export type AppConfig = {
  id: string;
  app_url: string;
  redirect_urls: string[];

  oauth: {
    client_id: string;
    scopes: string[];
  };
} & InitialAppConfig;

export interface RemoteAppConfig {
  id: string;
  name: string;
  app_url: string;
  owner_id: string;
  client_id: string;
  client_secret: string;
  redirect_urls: string[];
  scopes: string[];
}

export interface ExtensionConfig {
  [key: string]: unknown;
  type: string;
  name: string;
}

export interface ExtensionFlavor {
  name: string;
  path?: string;
  value: 'liquid';
}

export interface ExtensionTemplateType {
  url: string;
  type: string;
  flavors: ExtensionFlavor[];
}

export interface ExtensionTemplate {
  identifier: string;
  name: string;
  description: string;
  types: ExtensionTemplateType[];
}

export interface Extension {
  // post boot
  id?: string;
  metadata?: ExtensionMetadata;

  root: string;
  config: ExtensionConfig;
}

export interface WebConfig {
  name?: string;
  commands: {
    dev: string;
    build?: string;
  };
}

export interface Web {
  root: string;
  config: WebConfig;
  framework?: string;
}

export interface App {
  root: string;
  webs: Web[];
  config: AppConfig;
  remote_config?: RemoteAppConfig;
  network_config?: {
    app_url: string;
    app_port: number;
  };
  extensions: Extension[];
}

export interface ExtensionFileDescriptor {
  id: string;
  type: string;
  name: string;
  file_name: string;
  size: number;
  hash: string;
}

export interface ExtensionMetadata {
  [key: string]: ExtensionFileDescriptor[];
}
