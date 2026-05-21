import { openDB } from 'idb';

const DB_NAME = 'miniMarketOfflineDB';
const DB_VERSION = 1;
const STORE_CACHE = 'cache';
const STORE_QUEUE = 'queue';

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const setCache = async (key, data) => {
  const db = await initDB();
  return db.put(STORE_CACHE, { key, data, timestamp: Date.now() });
};

export const getCache = async (key) => {
  const db = await initDB();
  const result = await db.get(STORE_CACHE, key);
  return result ? result.data : null;
};

export const clearCache = async () => {
  const db = await initDB();
  return db.clear(STORE_CACHE);
};

export const addToQueue = async (requestData) => {
  const db = await initDB();
  return db.add(STORE_QUEUE, {
    ...requestData,
    timestamp: Date.now(),
  });
};

export const getQueue = async () => {
  const db = await initDB();
  return db.getAll(STORE_QUEUE);
};

export const removeFromQueue = async (id) => {
  const db = await initDB();
  return db.delete(STORE_QUEUE, id);
};

export const clearQueue = async () => {
  const db = await initDB();
  return db.clear(STORE_QUEUE);
};
