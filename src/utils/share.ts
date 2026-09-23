export type ShareResult = 'shared' | 'copied' | 'failed'

export function getPublicChittiUrl(chittiId: string): string {
  return `${window.location.origin}/chitti/${chittiId}`
}

/** Uses the Web Share API where supported, otherwise copies the link to the clipboard. */
export async function shareChitti(chittiId: string, chittiName: string): Promise<ShareResult> {
  const url = getPublicChittiUrl(chittiId)
  const shareData = {
    title: chittiName,
    text: `Track ${chittiName} on Chitti Koottam`,
    url,
  }

  if (navigator.share && navigator.canShare?.(shareData) !== false) {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch {
      // user cancelled or share failed — fall through to clipboard copy
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
