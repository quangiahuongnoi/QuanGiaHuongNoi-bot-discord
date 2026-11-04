import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeRepoName,
  isValidGitHubTokenFormat,
  shouldIncludeFileInGitHubPush
} from './githubPublisher';

describe('githubPublisher logic', () => {
  it('sanitizes repository names cleanly', () => {
    assert.equal(sanitizeRepoName('Aegis Discord Bot 24/7!'), 'aegis-discord-bot-24-7');
    assert.equal(sanitizeRepoName('   '), 'aegis-discord-bot');
    assert.equal(sanitizeRepoName('my_bot.v14'), 'my_bot.v14');
  });

  it('validates GitHub personal access token formats', () => {
    assert.equal(isValidGitHubTokenFormat('ghp_1234567890abcdefghijklmnopqrstuv'), true);
    assert.equal(isValidGitHubTokenFormat('github_pat_11AABBCC_xyz'), true);
    assert.equal(isValidGitHubTokenFormat('invalid_token'), false);
  });

  it('filters out secrets (.env) and build artifacts while keeping source files and .env.example', () => {
    assert.equal(shouldIncludeFileInGitHubPush('src/App.tsx'), true);
    assert.equal(shouldIncludeFileInGitHubPush('server.ts'), true);
    assert.equal(shouldIncludeFileInGitHubPush('.env.example'), true);
    assert.equal(shouldIncludeFileInGitHubPush('.env'), false);
    assert.equal(shouldIncludeFileInGitHubPush('.env.local'), false);
    assert.equal(shouldIncludeFileInGitHubPush('node_modules/discord.js/index.js'), false);
    assert.equal(shouldIncludeFileInGitHubPush('dist/index.html'), false);
    assert.equal(shouldIncludeFileInGitHubPush('dev-dist/sw.js'), false);
  });
});
