import type { ContributionCalendar } from "../github/contribution-calendar";
import type { GitHubActivity } from "./github-activity";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function toUtcDayNumber(date: Date) {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      DAY_IN_MILLISECONDS,
  );
}

function parseContributionDay(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new TypeError("Invalid contribution date");
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month ||
    parsed.getUTCDate() !== day
  ) {
    throw new TypeError("Invalid contribution date");
  }

  return Math.floor(timestamp / DAY_IN_MILLISECONDS);
}

function countActiveDays(
  activeDays: ReadonlySet<number>,
  referenceDay: number,
  windowDays: number,
) {
  let count = 0;
  const firstDay = referenceDay - windowDays + 1;

  for (const day of activeDays) {
    if (day >= firstDay && day <= referenceDay) {
      count += 1;
    }
  }

  return count;
}

function getRecentDays(
  activeDays: ReadonlySet<number>,
  referenceDay: number,
) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = referenceDay - 6 + index;

    return {
      date: new Date(day * DAY_IN_MILLISECONDS).toISOString().slice(0, 10),
      active: activeDays.has(day),
    };
  });
}

export function analyzeGitHubActivity(
  calendar: ContributionCalendar,
  referenceDate = new Date(),
): GitHubActivity {
  if (Number.isNaN(referenceDate.getTime())) {
    throw new TypeError("Expected referenceDate to be a valid date");
  }

  const referenceDay = toUtcDayNumber(referenceDate);
  const activeDays = new Set(
    calendar.days
      .filter((day) => day.contributionCount > 0)
      .map((day) => parseContributionDay(day.date))
      .filter((day) => day <= referenceDay),
  );
  const previousActiveDays = [...activeDays].filter(
    (day) => day < referenceDay,
  );
  const lastActiveDay =
    activeDays.size > 0 ? Math.max(...activeDays) : null;
  const previousActiveDay =
    previousActiveDays.length > 0 ? Math.max(...previousActiveDays) : null;
  const userCreatedDay = toUtcDayNumber(calendar.userCreatedAt);

  return {
    activeToday: activeDays.has(referenceDay),
    activeDays7: countActiveDays(activeDays, referenceDay, 7),
    activeDays30: countActiveDays(activeDays, referenceDay, 30),
    activeDays90: countActiveDays(activeDays, referenceDay, 90),
    activeDays180: countActiveDays(activeDays, referenceDay, 180),
    daysSinceLastActivity:
      lastActiveDay === null
        ? Math.max(0, referenceDay - userCreatedDay)
        : referenceDay - lastActiveDay,
    previousActivityGap:
      activeDays.has(referenceDay) && previousActiveDay !== null
        ? referenceDay - previousActiveDay
        : null,
    recentDays7: getRecentDays(activeDays, referenceDay),
  };
}
