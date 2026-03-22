import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }

  return url;
}

export async function getViewerFromAccessToken(accessToken: string) {
  const client = new ConvexHttpClient(getConvexUrl());
  client.setAuth(accessToken);
  return client.query(api.users.viewer, {});
}
