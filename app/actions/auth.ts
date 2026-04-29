"use server"

import { verifyPassword, createSession, clearSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function loginAction(
  prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const password = formData.get("password") as string
  
  console.log("[v0] loginAction called, password provided:", !!password)
  
  if (!password) {
    return { error: "Password is required" }
  }
  
  const isValid = await verifyPassword(password)
  console.log("[v0] loginAction password valid:", isValid)
  
  if (!isValid) {
    return { error: "Invalid password" }
  }
  
  await createSession()
  console.log("[v0] loginAction session created, redirecting to /queue")
  redirect("/queue")
}

export async function logoutAction() {
  await clearSession()
  redirect("/")
}
