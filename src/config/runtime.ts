export type RuntimeChannel = 'production' | 'preview'

interface RuntimeEnv {
  VITE_PANACALC_CHANNEL?: string
}

export function getRuntimeChannel(env?: RuntimeEnv): RuntimeChannel {
  const source = env ?? (import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {}
  return source.VITE_PANACALC_CHANNEL === 'preview' ? 'preview' : 'production'
}
