import type { Route } from "./+types/[.]well-known.appspecific.com.chrome.devtools.json";

export async function loader({}: Route.LoaderArgs) {
  // Return empty JSON response to silence Chrome DevTools polling
  return {};
}

