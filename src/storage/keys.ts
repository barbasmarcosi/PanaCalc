import type { RuntimeChannel } from '../config/runtime'

export const LEGACY_SESSION_KEY = 'panacalc.session.v1'
export const LEGACY_PRESETS_KEY = 'panacalc.presets.v1'

export interface StorageKeys {
  session: string
  presets: string
  preferences: string
}

export function getStorageKeys(channel: RuntimeChannel): StorageKeys {
  return channel === 'preview'
    ? {
        session: 'panacalc.preview.session.v2',
        presets: 'panacalc.preview.presets.v2',
        preferences: 'panacalc.preview.preferences.v2',
      }
    : {
        session: 'panacalc.session.v2',
        presets: 'panacalc.presets.v2',
        preferences: 'panacalc.preferences.v2',
      }
}
