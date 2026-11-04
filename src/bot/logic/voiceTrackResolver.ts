export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  const embedMatch = trimmed.match(/youtube\.com\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

export function cleanYouTubeTitleForAudioSearch(rawTitle: string, authorName?: string): string {
  let cleaned = rawTitle
    // Remove bracketed/parenthesized tags like [Official MV], (Official Music Video), (Lyrics), etc.
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*(?:official|music|video|mv|audio|lyric|lyrics|visualizer|prod|live|hd|4k|ost|remix)[^)]*\)/gi, ' ')
    // Remove pipe sections like "| OFFICIAL MUSIC VIDEO"
    .replace(/\|.*$/g, ' ')
    // Remove common suffixes
    .replace(/\b(?:official\s+music\s+video|official\s+video|official\s+audio|official\s+mv|music\s+video|lyrics?\s+video|visualizer|m\/v|mv|full\s+hd|4k)\b/gi, ' ')
    // Remove hashtags
    .replace(/#[^\s]+/g, ' ')
    // Replace dashes/separators with spaces
    .replace(/[-–—_:/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned && authorName) {
    return authorName.trim();
  }
  return cleaned || rawTitle.trim();
}
