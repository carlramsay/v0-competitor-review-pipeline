"use server"

import { verifyPassword, createSession, clearSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string
  
  if (!password) {
    return { error: "Password is required" }
  }
  
  const isValid = await verifyPassword(password)
  
  if (!isValid) {
    return { error: "Invalid password" }
  }
  
  await createSession()
  redirect("/queue")
}

export async function logoutAction() {
  await clearSession()
  redirect("/")
}
