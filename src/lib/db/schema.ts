import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// === CORE DATA (from map.sql) ===

export const snapshots = sqliteTable('snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fetchedAt: text('fetched_at').notNull(),
  villageCount: integer('village_count'),
  playerCount: integer('player_count'),
  allianceCount: integer('alliance_count'),
});

export const villages = sqliteTable('villages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  snapshotId: integer('snapshot_id').notNull().references(() => snapshots.id),
  mapId: integer('map_id').notNull(),
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  tid: integer('tid'),
  vid: integer('vid'),
  name: text('name'),
  uid: integer('uid'),
  playerName: text('player_name'),
  aid: integer('aid'),
  allianceName: text('alliance_name'),
  population: integer('population'),
  region: text('region'),
  isCapital: integer('is_capital'),
  isCity: integer('is_city'),
  hasHarbor: integer('has_harbor'),
  victoryPoints: integer('victory_points'),
});

export const players = sqliteTable('players', {
  uid: integer('uid').primaryKey(),
  name: text('name').notNull(),
  tid: integer('tid'),
  aid: integer('aid'),
  allianceName: text('alliance_name'),
  totalPop: integer('total_pop').default(0),
  villageCount: integer('village_count').default(0),
  firstSeenAt: text('first_seen_at'),
  lastUpdatedAt: text('last_updated_at'),
});

export const alliances = sqliteTable('alliances', {
  aid: integer('aid').primaryKey(),
  name: text('name').notNull(),
  memberCount: integer('member_count').default(0),
  totalPop: integer('total_pop').default(0),
  firstSeenAt: text('first_seen_at'),
  lastUpdatedAt: text('last_updated_at'),
});

// === AUTH ===

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'leader', 'officer', 'member'] }).default('member').notNull(),
  travianUid: integer('travian_uid'),
  travianVillages: text('travian_villages'), // JSON: [{x,y,name}]
  createdAt: text('created_at'),
  lastLoginAt: text('last_login_at'),
});

// === OPERATIONS (ATTACK) ===

export const operations = sqliteTable('operations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['attack', 'fake_and_real', 'scout'] }).notNull(),
  status: text('status', { enum: ['draft', 'active', 'completed', 'cancelled'] }).default('draft').notNull(),
  landingTime: text('landing_time'),
  description: text('description'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const operationTargets = sqliteTable('operation_targets', {
  id: text('id').primaryKey(),
  operationId: text('operation_id').notNull().references(() => operations.id, { onDelete: 'cascade' }),
  targetX: integer('target_x').notNull(),
  targetY: integer('target_y').notNull(),
  targetVillageName: text('target_village_name'),
  targetPlayerName: text('target_player_name'),
  isReal: integer('is_real').default(0),
  notes: text('notes'),
  sortOrder: integer('sort_order').default(0),
});

export const operationAssignments = sqliteTable('operation_assignments', {
  id: text('id').primaryKey(),
  operationId: text('operation_id').notNull().references(() => operations.id, { onDelete: 'cascade' }),
  targetId: text('target_id').notNull().references(() => operationTargets.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  sourceX: integer('source_x'),
  sourceY: integer('source_y'),
  sourceVillageName: text('source_village_name'),
  unitSpeed: real('unit_speed'),
  waves: integer('waves').default(1),
  sendTime: text('send_time'),
  travelTime: real('travel_time'),
  status: text('status', { enum: ['pending', 'confirmed', 'sent'] }).default('pending').notNull(),
  confirmedAt: text('confirmed_at'),
  notes: text('notes'),
});

// === DEFENSE ===

export const defenseCalls = sqliteTable('defense_calls', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['normal', 'permanent', 'between_waves'] }).notNull(),
  status: text('status', { enum: ['active', 'fulfilled', 'expired', 'cancelled'] }).default('active').notNull(),
  targetX: integer('target_x').notNull(),
  targetY: integer('target_y').notNull(),
  targetVillageName: text('target_village_name'),
  targetPlayerName: text('target_player_name'),
  impactTime: text('impact_time'),
  waveDelay: integer('wave_delay'),
  requestedInfDef: integer('requested_inf_def'),
  requestedCavDef: integer('requested_cav_def'),
  description: text('description'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

export const defenseResponses = sqliteTable('defense_responses', {
  id: text('id').primaryKey(),
  defenseCallId: text('defense_call_id').notNull().references(() => defenseCalls.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id),
  sourceX: integer('source_x'),
  sourceY: integer('source_y'),
  sourceVillageName: text('source_village_name'),
  troops: text('troops'), // JSON: {"Phalanx": 200, "Druidrider": 50}
  infDefValue: integer('inf_def_value'),
  cavDefValue: integer('cav_def_value'),
  sendTime: text('send_time'),
  status: text('status', { enum: ['pledged', 'sent', 'arrived'] }).default('pledged').notNull(),
  createdAt: text('created_at'),
});

// === TROOP REPORTS ===

export const troopReports = sqliteTable('troop_reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  villageX: integer('village_x'),
  villageY: integer('village_y'),
  villageName: text('village_name'),
  troopType: text('troop_type', { enum: ['off', 'def', 'scout', 'siege'] }),
  troops: text('troops'), // JSON: {"Imperian": 5000, "EI": 2000}
  offValue: integer('off_value'),
  defInfValue: integer('def_inf_value'),
  defCavValue: integer('def_cav_value'),
  reportedAt: text('reported_at'),
  notes: text('notes'),
});

// === ADMIN: BUG REPORTS ===

export const bugReports = sqliteTable('bug_reports', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  steps: text('steps'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).default('medium').notNull(),
  status: text('status', { enum: ['new', 'in_progress', 'resolved', 'closed', 'wont_fix'] }).default('new').notNull(),
  page: text('page'),
  reportedBy: text('reported_by').references(() => users.id),
  resolvedBy: text('resolved_by').references(() => users.id),
  adminNotes: text('admin_notes'),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// === ADMIN: SYSTEM LOGS ===

export const systemLogs = sqliteTable('system_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: text('level', { enum: ['info', 'warn', 'error'] }).notNull(),
  category: text('category', { enum: ['auth', 'map_sql', 'operation', 'defense', 'system'] }).notNull(),
  message: text('message').notNull(),
  details: text('details'), // JSON
  userId: text('user_id'),
  createdAt: text('created_at').notNull(),
});
