export interface AutoRoleConfig {
  joinRoleEnabled: boolean;
  userDefaultRoleIds: string[];
  botDefaultRoleIds: string[];
}

export interface LevelRoleRule {
  levelRequired: number;
  roleId: string;
  roleName: string;
}

export function calculateLevelFromXP(xp: number): { level: number; currentLevelXP: number; xpForNextLevel: number; progressPercent: number } {
  if (xp <= 0) {
    return { level: 0, currentLevelXP: 0, xpForNextLevel: 100, progressPercent: 0 };
  }

  // Level curve: Level = floor(0.1 * sqrt(XP)) -> XP = 100 * level^2
  let level = 0;
  while (calculateTotalXPForLevel(level + 1) <= xp) {
    level++;
  }

  const currentLevelBaseXP = calculateTotalXPForLevel(level);
  const nextLevelTotalXP = calculateTotalXPForLevel(level + 1);
  const xpNeeded = nextLevelTotalXP - currentLevelBaseXP;
  const currentProgress = xp - currentLevelBaseXP;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / xpNeeded) * 100)));

  return {
    level,
    currentLevelXP: currentProgress,
    xpForNextLevel: xpNeeded,
    progressPercent
  };
}

export function calculateTotalXPForLevel(level: number): number {
  return 100 * (level * level);
}

export function resolveAutoRolesOnJoin(
  isBot: boolean,
  config: AutoRoleConfig
): string[] {
  if (!config.joinRoleEnabled) return [];
  return isBot ? config.botDefaultRoleIds : config.userDefaultRoleIds;
}

export function resolveEligibleLevelRoles(
  level: number,
  rules: LevelRoleRule[]
): LevelRoleRule[] {
  return rules.filter(r => level >= r.levelRequired);
}
