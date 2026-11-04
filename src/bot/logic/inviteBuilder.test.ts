import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePermissionsBitfield,
  isValidSnowflake,
  buildDiscordInviteUrl,
  isValidDiscordWebhookUrl
} from './inviteBuilder';

test('calculatePermissionsBitfield returns 8 when ADMINISTRATOR is selected', () => {
  assert.equal(calculatePermissionsBitfield(['ADMINISTRATOR', 'SEND_MESSAGES']), '8');
});

test('calculatePermissionsBitfield sums non-admin bits accurately', () => {
  // SEND_MESSAGES (2048) + MANAGE_MESSAGES (8192) = 10240
  assert.equal(calculatePermissionsBitfield(['SEND_MESSAGES', 'MANAGE_MESSAGES']), '10240');
});

test('isValidSnowflake validates 17-20 digit Discord IDs', () => {
  assert.equal(isValidSnowflake('1192384012345678901'), true);
  assert.equal(isValidSnowflake('12345'), false);
  assert.equal(isValidSnowflake('abc123456789012345'), false);
});

test('buildDiscordInviteUrl produces valid Discord OAuth2 URL', () => {
  const url = buildDiscordInviteUrl('1192384012345678901', ['ADMINISTRATOR']);
  assert.equal(
    url,
    'https://discord.com/api/oauth2/authorize?client_id=1192384012345678901&permissions=8&scope=bot%20applications.commands'
  );
});

test('isValidDiscordWebhookUrl validates real Discord webhook URLs', () => {
  assert.equal(
    isValidDiscordWebhookUrl('https://discord.com/api/webhooks/123456789012345678/abcdef123456_XYZ-99'),
    true
  );
  assert.equal(isValidDiscordWebhookUrl('https://example.com/webhook'), false);
});
