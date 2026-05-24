export interface Parcel {
  id: string
  kadnum: string
  address: string
  region: string
  area: string
  purpose: string
  ownership: string
  coords: string
  center: [number, number]
  polygon: [number, number][]
}

export interface MapLayers {
  cadastr: boolean
  satellite: boolean
  ortho: boolean
  soil: boolean
  otg: boolean
  reserve: boolean
}

export const LAYER_KEYS = ['cadastr', 'satellite', 'ortho', 'soil', 'otg', 'reserve'] as const
export type LayerKey = typeof LAYER_KEYS[number]
