"use server";

import { cookies } from "next/headers";

export async function setDevUser(tokenIdentifier: string) {
  const store = await cookies();
  store.set("outsight_dev_user_token_identifier", tokenIdentifier, { path: "/" });
}

export async function clearDevUser() {
  const store = await cookies();
  store.delete("outsight_dev_user_token_identifier");
}
