import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLevelFromXP,
  resolveAutoRolesOnJoin,
  resolveEligibleLevelRoles,
  AutoRoleConfig
} from './roleEngine';

test('calculateLevelFromXP calculates progression and percentages', () => {
  const lvl0 = calculateLevelFromXP(0);
  assert.equal(lvl0.level, 0);

  // Level 1 starts at 100 XP
  const lvl1 = calculateLevelFromXP(100);
  assert.equal(lvl1.level, 1);

  // Level 2 starts at 400 XP. At 250 XP, progress is half-way
  const midLvl1 = calculateLevelFromXP(250);
  assert.equal(midLvl1.level, 1);
  assert.equal(midLvl1.progressPercent, 50);
});

test('resolveAutoRolesOnJoin distinguishes users and bots', () => {
  const config: AutoRoleConfig = {
    joinRoleEnabled: true,
    userDefaultRoleIds: ['role-member', 'role-verified'],
    botDefaultRoleIds: ['role-bot']
  };

  assert.deepEqual(resolveAutoRolesOnJoin(false, config), ['role-member', 'role-verified']);
  assert.deepEqual(resolveAutoRolesOnJoin(true, config), ['role-bot']);

  const disabledConfig: AutoRoleConfig = { ...config, joinRoleEnabled: false };
  assert.deepEqual(resolveAutoRolesOnJoin(false, disabledConfig), []);
});

test('resolveEligibleLevelRoles selects unlocked roles for current level', () => {
  const rules = [
    { levelRequired: 5, roleId: 'role-bronze', roleName: 'Đồng Đoàn' },
    { levelRequired: 15, roleId: 'role-silver', roleName: 'Bạc Đoàn' },
    { levelRequired: 30, roleId: 'role-gold', roleName: 'Vàng Đoàn' }
  ];

  const unlockedAtLevel16 = resolveEligibleLevelRoles(16, rules);
  assert.equal(unlockedAtLevel16.length, 2);
  assert.equal(unlockedAtLevel16[1].roleName, 'Bạc Đoàn');
});
