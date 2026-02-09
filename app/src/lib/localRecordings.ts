/**
 * Local recordings storage (IndexedDB).
 * Used when user opts in via Accessibility Settings to save recordings locally.
 * Supports user-chosen folder via File System Access API when available.
 */

const DB_NAME = 'kuiper_local_recordings'
const DB_VERSION = 2
const STORE_NAME = 'recordings'
const SETTINGS_STORE = 'settings'
const SAVE_DIR_KEY = 'saveDirectoryHandle'

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
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!req.result.objectStoreNames.contains(SETTINGS_STORE)) {
        req.result.createObjectStore(SETTINGS_STORE)
      }
    }
  })
}

/** Check if File System Access API is supported (Chrome, Edge). */
export function isFolderPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

/** Prompt user to choose a save folder. Returns handle or null if cancelled/unsupported. */
export async function chooseSaveFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFolderPickerSupported()) return null
  try {
    const handle = await (window as unknown as { showDirectoryPicker: (opts?: { mode?: string }) => Promise<FileSystemDirectoryHandle> })
      .showDirectoryPicker({ mode: 'readwrite' })
    await saveDirectoryHandle(handle)
    return handle
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null
    throw err
  }
}

export async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite')
    const store = tx.objectStore(SETTINGS_STORE)
    const req = store.put(handle, SAVE_DIR_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readonly')
    const store = tx.objectStore(SETTINGS_STORE)
    const req = store.get(SAVE_DIR_KEY)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function clearDirectoryHandle(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite')
    const store = tx.objectStore(SETTINGS_STORE)
    const req = store.delete(SAVE_DIR_KEY)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

export async function getChosenFolderName(): Promise<string | null> {
  const handle = await getDirectoryHandle()
  return handle?.name ?? null
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 80)
}

/** Write a file to the user's chosen folder. Silent no-op if no handle or write fails. */
async function writeToChosenFolder(
  dirHandle: FileSystemDirectoryHandle,
  filename: string,
  blob: Blob
): Promise<void> {
  try {
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()
  } catch (err) {
    console.warn('Failed to write to chosen folder:', err)
  }
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
  const result = await new Promise<LocalRecording>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.add(rec)
    req.onsuccess = () => resolve(rec)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })

  // Also write to user's chosen folder if set
  const dirHandle = await getDirectoryHandle()
  if (dirHandle) {
    const base = safeFilename(scriptName)
    const filename = `${base}_${String(lineIndex + 1).padStart(4, '0')}.wav`
    await writeToChosenFolder(dirHandle, filename, audioBlob)
  }

  return result
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
