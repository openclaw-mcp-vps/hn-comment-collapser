import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export type UserRecord = {
  id: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: number;
  paidUntil: number | null;
  lastLoginAt: number | null;
};

export type SessionRecord = {
  token: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
};

export type ExtensionTokenRecord = {
  tokenHash: string;
  userId: string;
  deviceId: string;
  createdAt: number;
  lastUsedAt: number;
};

export type PurchaseRecord = {
  id: string;
  email: string;
  source: string;
  providerRef: string;
  paidUntil: number;
  createdAt: number;
};

export type CommentStateRecord = {
  userId: string;
  deviceId: string;
  commentKey: string;
  collapsed: boolean;
  updatedAt: number;
  pageKey: string;
  url: string;
  title: string;
  site: string;
};

export type DatabaseRecord = {
  users: UserRecord[];
  sessions: SessionRecord[];
  extensionTokens: ExtensionTokenRecord[];
  purchases: PurchaseRecord[];
  commentStates: CommentStateRecord[];
};

export type PublicUser = {
  id: string;
  email: string;
  createdAt: number;
  paidUntil: number | null;
};

export type CommentStateUpdateInput = {
  commentKey: string;
  collapsed: boolean;
  updatedAt: number;
  pageKey?: string;
  url?: string;
  title?: string;
  site?: string;
};

export type DashboardStats = {
  totalTracked: number;
  collapsedCount: number;
  syncedSites: number;
  lastSyncAt: number | null;
  bySite: Array<{ site: string; collapsed: number }>;
};

const DEFAULT_DB: DatabaseRecord = {
  users: [],
  sessions: [],
  extensionTokens: [],
  purchases: [],
  commentStates: [],
};

let writeChain: Promise<unknown> = Promise.resolve();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function makePassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const input = scryptSync(password, salt, 64);
  const target = Buffer.from(expectedHash, "hex");
  return input.length === target.length && timingSafeEqual(input, target);
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    paidUntil: user.paidUntil,
  };
}

function isFutureTime(timestamp: number | null) {
  return typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp > Date.now();
}

function applyPurchasesToUser(db: DatabaseRecord, user: UserRecord) {
  const paidFromPurchases = db.purchases
    .filter((purchase) => purchase.email === user.email)
    .reduce<number | null>((max, purchase) => {
      if (max === null || purchase.paidUntil > max) {
        return purchase.paidUntil;
      }
      return max;
    }, user.paidUntil);

  user.paidUntil = paidFromPurchases;
}

async function ensureDbFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DB_FILE, "utf8");
  } catch {
    await writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
  }
}

async function readDb(): Promise<DatabaseRecord> {
  await ensureDbFile();
  const raw = await readFile(DB_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as Partial<DatabaseRecord>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      extensionTokens: Array.isArray(parsed.extensionTokens) ? parsed.extensionTokens : [],
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      commentStates: Array.isArray(parsed.commentStates) ? parsed.commentStates : [],
    };
  } catch {
    return { ...DEFAULT_DB };
  }
}

async function writeDb(db: DatabaseRecord) {
  await writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function mutateDb<T>(mutator: (db: DatabaseRecord) => Promise<T> | T): Promise<T> {
  const run = async () => {
    const db = await readDb();
    const result = await mutator(db);
    await writeDb(db);
    return result;
  };

  const queued = writeChain.then(run, run);
  writeChain = queued.then(
    () => undefined,
    () => undefined,
  );

  return queued;
}

async function queryDb<T>(reader: (db: DatabaseRecord) => Promise<T> | T): Promise<T> {
  const db = await readDb();
  return reader(db);
}

function pruneExpiredSessions(db: DatabaseRecord) {
  const now = Date.now();
  db.sessions = db.sessions.filter((session) => session.expiresAt > now);
}

export function isUserPaid(user: PublicUser | UserRecord) {
  return isFutureTime(user.paidUntil);
}

export async function registerUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();

  if (!normalizedEmail.includes("@")) {
    return { error: "Please use a valid email address." } as const;
  }

  if (trimmedPassword.length < 8) {
    return { error: "Password must be at least 8 characters." } as const;
  }

  return mutateDb((db) => {
    const existing = db.users.find((user) => user.email === normalizedEmail);
    if (existing) {
      return { error: "An account with this email already exists." } as const;
    }

    const now = Date.now();
    const { salt, hash } = makePassword(trimmedPassword);
    const user: UserRecord = {
      id: randomUUID(),
      email: normalizedEmail,
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: now,
      paidUntil: null,
      lastLoginAt: now,
    };

    applyPurchasesToUser(db, user);
    db.users.push(user);

    return { user: toPublicUser(user) } as const;
  });
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  return mutateDb((db) => {
    const user = db.users.find((entry) => entry.email === normalizedEmail);
    if (!user) {
      return { error: "Invalid email or password." } as const;
    }

    if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      return { error: "Invalid email or password." } as const;
    }

    user.lastLoginAt = Date.now();
    applyPurchasesToUser(db, user);

    return { user: toPublicUser(user) } as const;
  });
}

export async function createSession(userId: string) {
  const now = Date.now();
  const token = randomBytes(32).toString("hex");
  const session: SessionRecord = {
    token,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };

  await mutateDb((db) => {
    pruneExpiredSessions(db);
    db.sessions.push(session);
    return session;
  });

  return session;
}

export async function getUserBySessionToken(token: string) {
  if (!token) {
    return null;
  }

  return mutateDb((db) => {
    pruneExpiredSessions(db);
    const session = db.sessions.find((entry) => entry.token === token);
    if (!session) {
      return null;
    }

    const user = db.users.find((entry) => entry.id === session.userId);
    if (!user) {
      return null;
    }

    applyPurchasesToUser(db, user);
    return toPublicUser(user);
  });
}

export async function deleteSession(token: string) {
  if (!token) {
    return;
  }

  await mutateDb((db) => {
    db.sessions = db.sessions.filter((session) => session.token !== token);
  });
}

export async function markEmailAsPaid(email: string, providerRef: string, source = "stripe") {
  const normalizedEmail = normalizeEmail(email);
  const now = Date.now();

  return mutateDb((db) => {
    const existingPaidUntil = db.purchases
      .filter((purchase) => purchase.email === normalizedEmail)
      .reduce((max, purchase) => Math.max(max, purchase.paidUntil), 0);

    const base = Math.max(existingPaidUntil, now);
    const paidUntil = base + MONTH_MS;

    const purchase: PurchaseRecord = {
      id: randomUUID(),
      email: normalizedEmail,
      source,
      providerRef,
      paidUntil,
      createdAt: now,
    };

    db.purchases.push(purchase);

    const user = db.users.find((entry) => entry.email === normalizedEmail);
    if (user) {
      user.paidUntil = Math.max(user.paidUntil ?? 0, paidUntil);
    }

    return { paidUntil };
  });
}

export async function refreshUserPaidState(userId: string) {
  return mutateDb((db) => {
    const user = db.users.find((entry) => entry.id === userId);
    if (!user) {
      return null;
    }

    applyPurchasesToUser(db, user);
    return toPublicUser(user);
  });
}

export async function createExtensionToken(userId: string, deviceId: string) {
  const rawToken = randomBytes(32).toString("hex");

  await mutateDb((db) => {
    const now = Date.now();
    const tokenRecord: ExtensionTokenRecord = {
      tokenHash: hashToken(rawToken),
      userId,
      deviceId,
      createdAt: now,
      lastUsedAt: now,
    };

    db.extensionTokens = db.extensionTokens.filter((token) => token.userId !== userId || token.deviceId !== deviceId);
    db.extensionTokens.push(tokenRecord);
  });

  return rawToken;
}

export async function getUserByExtensionToken(token: string) {
  if (!token) {
    return null;
  }

  return mutateDb((db) => {
    const hashed = hashToken(token);
    const tokenRecord = db.extensionTokens.find((entry) => entry.tokenHash === hashed);
    if (!tokenRecord) {
      return null;
    }

    tokenRecord.lastUsedAt = Date.now();

    const user = db.users.find((entry) => entry.id === tokenRecord.userId);
    if (!user) {
      return null;
    }

    applyPurchasesToUser(db, user);

    return {
      user: toPublicUser(user),
      deviceId: tokenRecord.deviceId,
    };
  });
}

export async function syncCommentStates(userId: string, deviceId: string, updates: CommentStateUpdateInput[]) {
  return mutateDb((db) => {
    const now = Date.now();

    for (const update of updates) {
      if (!update.commentKey || typeof update.collapsed !== "boolean") {
        continue;
      }

      const incomingUpdatedAt = Number.isFinite(update.updatedAt) ? update.updatedAt : now;
      const existing = db.commentStates.find((state) => state.userId === userId && state.commentKey === update.commentKey);

      if (existing) {
        if (incomingUpdatedAt >= existing.updatedAt) {
          existing.collapsed = update.collapsed;
          existing.updatedAt = incomingUpdatedAt;
          existing.deviceId = deviceId;
          existing.pageKey = update.pageKey ?? existing.pageKey;
          existing.url = update.url ?? existing.url;
          existing.title = update.title ?? existing.title;
          existing.site = update.site ?? existing.site;
        }
        continue;
      }

      db.commentStates.push({
        userId,
        deviceId,
        commentKey: update.commentKey,
        collapsed: update.collapsed,
        updatedAt: incomingUpdatedAt,
        pageKey: update.pageKey ?? "",
        url: update.url ?? "",
        title: update.title ?? "Untitled thread",
        site: update.site ?? "Unknown",
      });
    }

    const allStates = db.commentStates
      .filter((state) => state.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);

    return allStates;
  });
}

export async function getUserCommentStates(userId: string) {
  return queryDb((db) =>
    db.commentStates
      .filter((state) => state.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );
}

export async function getUserCollapsedStates(userId: string) {
  return queryDb((db) =>
    db.commentStates
      .filter((state) => state.userId === userId && state.collapsed)
      .sort((a, b) => b.updatedAt - a.updatedAt),
  );
}

export async function setUserCommentState(userId: string, commentKey: string, collapsed: boolean) {
  return mutateDb((db) => {
    const now = Date.now();
    const existing = db.commentStates.find((state) => state.userId === userId && state.commentKey === commentKey);

    if (existing) {
      existing.collapsed = collapsed;
      existing.updatedAt = now;
      existing.deviceId = "dashboard";
      return existing;
    }

    const next: CommentStateRecord = {
      userId,
      deviceId: "dashboard",
      commentKey,
      collapsed,
      updatedAt: now,
      pageKey: "manual",
      url: "",
      title: "Manual override",
      site: "Dashboard",
    };

    db.commentStates.push(next);
    return next;
  });
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  return queryDb((db) => {
    const records = db.commentStates.filter((state) => state.userId === userId);
    const collapsed = records.filter((state) => state.collapsed);

    const bySiteMap = new Map<string, number>();
    for (const record of collapsed) {
      const key = record.site || "Unknown";
      bySiteMap.set(key, (bySiteMap.get(key) ?? 0) + 1);
    }

    const bySite = Array.from(bySiteMap.entries())
      .map(([site, count]) => ({ site, collapsed: count }))
      .sort((a, b) => b.collapsed - a.collapsed);

    const lastSyncAt = records.length > 0 ? Math.max(...records.map((record) => record.updatedAt)) : null;

    return {
      totalTracked: records.length,
      collapsedCount: collapsed.length,
      syncedSites: bySite.length,
      lastSyncAt,
      bySite,
    };
  });
}
