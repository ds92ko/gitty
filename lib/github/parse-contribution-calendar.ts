import type {
  ContributionCalendar,
  ContributionDay,
} from "./contribution-calendar";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseContributionDay(value: unknown): ContributionDay {
  if (
    !isRecord(value) ||
    typeof value.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.date) ||
    typeof value.contributionCount !== "number" ||
    !Number.isInteger(value.contributionCount) ||
    value.contributionCount < 0
  ) {
    throw new TypeError("Invalid contribution day");
  }

  return {
    date: value.date,
    contributionCount: value.contributionCount,
  };
}

export function parseContributionCalendar(
  value: unknown,
): ContributionCalendar {
  if (
    !isRecord(value) ||
    !isRecord(value.data) ||
    !isRecord(value.data.user) ||
    typeof value.data.user.createdAt !== "string" ||
    !isRecord(value.data.user.contributionsCollection) ||
    !isRecord(
      value.data.user.contributionsCollection.contributionCalendar,
    ) ||
    !Array.isArray(
      value.data.user.contributionsCollection.contributionCalendar.weeks,
    )
  ) {
    throw new TypeError("Invalid contribution calendar response");
  }

  const userCreatedAt = new Date(value.data.user.createdAt);

  if (Number.isNaN(userCreatedAt.getTime())) {
    throw new TypeError("Invalid GitHub user creation date");
  }

  const days = value.data.user.contributionsCollection.contributionCalendar.weeks
    .flatMap((week) => {
      if (!isRecord(week) || !Array.isArray(week.contributionDays)) {
        throw new TypeError("Invalid contribution week");
      }

      return week.contributionDays.map(parseContributionDay);
    });

  return { userCreatedAt, days };
}

export function includePublicContributionDays(
  calendar: ContributionCalendar,
  publicActiveDays: ReadonlySet<string>,
): ContributionCalendar {
  if (publicActiveDays.size === 0) {
    return calendar;
  }

  return {
    ...calendar,
    days: calendar.days.map((day) =>
      day.contributionCount === 0 && publicActiveDays.has(day.date)
        ? { ...day, contributionCount: 1 }
        : day,
    ),
  };
}
