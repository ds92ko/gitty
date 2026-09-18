import {
  GITHUB_CONTRIBUTIONS_REVALIDATE_SECONDS,
  GitHubApiError,
  getContributionDateRange,
} from "./fetch-contribution-calendar";

const GITHUB_CONTRIBUTIONS_URL = "https://github.com/users";
const PUBLIC_CONTRIBUTIONS_TIMEOUT_MS = 3000;
const CONTRIBUTION_DAY_TAG_PATTERN =
  /<(?:td|rect)\b[^>]*\bdata-date="[^"]+"[^>]*>/g;
const CONTRIBUTION_DATE_PATTERN = /\bdata-date="(\d{4}-\d{2}-\d{2})"/;
const CONTRIBUTION_LEVEL_PATTERN = /\bdata-level="([0-4])"/;

interface ContributionDateRange {
  from: string;
  to: string;
}

function getContributionYears({ from, to }: ContributionDateRange) {
  const firstYear = Number(from.slice(0, 4));
  const lastYear = Number(to.slice(0, 4));

  return Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => firstYear + index,
  );
}

function parseActiveContributionDays(
  value: string,
  range: ContributionDateRange,
) {
  const activeDays = new Set<string>();
  let parsedDayCount = 0;

  for (const match of value.matchAll(CONTRIBUTION_DAY_TAG_PATTERN)) {
    const date = CONTRIBUTION_DATE_PATTERN.exec(match[0])?.[1];
    const levelValue = CONTRIBUTION_LEVEL_PATTERN.exec(match[0])?.[1];

    if (!date || levelValue === undefined) {
      continue;
    }

    parsedDayCount += 1;

    if (
      date >= range.from &&
      date <= range.to &&
      Number(levelValue) > 0
    ) {
      activeDays.add(date);
    }
  }

  if (parsedDayCount === 0) {
    throw new GitHubApiError(
      "GitHub contribution page returned an unsupported format",
      502,
    );
  }

  return activeDays;
}

async function fetchContributionYear(
  username: string,
  year: number,
  range: ContributionDateRange,
) {
  const query = new URLSearchParams({
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  });
  const response = await fetch(
    `${GITHUB_CONTRIBUTIONS_URL}/${encodeURIComponent(username)}/contributions?${query}`,
    {
      cache: "force-cache",
      headers: {
        Accept: "text/html",
        "User-Agent": "Gitty",
      },
      next: { revalidate: GITHUB_CONTRIBUTIONS_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(PUBLIC_CONTRIBUTIONS_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new GitHubApiError(
      `GitHub contribution page request failed with status ${response.status}`,
      response.status,
    );
  }

  return parseActiveContributionDays(await response.text(), range);
}

export async function fetchPublicContributionDays(
  username: string,
  now = new Date(),
) {
  if (Number.isNaN(now.getTime())) {
    throw new TypeError("Expected now to be a valid date");
  }

  const dateRange = getContributionDateRange(now);
  const range = {
    from: dateRange.from.slice(0, 10),
    to: dateRange.to.slice(0, 10),
  };
  const years = getContributionYears(range);
  const results = await Promise.allSettled(
    years.map((year) =>
      fetchContributionYear(username, year, range),
    ),
  );
  const activeDays = new Set<string>();

  if (results.every((result) => result.status === "rejected")) {
    throw results[0].reason;
  }

  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") {
      for (const day of result.value) {
        activeDays.add(day);
      }
    } else {
      console.warn(
        `Failed to fetch publicly visible GitHub contribution days for ${years[index]}`,
        result.reason,
      );
    }
  }

  return activeDays;
}
