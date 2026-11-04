export interface AutoModConfig {
  antiSpamEnabled: boolean;
  maxDuplicateChars: number;
  antiInviteEnabled: boolean;
  antiMassMentionEnabled: boolean;
  maxMentionsAllowed: number;
  wordBlacklistEnabled: boolean;
  blacklistedWords: string[];
  ignoredRoleIds?: string[];
  ignoredChannelIds?: string[];
}

export type ViolationType = 'SPAM' | 'INVITE_LINK' | 'MASS_MENTION' | 'BLACKLISTED_WORD';

export interface ModCheckResult {
  hasViolation: boolean;
  violationType?: ViolationType;
  reason?: string;
  matchedWord?: string;
  recommendedAction: 'NONE' | 'DELETE' | 'WARN' | 'MUTE' | 'KICK';
}

const INVITE_REGEX = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-zA-Z0-9_-]+/i;

export function checkModeration(
  content: string,
  config: AutoModConfig
): ModCheckResult {
  if (!content) return { hasViolation: false, recommendedAction: 'NONE' };

  // 1. Anti-Invite Check
  if (config.antiInviteEnabled && INVITE_REGEX.test(content)) {
    return {
      hasViolation: true,
      violationType: 'INVITE_LINK',
      reason: 'Đăng liên kết mời Discord server khác',
      recommendedAction: 'DELETE'
    };
  }

  // 2. Mass Mention Check
  if (config.antiMassMentionEnabled) {
    const mentionMatches = content.match(/<@!?(\d+)>|@everyone|@here/g) || [];
    if (mentionMatches.length > config.maxMentionsAllowed) {
      return {
        hasViolation: true,
        violationType: 'MASS_MENTION',
        reason: `Spam tag thành viên vượt quá giới hạn cho phép (${mentionMatches.length}/${config.maxMentionsAllowed})`,
        recommendedAction: 'MUTE'
      };
    }
  }

  // 3. Word Blacklist Check
  if (config.wordBlacklistEnabled && config.blacklistedWords && config.blacklistedWords.length > 0) {
    const lowerContent = content.toLowerCase();
    for (const word of config.blacklistedWords) {
      const cleanWord = word.trim().toLowerCase();
      if (!cleanWord) continue;
      // Exact word boundary or contained word check
      if (lowerContent.includes(cleanWord)) {
        return {
          hasViolation: true,
          violationType: 'BLACKLISTED_WORD',
          matchedWord: cleanWord,
          reason: `Tin nhắn chứa từ ngữ cấm trong từ điển máy chủ: "${cleanWord}"`,
          recommendedAction: 'WARN'
        };
      }
    }
  }

  // 4. Repeated character spam
  if (config.antiSpamEnabled && config.maxDuplicateChars > 0) {
    const repeatedCharRegex = new RegExp(`(.)\\1{${config.maxDuplicateChars},}`, 'i');
    if (repeatedCharRegex.test(content)) {
      return {
        hasViolation: true,
        violationType: 'SPAM',
        reason: 'Spam ký tự lặp liên tục quá mức quy định',
        recommendedAction: 'DELETE'
      };
    }
  }

  return {
    hasViolation: false,
    recommendedAction: 'NONE'
  };
}
