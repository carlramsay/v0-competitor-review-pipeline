"use client"

const SESSION_KEY = "crp_admin_session"

export function setAdminSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SESSION_KEY, "1")
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(SESSION_KEY)
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(SESSION_KEY) === "1"
}
