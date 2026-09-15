import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getCatStateImagePath } from "./cat-state";
import {
  getCatStateMessage,
  type WidgetCatState,
} from "./cat-message";
import type { CatStateMilestone } from "./determine-cat-state";
import type { GitHubActivity } from "./github-activity";

const WIDGET_WIDTH = 614;
const WIDGET_HEIGHT = 274;
const WIDGET_COLORS = {
  backgroundWidget: "#fbfcfe",
  backgroundBubble: "#ffffff",
  textPrimary: "#24292f",
  textSecondary: "#6e7781",
  textMuted: "#8c959f",
  borderDefault: "#d8dee4",
  borderMuted: "#eaeef2",
} as const;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const POSITIVE_STATES = new Set<WidgetCatState>([
  "normal",
  "coding",
  "happy",
  "cheering",
  "excited",
  "proud",
  "love",
]);
const HUNGER_STATES = new Set<WidgetCatState>([
  "waiting",
  "nervous",
  "crying",
  "angry",
  "tired",
  "burned_out",
  "sleeping",
]);

interface RenderWidgetOptions {
  state: WidgetCatState;
  username?: string;
  activity?: GitHubActivity;
  milestone?: CatStateMilestone | null;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getWeekdayLabel(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();

  return WEEKDAY_LABELS[weekday];
}

function getActivitySummary({
  state,
  activity,
  milestone,
}: RenderWidgetOptions) {
  if (!activity) {
    return "활동 정보를 불러오지 못했어요";
  }

  if (POSITIVE_STATES.has(state)) {
    return `최근 30일 중 ${activity.activeDays30}일 활동`;
  }

  if (HUNGER_STATES.has(state)) {
    return `마지막 활동 ${activity.daysSinceLastActivity}일 전`;
  }

  if (state === "peeking" && activity.previousActivityGap !== null) {
    return `${activity.previousActivityGap}일 만에 활동 재개`;
  }

  if (state === "celebrating" && milestone) {
    return "새로운 단계 달성!";
  }

  return "활동 요약 정보가 없어요";
}

function getImagePath(path: string) {
  return join(process.cwd(), "public", path);
}

export async function renderWidget({
  state,
  username,
  activity,
  milestone = null,
}: RenderWidgetOptions) {
  const [image, logo] = await Promise.all([
    readFile(getImagePath(getCatStateImagePath(state))),
    readFile(getImagePath("/brand/logo.png")),
  ]);
  const message = getCatStateMessage(state);
  const escapedMessage = escapeXml(message);
  const showActivity = state !== "confused" && activity !== undefined;
  const summary = escapeXml(
    getActivitySummary({ state, username, activity, milestone }),
  );
  const usernameLabel = username ? `@${escapeXml(username)}` : "Gitty";

  let bowlDefinitions = "";
  let activityMarkup = "";

  if (showActivity) {
    const [emptyBowl, fullBowl] = await Promise.all([
      readFile(getImagePath("/activity/bowl_empty.png")),
      readFile(getImagePath("/activity/bowl_full.png")),
    ]);
    const bowlImages = {
      empty: emptyBowl.toString("base64"),
      full: fullBowl.toString("base64"),
    };

    bowlDefinitions = `  <defs>
    <image id="bowl-empty" href="data:image/png;base64,${bowlImages.empty}" width="42" height="29" />
    <image id="bowl-full" href="data:image/png;base64,${bowlImages.full}" width="42" height="29" />
  </defs>`;
    activityMarkup = activity.recentDays7
      .map((day, index) => {
        const x = Math.round(240 + index * ((350 - 42) / 6));
        const label =
          index === activity.recentDays7.length - 1
            ? "오늘"
            : getWeekdayLabel(day.date);
        const bowlId = day.active ? "bowl-full" : "bowl-empty";

        return `  <text x="${x + 21}" y="175" text-anchor="middle" fill="${WIDGET_COLORS.textMuted}" font-family="Arial, sans-serif" font-size="10" font-weight="600">${label}</text>
  <use href="#${bowlId}" x="${x}" y="183" />`;
      })
      .join("\n");
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDGET_WIDTH}" height="${WIDGET_HEIGHT}" viewBox="0 0 ${WIDGET_WIDTH} ${WIDGET_HEIGHT}" role="img" aria-label="${escapedMessage}">
  <title>${escapedMessage}</title>
${bowlDefinitions}
  <rect x="1" y="1" width="612" height="272" rx="14" fill="${WIDGET_COLORS.backgroundWidget}" stroke="${WIDGET_COLORS.borderDefault}" />
  <image href="data:image/png;base64,${logo.toString("base64")}" x="24" y="8" width="112" height="35" />
  <text x="590" y="30" text-anchor="end" fill="${WIDGET_COLORS.textMuted}" font-family="Arial, sans-serif" font-size="14">${usernameLabel}</text>
  <line x1="24" y1="52" x2="590" y2="52" stroke="${WIDGET_COLORS.borderMuted}" />
  <image href="data:image/png;base64,${image.toString("base64")}" x="0" y="52" width="222" height="222" />
  <path d="M260 82 H570 Q590 82 590 102 V122 Q590 142 570 142 H260 Q240 142 240 122 V121 L222 123 L240 103 V102 Q240 82 260 82 Z" fill="${WIDGET_COLORS.backgroundBubble}" stroke="${WIDGET_COLORS.borderDefault}" stroke-linejoin="round" />
  <text x="415" y="112" text-anchor="middle" dominant-baseline="middle" fill="${WIDGET_COLORS.textPrimary}" font-family="Arial, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif" font-size="15" font-weight="600">${escapedMessage}</text>
${activityMarkup}
  <text x="415" y="${showActivity ? 237 : 200}" text-anchor="middle" fill="${WIDGET_COLORS.textSecondary}" font-family="Arial, sans-serif" font-size="12" font-weight="500">${summary}</text>
</svg>`;
}
