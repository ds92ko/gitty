import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getCatStateImagePath } from "./cat-state";
import {
  getCatStateMessage,
  type WidgetCatState,
} from "./cat-message";
import type { CatStateMilestone } from "./determine-cat-state";
import type { GitHubActivity } from "./github-activity";

const ENCODED_IMAGE_CACHE = new Map<string, Promise<string>>();
const WIDGET_COLORS = {
  backgroundWidget: "#fbfcfe",
  backgroundBubble: "#ffffff",
  textPrimary: "#24292f",
  textSecondary: "#6e7781",
  textMuted: "#8c959f",
  borderDefault: "#d8dee4",
  borderMuted: "#eaeef2",
} as const;
const WIDGET_LAYOUT = {
  width: 614,
  height: 274,
  borderInset: 1,
  cornerRadius: 14,
  horizontalPadding: 24,
  dividerY: 52,
  logo: {
    x: 24,
    y: 8,
    width: 112,
    height: 35,
  },
  username: {
    y: 30,
    fontSize: 14,
  },
  cat: {
    x: 0,
    width: 222,
    height: 222,
  },
  speechBubble: {
    path: "M260 82 H570 Q590 82 590 102 V122 Q590 142 570 142 H260 Q240 142 240 122 V121 L222 123 L240 103 V102 Q240 82 260 82 Z",
    textX: 415,
    textY: 112,
    fontSize: 15,
  },
  activity: {
    startX: 240,
    width: 350,
    labelY: 175,
    bowlY: 183,
    summaryX: 415,
    summaryY: 237,
    emptySummaryY: 200,
    labelFontSize: 10,
    summaryFontSize: 12,
    bowl: {
      width: 42,
      height: 29,
    },
  },
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

function getWidgetImagePath(path: string) {
  return join(process.cwd(), "public", "widget", path);
}

function getEncodedImage(path: string) {
  const cachedImage = ENCODED_IMAGE_CACHE.get(path);

  if (cachedImage) {
    return cachedImage;
  }

  const encodedImage = readFile(getWidgetImagePath(path)).then((image) =>
    image.toString("base64"),
  );

  ENCODED_IMAGE_CACHE.set(path, encodedImage);

  return encodedImage;
}

export async function renderWidget({
  state,
  username,
  activity,
  milestone = null,
}: RenderWidgetOptions) {
  const [image, logo] = await Promise.all([
    getEncodedImage(getCatStateImagePath(state)),
    getEncodedImage("/brand/logo.png"),
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
      getEncodedImage("/activity/bowl_empty.png"),
      getEncodedImage("/activity/bowl_full.png"),
    ]);
    const bowlImages = {
      empty: emptyBowl,
      full: fullBowl,
    };

    bowlDefinitions = `  <defs>
    <image id="bowl-empty" href="data:image/png;base64,${bowlImages.empty}" width="${WIDGET_LAYOUT.activity.bowl.width}" height="${WIDGET_LAYOUT.activity.bowl.height}" />
    <image id="bowl-full" href="data:image/png;base64,${bowlImages.full}" width="${WIDGET_LAYOUT.activity.bowl.width}" height="${WIDGET_LAYOUT.activity.bowl.height}" />
  </defs>`;
    const itemGap =
      activity.recentDays7.length > 1
        ? (WIDGET_LAYOUT.activity.width -
            WIDGET_LAYOUT.activity.bowl.width) /
          (activity.recentDays7.length - 1)
        : 0;

    activityMarkup = activity.recentDays7
      .map((day, index) => {
        const x = Math.round(
          WIDGET_LAYOUT.activity.startX + index * itemGap,
        );
        const labelX = x + WIDGET_LAYOUT.activity.bowl.width / 2;
        const label =
          index === activity.recentDays7.length - 1
            ? "오늘"
            : getWeekdayLabel(day.date);
        const bowlId = day.active ? "bowl-full" : "bowl-empty";

        return `  <text x="${labelX}" y="${WIDGET_LAYOUT.activity.labelY}" text-anchor="middle" fill="${WIDGET_COLORS.textMuted}" font-family="Arial, sans-serif" font-size="${WIDGET_LAYOUT.activity.labelFontSize}" font-weight="600">${label}</text>
  <use href="#${bowlId}" x="${x}" y="${WIDGET_LAYOUT.activity.bowlY}" />`;
      })
      .join("\n");
  }

  const contentRight =
    WIDGET_LAYOUT.width - WIDGET_LAYOUT.horizontalPadding;
  const borderWidth =
    WIDGET_LAYOUT.width - WIDGET_LAYOUT.borderInset * 2;
  const borderHeight =
    WIDGET_LAYOUT.height - WIDGET_LAYOUT.borderInset * 2;
  const summaryY = showActivity
    ? WIDGET_LAYOUT.activity.summaryY
    : WIDGET_LAYOUT.activity.emptySummaryY;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDGET_LAYOUT.width}" height="${WIDGET_LAYOUT.height}" viewBox="0 0 ${WIDGET_LAYOUT.width} ${WIDGET_LAYOUT.height}" role="img" aria-label="${escapedMessage}">
  <title>${escapedMessage}</title>
${bowlDefinitions}
  <rect x="${WIDGET_LAYOUT.borderInset}" y="${WIDGET_LAYOUT.borderInset}" width="${borderWidth}" height="${borderHeight}" rx="${WIDGET_LAYOUT.cornerRadius}" fill="${WIDGET_COLORS.backgroundWidget}" stroke="${WIDGET_COLORS.borderDefault}" />
  <image href="data:image/png;base64,${logo}" x="${WIDGET_LAYOUT.logo.x}" y="${WIDGET_LAYOUT.logo.y}" width="${WIDGET_LAYOUT.logo.width}" height="${WIDGET_LAYOUT.logo.height}" />
  <text x="${contentRight}" y="${WIDGET_LAYOUT.username.y}" text-anchor="end" fill="${WIDGET_COLORS.textMuted}" font-family="Arial, sans-serif" font-size="${WIDGET_LAYOUT.username.fontSize}">${usernameLabel}</text>
  <line x1="${WIDGET_LAYOUT.horizontalPadding}" y1="${WIDGET_LAYOUT.dividerY}" x2="${contentRight}" y2="${WIDGET_LAYOUT.dividerY}" stroke="${WIDGET_COLORS.borderMuted}" />
  <image href="data:image/png;base64,${image}" x="${WIDGET_LAYOUT.cat.x}" y="${WIDGET_LAYOUT.dividerY}" width="${WIDGET_LAYOUT.cat.width}" height="${WIDGET_LAYOUT.cat.height}" />
  <path d="${WIDGET_LAYOUT.speechBubble.path}" fill="${WIDGET_COLORS.backgroundBubble}" stroke="${WIDGET_COLORS.borderDefault}" stroke-linejoin="round" />
  <text x="${WIDGET_LAYOUT.speechBubble.textX}" y="${WIDGET_LAYOUT.speechBubble.textY}" text-anchor="middle" dominant-baseline="middle" fill="${WIDGET_COLORS.textPrimary}" font-family="Arial, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif" font-size="${WIDGET_LAYOUT.speechBubble.fontSize}" font-weight="600">${escapedMessage}</text>
${activityMarkup}
  <text x="${WIDGET_LAYOUT.activity.summaryX}" y="${summaryY}" text-anchor="middle" fill="${WIDGET_COLORS.textSecondary}" font-family="Arial, sans-serif" font-size="${WIDGET_LAYOUT.activity.summaryFontSize}" font-weight="500">${summary}</text>
</svg>`;
}
