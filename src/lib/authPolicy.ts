// Shared password policy for signup and password reset. Lives outside
// src/lib/actions/auth.ts because a "use server" file may only export async
// functions -- a plain string/function export there breaks Next's server
// action boundary at build time.

export const PASSWORD_REQUIREMENTS = "At least 8 characters, with a letter and a number.";

export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}
