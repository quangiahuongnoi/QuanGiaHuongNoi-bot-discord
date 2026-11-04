import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialQueue,
  addTrackToQueue,
  getNextTrackIndex,
  getPreviousTrackIndex,
  formatDuration,
  Track
} from './musicQueue';

const mockTrack1: Track = {
  id: 't1',
  title: 'Lofi Chill Beats',
  artist: 'ChilledCow',
  durationSeconds: 154,
  url: 'https://youtube.com/watch?v=1',
  thumbnailUrl: '',
  requestedBy: 'User1'
};

const mockTrack2: Track = {
  id: 't2',
  title: 'Synthwave Night Ride',
  artist: 'Kavinsky',
  durationSeconds: 215,
  url: 'https://youtube.com/watch?v=2',
  thumbnailUrl: '',
  requestedBy: 'User2'
};

test('formatDuration converts seconds to mm:ss', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(215), '3:35');
});

test('addTrackToQueue updates queue and sets track', () => {
  let queue = createInitialQueue();
  assert.equal(queue.tracks.length, 0);
  assert.equal(queue.isPlaying, false);

  queue = addTrackToQueue(queue, mockTrack1);
  assert.equal(queue.tracks.length, 1);
  assert.equal(queue.isPlaying, true);
  assert.equal(queue.currentTrackIndex, 0);

  queue = addTrackToQueue(queue, mockTrack2);
  assert.equal(queue.tracks.length, 2);
  assert.equal(queue.currentTrackIndex, 0);
});

test('getNextTrackIndex handles loop modes correctly', () => {
  // Loop OFF
  assert.equal(getNextTrackIndex(0, 2, 'OFF'), 1);
  assert.equal(getNextTrackIndex(1, 2, 'OFF'), -1);

  // Loop TRACK
  assert.equal(getNextTrackIndex(1, 2, 'TRACK'), 1);

  // Loop QUEUE
  assert.equal(getNextTrackIndex(1, 2, 'QUEUE'), 0);
});

test('getPreviousTrackIndex steps back or stays at 0', () => {
  assert.equal(getPreviousTrackIndex(1, 2), 0);
  assert.equal(getPreviousTrackIndex(0, 2), 0);
});
