const DB_NAME = "AroursApp"
const STORE_NAME = "VideoAssets"
const DB_VERSION = 1

async function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment")
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function saveVideoAsset(key: string, base64: string): Promise<void> {
  if (typeof window === "undefined") return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(base64, key)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => resolve()
  })
}

export async function getVideoAsset(key: string): Promise<string | null> {
  if (typeof window === "undefined") return null
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

export async function deleteVideoAsset(key: string): Promise<void> {
  if (typeof window === "undefined") return
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(key)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => resolve()
  })
}
