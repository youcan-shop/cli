import type { CAC } from 'cac';
import type Client from '@/core/client/client';

export interface CommandOptionDefinition {
  name: string
  description: string
  config?: {
    default?: any
    type?: any[]
  }
}

export interface CommandDefinition {
  name: string
  group: string
  aliases?: string[]
  description: string
  action: ReturnType<any>
  options?: CommandOptionDefinition[]
}

export interface CLI {
  handler: CAC
  client: Client
}
