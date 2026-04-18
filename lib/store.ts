"use client"

// Re-export everything from supabase-store for backward compatibility
// This file now serves as a facade over the Supabase store

export {
  getReviews,
  saveReview,
  getReviewById,
  updateGeneratedContent,
  getSettings,
  saveSettings,
  getThumbnailLibrary,
  saveThumbnailLibrary,
  addThumbnailImage,
  deleteThumbnailImage,
  saveDraft,
  getDraft,
  clearDraft,
  getQueue,
  saveQueue,
  addToQueue,
  updateQueueItemStatus,
  updateQueueItemName,
  removeFromQueue,
  getSortedQueue,
  saveVideoAsset,
  getVideoAsset,
  deleteVideoAsset,
} from "./supabase-store"

// Re-export types
export type { ReviewRecord, AppSettings, GeneratedContent, ThumbnailImage, QueueItem, ReviewFormData } from "./types"
