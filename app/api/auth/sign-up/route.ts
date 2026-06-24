import { redirect } from "next/navigation";
import { getSignUpUrl } from "@workos-inc/authkit-nextjs";

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_LOGIN === "false") {
    return redirect("/");
  }
  const redirectUri = new URL("/callback", request.url).toString();
  const authorizationUrl = await getSignUpUrl({ redirectUri });
  return redirect(authorizationUrl);
}

