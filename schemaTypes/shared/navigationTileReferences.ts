function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function navigationTileReferences(content: unknown, excludedKey?: string): string[] {
  if (!Array.isArray(content)) return []

  return content.flatMap((entry: unknown) => {
    if (!isRecord(entry)) return []
    if (entry._type === 'navigationGroup') {
      return navigationTileReferences(entry.tiles, excludedKey)
    }
    if (
      entry._type === 'navigationTilePage' &&
      (excludedKey === undefined || entry._key !== excludedKey) &&
      isRecord(entry.page) &&
      typeof entry.page._ref === 'string'
    ) {
      return [entry.page._ref]
    }
    return []
  })
}
