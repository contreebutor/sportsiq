import { API_BASE } from "./constants";
import type { UserInfo } from "./types";

export async function needsOtp(phone: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE}/phone/needs-otp?phone=${encodeURIComponent(phone)}`
    );
    if (!res.ok) return true;
    const data = await res.json();
    return data.requiresOtp ?? true;
  } catch {
    return true;
  }
}

export async function createOtp(phone: string): Promise<void> {
  const res = await fetch(`${API_BASE}/phone/create-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to send code");
  }
}

export async function verifyOtp(
  phone: string,
  otp: number
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/phone/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  if (!res.ok) return false;
  const resJson = await res.json();
  return resJson.data === true;
}

export async function fetchUser(phone: string): Promise<UserInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/mobile/user/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const resJson = await res.json();
    if (!res.ok) return null;
    return resJson.data ?? null;
  } catch {
    return null;
  }
}

export async function createUser(
  phone: string,
  name: string,
  avatar_url: string | null
): Promise<void> {
  const res = await fetch(`${API_BASE}/mobile/user/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name, avatar_url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Failed to create profile");
  }
}
