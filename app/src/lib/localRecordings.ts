/**
 * Local recordings storage (IndexedDB).
 * Used when user opts in via Accessibility Settings to save recordings locally.
 */

const DB_NAME = 'kuiper_local_recordings'
const DB_VERSION = 1
const STORE_NAME = 'recordings'

export interface LocalRecording {
  id: string
  createdAt: number
  scriptName: string
  scriptId: number
  lineIndex: number
  phraseText: string
  durationSeconds: number
  audioBlob: Blob
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
  })
}

export async function saveLocalRecording(
  audioBlob: Blob,
  scriptName: string,
  scriptId: number,
  lineIndex: number,
  phraseText: string,
  durationSeconds: number
): Promise<LocalRecording> {
  const db = await openDB()
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const rec: LocalRecording = {
    id,
    createdAt: Date.now(),
    scriptName,
    scriptId,
    lineIndex,
    phraseText,
    durationSeconds,
    audioBlob,
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.add(rec)
    req.onsuccess = () => resolve(rec)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function listLocalRecordings(): Promise<LocalRecording[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => {
      const items = (req.result as LocalRecording[]).sort((a, b) => b.createdAt - a.createdAt)
      resolve(items)
    }
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function deleteLocalRecording(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}
