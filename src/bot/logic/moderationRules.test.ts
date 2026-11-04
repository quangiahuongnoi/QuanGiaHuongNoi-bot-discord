import test from 'node:test';
import assert from 'node:assert/strict';
import { checkModeration, AutoModConfig } from './moderationRules';

const defaultConfig: AutoModConfig = {
  antiSpamEnabled: true,
  maxDuplicateChars: 5,
  antiInviteEnabled: true,
  antiMassMentionEnabled: true,
  maxMentionsAllowed: 3,
  wordBlacklistEnabled: true,
  blacklistedWords: ['scam', 'hack_token', 'dm_for_nitro']
};

test('checkModeration catches Discord invite links', () => {
  const result = checkModeration('Join my awesome server discord.gg/xyz123 right now', defaultConfig);
  assert.equal(result.hasViolation, true);
  assert.equal(result.violationType, 'INVITE_LINK');
  assert.equal(result.recommendedAction, 'DELETE');
});

test('checkModeration catches blacklisted banned words', () => {
  const result = checkModeration('Hey guys look at this scam free giveaway', defaultConfig);
  assert.equal(result.hasViolation, true);
  assert.equal(result.violationType, 'BLACKLISTED_WORD');
  assert.equal(result.matchedWord, 'scam');
});

test('checkModeration catches mass mentions above threshold', () => {
  const result = checkModeration('Wake up <@123> <@456> <@789> <@999>!', defaultConfig);
  assert.equal(result.hasViolation, true);
  assert.equal(result.violationType, 'MASS_MENTION');
  assert.equal(result.recommendedAction, 'MUTE');
});

test('checkModeration catches character repetition spam', () => {
  const result = checkModeration('HELLLLLLLLLLLLLO EVERYONE', defaultConfig);
  assert.equal(result.hasViolation, true);
  assert.equal(result.violationType, 'SPAM');
  assert.equal(result.recommendedAction, 'DELETE');
});

test('checkModeration passes regular clean messages', () => {
  const result = checkModeration('Chào cả nhà, tối nay ai chơi game không?', defaultConfig);
  assert.equal(result.hasViolation, false);
  assert.equal(result.recommendedAction, 'NONE');
});
