"use server";

import { cookies } from "next/headers";

export async function setLanguage(locale: "en" | "he") {
  const store = await cookies();
  store.set("locale", locale, { path: "/" });
}
