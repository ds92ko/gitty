import { fetchContributionCalendar } from "@/lib/github/fetch-contribution-calendar";
import { parseContributionCalendar } from "@/lib/github/parse-contribution-calendar";
import { analyzeGitHubActivity } from "@/lib/gitty/analyze-github-activity";
import type { WidgetCatState } from "@/lib/gitty/cat-message";
import { determineCatState } from "@/lib/gitty/determine-cat-state";
import { renderWidget } from "@/lib/gitty/render-widget";

const WIDGET_CACHE_CONTROL =
  "public, max-age=0, s-maxage=900, stale-while-revalidate=3600";
const GITHUB_USERNAME_PATTERN =
  /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export const runtime = "nodejs";

function isValidGitHubUsername(value: string | null): value is string {
  return value !== null && GITHUB_USERNAME_PATTERN.test(value);
}

async function createWidgetResponse(state: WidgetCatState) {
  const svg = await renderWidget(state);

  return new Response(svg, {
    headers: {
      "Cache-Control": WIDGET_CACHE_CONTROL,
      "Content-Length": Buffer.byteLength(svg).toString(),
      "Content-Security-Policy": "default-src 'none'; img-src data:",
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Gitty-State": state,
    },
  });
}

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username");
  let state: WidgetCatState = "confused";

  if (isValidGitHubUsername(username)) {
    try {
      const now = new Date();
      const response = await fetchContributionCalendar(username, now);
      const calendar = parseContributionCalendar(response);
      const currentActivity = analyzeGitHubActivity(calendar, now);
      const previousDate = new Date(now);

      previousDate.setUTCDate(previousDate.getUTCDate() - 1);

      const previousActivity = analyzeGitHubActivity(
        calendar,
        previousDate,
      );

      state = determineCatState(currentActivity, previousActivity);
    } catch {
      state = "confused";
    }
  }

  return createWidgetResponse(state);
}
