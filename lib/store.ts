"use client"

import { ReviewRecord, AppSettings, GeneratedContent, ThumbnailImage, QueueItem } from "./types"

const REVIEWS_KEY = "crp_reviews"
const SETTINGS_KEY = "crp_settings"
const THUMBNAIL_LIBRARY_KEY = "crp_thumbnail_library"
const QUEUE_KEY = "crp_queue"
const DRAFT_KEY = "crp_draft"

export function getReviews(): ReviewRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(REVIEWS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveReview(record: ReviewRecord): void {
  const reviews = getReviews()
  const idx = reviews.findIndex((r) => r.id === record.id)
  if (idx >= 0) {
    reviews[idx] = record
  } else {
    reviews.unshift(record)
  }
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews))
}

export function getReviewById(id: string): ReviewRecord | null {
  return getReviews().find((r) => r.id === id) ?? null
}

export function updateGeneratedContent(id: string, content: Partial<GeneratedContent>): ReviewRecord | null {
  const reviews = getReviews()
  const idx = reviews.findIndex((r) => r.id === id)
  if (idx < 0) return null
  reviews[idx].generated = { ...reviews[idx].generated, ...content }
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews))
  return reviews[idx]
}

const DEFAULT_SETTINGS: AppSettings = {
  wpSiteUrl: "",
  wpUsername: "",
  wpAppPassword: "",
  openaiApiKey: "",
  adminPassword: "",
  elevenlabsApiKey: "",
  elevenlabsVoiceId: "21m00Tcm4TlvDq8ikWAM",
  thumbnailSiteName: "Arousr",
}

export function getThumbnailLibrary(): ThumbnailImage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(THUMBNAIL_LIBRARY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveThumbnailLibrary(images: ThumbnailImage[]): void {
  localStorage.setItem(THUMBNAIL_LIBRARY_KEY, JSON.stringify(images))
}

export function addThumbnailImage(image: ThumbnailImage): void {
  const library = getThumbnailLibrary()
  library.unshift(image)
  saveThumbnailLibrary(library)
}

export function deleteThumbnailImage(id: string): void {
  const library = getThumbnailLibrary().filter((img) => img.id !== id)
  saveThumbnailLibrary(library)
}

export function saveDraft(formData: import("./types").ReviewFormData): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, savedAt: new Date().toISOString() }))
}

export function getDraft(): { formData: import("./types").ReviewFormData; savedAt: string } | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
}

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getQueue(): QueueItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveQueue(queue: QueueItem[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function addToQueue(url: string, name = ""): QueueItem {
  const queue = getQueue()
  const item: QueueItem = {
    id: crypto.randomUUID(),
    url,
    name,
    status: "Not Started",
    statusUpdatedAt: new Date().toISOString(),
  }
  queue.unshift(item)
  saveQueue(queue)
  return item
}

export function updateQueueItemStatus(id: string, status: "Not Started" | "In Progress" | "Completed"): void {
  const queue = getQueue()
  const item = queue.find((q) => q.id === id)
  if (item) {
    item.status = status
    item.statusUpdatedAt = new Date().toISOString()
    saveQueue(queue)
  }
}

export function updateQueueItemName(id: string, name: string): void {
  const queue = getQueue()
  const item = queue.find((q) => q.id === id)
  if (item) {
    item.name = name
    saveQueue(queue)
  }
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((q) => q.id !== id)
  saveQueue(queue)
}

export function getSortedQueue(): QueueItem[] {
  const queue = getQueue()
  const statusOrder = { "In Progress": 0, "Not Started": 1, "Completed": 2 }
  return [...queue].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
}
