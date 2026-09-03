// Tiny IndexedDB wrapper for the diary. One object store of entries; each entry
// keeps the photo blob plus the card facts (see docs/05-architecture.md — this
// is the shape v2 albums will sort). Everything here is best-effort: if storage
// fails, the app still works for the current session.
const DB_NAME = 'photodiary';
const STORE = 'entries';
const COVERS = 'covers'; // user-chosen album covers: { albumId, entryId }

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(COVERS)) {
        db.createObjectStore(COVERS, { keyPath: 'albumId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Save (or overwrite) an entry.
export async function saveEntry(entry) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Permanently delete one or more entries by id (the user's own photos).
export async function deleteEntries(ids) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const id of ids) store.delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// The most recently added entry (or null).
export async function getLatestEntry() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('createdAt').openCursor(null, 'prev');
    req.onsuccess = () => {
      const cursor = req.result;
      db.close();
      resolve(cursor ? cursor.value : null);
    };
    req.onerror = () => reject(req.error);
  });
}

// All entries, newest first.
export async function getAllEntries() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('createdAt').openCursor(null, 'prev');
    const out = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        out.push(cursor.value);
        cursor.continue();
      } else {
        db.close();
        resolve(out);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// The user's chosen album covers as { albumId: entryId }.
export async function getCoverMap() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COVERS, 'readonly');
    const req = tx.objectStore(COVERS).getAll();
    req.onsuccess = () => {
      db.close();
      const map = {};
      for (const r of req.result) map[r.albumId] = r.entryId;
      resolve(map);
    };
    req.onerror = () => reject(req.error);
  });
}

// Set (or overwrite) the cover photo for an album.
export async function setCover(albumId, entryId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COVERS, 'readwrite');
    tx.objectStore(COVERS).put({ albumId, entryId });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Ask the browser to keep this data (so it isn't evicted under pressure).
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* not critical */
  }
}
