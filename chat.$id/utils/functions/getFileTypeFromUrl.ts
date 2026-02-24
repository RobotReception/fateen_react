export function getFileTypeFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const ext = pathname.split('.').pop()
    return ext ? ext.toLowerCase() : null
  } catch {
    return null
  }
}
