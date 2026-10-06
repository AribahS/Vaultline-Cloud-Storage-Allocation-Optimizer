import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FileMetadata } from './types';
import { PriorityRuleConfig, DEFAULT_PRIORITY_RULES } from './priority';

export interface SavedScenario {
  id: string;
  name: string;
  timestamp: number;
  files: FileMetadata[];
  quotaBytes: number;
  quotaUnitOption: string;
  folderMode: boolean;
  priorityRules: PriorityRuleConfig;
}

interface VaultlineDB extends DBSchema {
  scenarios: {
    key: string;
    value: SavedScenario;
    indexes: { 'by-timestamp': number };
  };
  currentSession: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'vaultline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VaultlineDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<VaultlineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('scenarios')) {
          const scenarioStore = db.createObjectStore('scenarios', { keyPath: 'id' });
          scenarioStore.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('currentSession')) {
          db.createObjectStore('currentSession');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveScenario(scenario: SavedScenario): Promise<void> {
  try {
    const db = await getDb();
    await db.put('scenarios', scenario);
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
  }
}

export async function listScenarios(): Promise<SavedScenario[]> {
  try {
    const db = await getDb();
    const all = await db.getAllFromIndex('scenarios', 'by-timestamp');
    return all.reverse();
  } catch (err) {
    console.warn('IndexedDB list failed:', err);
    return [];
  }
}

export async function deleteScenario(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete('scenarios', id);
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }
}

export async function saveAutoSession(state: any): Promise<void> {
  try {
    const db = await getDb();
    await db.put('currentSession', state, 'latest');
  } catch (err) {
    // Non-fatal
  }
}

export async function loadAutoSession(): Promise<any | null> {
  try {
    const db = await getDb();
    return await db.get('currentSession', 'latest');
  } catch (err) {
    return null;
  }
}
