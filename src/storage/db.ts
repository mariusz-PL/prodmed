/** Minimalna obietnicowa nakładka na IndexedDB — bez zależności. */

const DB_NAME = "prodmed";
const DB_VERSION = 1;

export type StoreName = "problems" | "sessions" | "audio";

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("problems")) db.createObjectStore("problems", { keyPath: "id" });
      if (!db.objectStoreNames.contains("sessions")) {
        const s = db.createObjectStore("sessions", { keyPath: "id" });
        s.createIndex("byProblem", "problemId");
      }
      if (!db.objectStoreNames.contains("audio")) db.createObjectStore("audio", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB tx aborted"));
  });
}

function reqResult<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export async function put<T>(store: StoreName, value: T): Promise<void> {
  const db = await open();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(value);
  await txDone(tx);
}

export async function get<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await open();
  return reqResult(db.transaction(store).objectStore(store).get(key)) as Promise<T | undefined>;
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await open();
  return reqResult(db.transaction(store).objectStore(store).getAll()) as Promise<T[]>;
}

export async function del(store: StoreName, key: string): Promise<void> {
  const db = await open();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).delete(key);
  await txDone(tx);
}

export async function getByIndex<T>(store: StoreName, index: string, key: string): Promise<T[]> {
  const db = await open();
  return reqResult(db.transaction(store).objectStore(store).index(index).getAll(key)) as Promise<T[]>;
}

export async function wipeAll(): Promise<void> {
  const db = await open();
  const tx = db.transaction(["problems", "sessions", "audio"], "readwrite");
  tx.objectStore("problems").clear();
  tx.objectStore("sessions").clear();
  tx.objectStore("audio").clear();
  await txDone(tx);
}
