const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; 
    return Math.min(times * 100, 3000);
  },
  lazyConnect: true,
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

const TTL = {
  USER_SESSION: 24 * 60 * 60,   
  DASHBOARD: 90,                  
  TASKS: 30,                      
  TEAMS: 60,                      
  NOTIFICATIONS: 30,              
  USERS_LIST: 60,                 
};

const KEYS = {
  userSession: (userId) => `user:session:${userId}`,
  dashboard: (role, userId) => `dashboard:${role}:${userId}`,
  tasks: (role, userId) => `tasks:${role}:${userId}`,
  task: (taskId) => `task:${taskId}`,
  taskComments: (taskId) => `task:${taskId}:comments`,
  teams: (role, userId) => `teams:${role}:${userId}`,
  team: (teamId) => `team:${teamId}`,
  teamMembers: (teamId) => `team:${teamId}:members`,
  usersList: () => `users:list`,
  notificationsUnread: (userId) => `notifications:unread:${userId}`,
  notifications: (userId) => `notifications:${userId}`,
};

const cacheGet = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const cacheSet = async (key, value, ttl) => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
  }
};

const cacheDel = async (...keys) => {
  try {
    const validKeys = keys.filter(Boolean);
    if (validKeys.length) await redis.del(...validKeys);
  } catch {
  }
};

const cacheDelPattern = async (pattern) => {
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== "0");
  } catch {
    
  }
};

module.exports = { redis, TTL, KEYS, cacheGet, cacheSet, cacheDel, cacheDelPattern };
