import Fuse from 'fuse.js'
import type { Model } from './types'

let fuse: Fuse<Model> | null = null
let src: Model[] | null = null

export function filterModels(models: Model[], query: string): Model[] {
  const q = query.trim()
  if (!q) return models
  if (fuse == null || src !== models) {
    src = models
    fuse = new Fuse(models, {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'name_zh', weight: 2 },
        { name: 'aliases', weight: 2 },
        { name: 'vendor', weight: 1 },
        { name: 'vendor_zh', weight: 1 },
        { name: 'id', weight: 1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    })
  }
  return fuse.search(q).map((r) => r.item)
}
