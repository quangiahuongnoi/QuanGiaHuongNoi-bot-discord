import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractYouTubeVideoId, cleanYouTubeTitleForAudioSearch } from './voiceTrackResolver';

describe('voiceTrackResolver logic', () => {
  it('extracts YouTube 11-char video ID from youtu.be, watch?v=, and shorts URLs', () => {
    assert.equal(
      extractYouTubeVideoId('https://youtu.be/E1aCYB7126M?si=6q4lMDVRh2UKK5E3'),
      'E1aCYB7126M'
    );
    assert.equal(
      extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=Test'),
      'dQw4w9WgXcQ'
    );
    assert.equal(
      extractYouTubeVideoId('https://youtube.com/shorts/aBcDeFgHiJk?feature=share'),
      'aBcDeFgHiJk'
    );
    assert.equal(extractYouTubeVideoId('Chìm Sâu RPT MCK'), null);
  });

  it('cleans noisy YouTube titles into clean artist + song search queries', () => {
    assert.equal(
      cleanYouTubeTitleForAudioSearch('GILL - NGỰA PHI | OFFICIAL MUSIC VIDEO'),
      'GILL NGỰA PHI'
    );
    assert.equal(
      cleanYouTubeTitleForAudioSearch('Sơn Tùng M-TP - Nơi Này Có Anh (Official Music Video) [4K]'),
      'Sơn Tùng M TP Nơi Này Có Anh'
    );
  });
});
