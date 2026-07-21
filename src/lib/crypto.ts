/**
 * Hash a password client-side (SHA-256, hex) before sending it to the server.
 *
 * The plaintext password never leaves the browser, so it is not visible in
 * request payloads/headers. The hash itself becomes the credential passed to
 * Supabase Auth, which stores it bcrypt-hashed server-side as usual. Because
 * the hash is the credential, signup and login must always hash identically —
 * never send the raw password.
 *
 * Note: any future password-reset form must also hash the new password with
 * this function before calling supabase.auth.updateUser().
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const data = new TextEncoder().encode(password);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  throw new Error(
    "Secure password hashing is unavailable. Please access the app via localhost or HTTPS."
  );
}
