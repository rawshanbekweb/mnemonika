"use client";

/** Kichik fetch yordamchilari (client komponentlar uchun). */
async function handle(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Xatolik yuz berdi");
  return data;
}

export const api = {
  get: (url: string) => fetch(url, { cache: "no-store" }).then(handle),
  post: (url: string, body?: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body == null ? undefined : JSON.stringify(body),
    }).then(handle),
  put: (url: string, body: unknown) =>
    fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),
  del: (url: string) => fetch(url, { method: "DELETE" }).then(handle),
  upload: (url: string, form: FormData) =>
    fetch(url, { method: "POST", body: form }).then(handle),
};
