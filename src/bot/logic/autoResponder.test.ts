import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchAutoResponse,
  checkTriggerMatch,
  substituteVariables,
  AutoResponseRule
} from './autoResponder';

test('checkTriggerMatch handles exact, contains, starts_with and regex', () => {
  assert.equal(checkTriggerMatch('hello world', 'hello world', 'EXACT'), true);
  assert.equal(checkTriggerMatch('hello world', 'HELLO', 'EXACT'), false);

  assert.equal(checkTriggerMatch('check out this cool bot', 'cool bot', 'CONTAINS'), true);
  assert.equal(checkTriggerMatch('check out this bot', 'cool', 'CONTAINS'), false);

  assert.equal(checkTriggerMatch('!help me please', '!help', 'STARTS_WITH'), true);
  assert.equal(checkTriggerMatch('please !help', '!help', 'STARTS_WITH'), false);

  assert.equal(checkTriggerMatch('discord.gg/invite123', 'discord\\.(gg|io)\\/[a-z0-9]+', 'REGEX'), true);
});

test('substituteVariables replaces templates with context values', () => {
  const result = substituteVariables('Hello {user}, welcome to {server} in {channel}!', {
    authorId: '12345',
    authorName: 'Alex',
    serverName: 'CyberGuild',
    channelId: '999',
    channelName: 'general'
  });

  assert.equal(result, 'Hello Alex, welcome to CyberGuild in #general!');
});

test('matchAutoResponse honors enabled state and channel whitelist', () => {
  const rules: AutoResponseRule[] = [
    {
      id: 'rule-1',
      trigger: 'xin chào',
      matchType: 'CONTAINS',
      response: 'Chào {user}! Chúc bạn ngày mới vui vẻ!',
      enabled: true,
      replyType: 'REPLY',
      channelsWhitelist: ['general-channel']
    },
    {
      id: 'rule-2',
      trigger: 'luật server',
      matchType: 'EXACT',
      response: 'Vui lòng đọc kênh #rules nhé!',
      enabled: false,
      replyType: 'REPLY'
    }
  ];

  // Matched in whitelisted channel
  const res1 = matchAutoResponse('xin chào admin', rules, {
    authorId: '1',
    authorName: 'Hoang',
    serverName: 'Server VN',
    channelId: 'general-channel',
    channelName: 'chung'
  });
  assert.equal(res1.matched, true);
  assert.equal(res1.processedResponse, 'Chào Hoang! Chúc bạn ngày mới vui vẻ!');

  // Whitelist blocked
  const res2 = matchAutoResponse('xin chào admin', rules, {
    authorId: '1',
    authorName: 'Hoang',
    serverName: 'Server VN',
    channelId: 'secret-channel',
    channelName: 'secret'
  });
  assert.equal(res2.matched, false);

  // Disabled rule ignored
  const res3 = matchAutoResponse('luật server', rules, {
    authorId: '1',
    authorName: 'Hoang',
    serverName: 'Server VN',
    channelId: 'general-channel',
    channelName: 'chung'
  });
  assert.equal(res3.matched, false);
});
