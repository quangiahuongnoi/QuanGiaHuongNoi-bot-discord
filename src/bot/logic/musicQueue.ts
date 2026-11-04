export interface Track {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  url: string;
  thumbnailUrl: string;
  requestedBy: string;
  genre?: string;
  lyrics?: string[];
}

export type LoopMode = 'OFF' | 'TRACK' | 'QUEUE';

export interface MusicQueueState {
  currentTrackIndex: number;
  tracks: Track[];
  isPlaying: boolean;
  loopMode: LoopMode;
  volume: number; // 0 - 100
  equalizerPreset: 'FLAT' | 'BASS_BOOST' | 'VOCAL' | 'NIGHTCORE' | 'LOFI' | 'ACOUSTIC';
}

export function createInitialQueue(): MusicQueueState {
  return {
    currentTrackIndex: -1,
    tracks: [],
    isPlaying: false,
    loopMode: 'OFF',
    volume: 80,
    equalizerPreset: 'FLAT'
  };
}

export function addTrackToQueue(
  state: MusicQueueState,
  track: Track,
  playImmediately: boolean = false
): MusicQueueState {
  const newTracks = [...state.tracks, track];
  const shouldPlay = playImmediately || state.tracks.length === 0;

  return {
    ...state,
    tracks: newTracks,
    currentTrackIndex: shouldPlay ? (state.currentTrackIndex === -1 ? newTracks.length - 1 : state.currentTrackIndex) : state.currentTrackIndex,
    isPlaying: shouldPlay ? true : state.isPlaying
  };
}

export function getNextTrackIndex(
  currentIndex: number,
  queueLength: number,
  loopMode: LoopMode
): number {
  if (queueLength === 0) return -1;

  if (loopMode === 'TRACK') {
    return currentIndex;
  }

  if (currentIndex + 1 < queueLength) {
    return currentIndex + 1;
  }

  if (loopMode === 'QUEUE') {
    return 0;
  }

  return -1; // Finished queue
}

export function getPreviousTrackIndex(
  currentIndex: number,
  queueLength: number
): number {
  if (queueLength === 0) return -1;
  if (currentIndex > 0) return currentIndex - 1;
  return 0;
}

export function shuffleArray<T>(array: T[], preserveIndex: number = -1): T[] {
  const result = [...array];
  if (result.length <= 1) return result;

  const current = preserveIndex >= 0 ? result[preserveIndex] : null;

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  // Put current track back at position 0 if preserved
  if (current && preserveIndex >= 0) {
    const newIdx = result.indexOf(current);
    if (newIdx !== -1) {
      result.splice(newIdx, 1);
      result.unshift(current);
    }
  }

  return result;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
