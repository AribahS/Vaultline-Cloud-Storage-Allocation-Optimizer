/**
 * Clears the currentSession key from the vaultline_db IndexedDB.
 * Called on startup to prevent stale file lists from old builds.
 * Does NOT touch engine/storageDb.ts (rule 2).
 */
export function clearStaleSession(): void {
  try {
    const req = indexedDB.open('vaultline_db');
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (db.objectStoreNames.contains('currentSession')) {
        try {
          const tx = db.transaction('currentSession', 'readwrite');
          tx.objectStore('currentSession').delete('latest');
        } catch (_) {
          // store might not exist yet – ignore
        }
      }
      db.close();
    };
  } catch (_) {
    // Non-fatal
  }
}
