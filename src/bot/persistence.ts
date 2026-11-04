import { Pool } from 'pg';

export interface PersistedRuntimeState {
  schemaVersion: number;
  config: unknown;
  socialFeeds: unknown;
  auditLogs: unknown;
  warnings: unknown;
  userXP: unknown;
  analytics: {
    messageHourlyCounts: unknown;
    voiceHourlyMinutes: unknown;
    channelMessageCounts: unknown;
    memberJoinEvents: unknown;
    moderationStats: unknown;
  };
}

let pool: Pool | null = null;
let initialized = false;
let lastError: string | null = null;

export function isPersistenceConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPersistenceStatus() {
  return {
    configured: isPersistenceConfigured(),
    connected: initialized,
    lastError
  };
}

export async function initPersistence(): Promise<boolean> {
  if (!isPersistenceConfigured()) {
    initialized = false;
    return false;
  }

  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: { rejectUnauthorized: false }
    });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_runtime_state (
        id SMALLINT PRIMARY KEY,
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query('SELECT 1');
    initialized = true;
    lastError = null;
    console.log('✅ PostgreSQL persistence connected.');
    return true;
  } catch (error: any) {
    initialized = false;
    lastError = error?.message || 'PostgreSQL connection failed';
    console.warn('[Persistence Notice]:', lastError);
    await pool?.end().catch(() => {});
    pool = null;
    return false;
  }
}

export async function loadPersistedRuntimeState(): Promise<PersistedRuntimeState | null> {
  if (!pool || !initialized) return null;

  try {
    const result = await pool.query(
      'SELECT state FROM app_runtime_state WHERE id = 1 LIMIT 1'
    );
    if (!result.rows[0]?.state) return null;

    const state = result.rows[0].state as PersistedRuntimeState;
    lastError = null;
    return state;
  } catch (error: any) {
    lastError = error?.message || 'Failed to load persisted runtime state';
    console.warn('[Persistence Load Notice]:', lastError);
    return null;
  }
}

export async function savePersistedRuntimeState(state: PersistedRuntimeState): Promise<boolean> {
  if (!pool || !initialized) return false;

  try {
    await pool.query(
      `INSERT INTO app_runtime_state (id, state, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id)
       DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
      [JSON.stringify(state)]
    );
    lastError = null;
    return true;
  } catch (error: any) {
    lastError = error?.message || 'Failed to persist runtime state';
    console.warn('[Persistence Save Notice]:', lastError);
    return false;
  }
}

export async function closePersistence() {
  if (pool) {
    await pool.end().catch(() => {});
  }
  pool = null;
  initialized = false;
}
