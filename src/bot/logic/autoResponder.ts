export type MatchType = 'EXACT' | 'CONTAINS' | 'STARTS_WITH' | 'REGEX';

export interface AutoResponseRule {
  id: string;
  trigger: string;
  matchType: MatchType;
  response: string;
  embed?: {
    title?: string;
    description?: string;
    color?: string;
    footer?: string;
  };
  enabled: boolean;
  replyType: 'REPLY' | 'MENTION' | 'DM';
  channelsWhitelist?: string[];
  channelsBlacklist?: string[];
  cooldownSeconds?: number;
  lastTriggeredAt?: number;
}

export interface MatchContext {
  authorId: string;
  authorName: string;
  serverName: string;
  channelId: string;
  channelName: string;
}

export interface MatchResult {
  matched: boolean;
  rule?: AutoResponseRule;
  processedResponse?: string;
  isOnCooldown?: boolean;
}

export function matchAutoResponse(
  messageContent: string,
  rules: AutoResponseRule[],
  context: MatchContext,
  now: number = Date.now()
): MatchResult {
  const content = messageContent.trim();
  if (!content) return { matched: false };

  for (const rule of rules) {
    if (!rule.enabled) continue;

    // Channel whitelist check
    if (rule.channelsWhitelist && rule.channelsWhitelist.length > 0) {
      if (!rule.channelsWhitelist.includes(context.channelId)) continue;
    }

    // Channel blacklist check
    if (rule.channelsBlacklist && rule.channelsBlacklist.length > 0) {
      if (rule.channelsBlacklist.includes(context.channelId)) continue;
    }

    // Cooldown check
    if (rule.cooldownSeconds && rule.lastTriggeredAt) {
      const elapsed = (now - rule.lastTriggeredAt) / 1000;
      if (elapsed < rule.cooldownSeconds) {
        // Matched trigger but on cooldown
        if (checkTriggerMatch(content, rule.trigger, rule.matchType)) {
          return { matched: true, rule, isOnCooldown: true };
        }
        continue;
      }
    }

    if (checkTriggerMatch(content, rule.trigger, rule.matchType)) {
      const processed = substituteVariables(rule.response, context);
      return {
        matched: true,
        rule,
        processedResponse: processed,
        isOnCooldown: false
      };
    }
  }

  return { matched: false };
}

export function checkTriggerMatch(text: string, trigger: string, type: MatchType): boolean {
  const normalizedText = text.toLowerCase().trim();
  const normalizedTrigger = trigger.toLowerCase().trim();

  switch (type) {
    case 'EXACT':
      return normalizedText === normalizedTrigger;
    case 'CONTAINS':
      return normalizedText.includes(normalizedTrigger);
    case 'STARTS_WITH':
      return normalizedText.startsWith(normalizedTrigger);
    case 'REGEX':
      try {
        const regex = new RegExp(trigger, 'i');
        return regex.test(text);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export function substituteVariables(template: string, ctx: MatchContext): string {
  return template
    .replace(/{user}/g, ctx.authorName)
    .replace(/{user\.mention}/g, `<@${ctx.authorId}>`)
    .replace(/{server}/g, ctx.serverName)
    .replace(/{channel}/g, `#${ctx.channelName}`);
}
