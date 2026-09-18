const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
export const GITHUB_CONTRIBUTIONS_REVALIDATE_SECONDS = 15 * 60;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const CONTRIBUTION_HISTORY_DAYS = 365;

const CONTRIBUTION_CALENDAR_QUERY = `
  query ContributionCalendar(
    $username: String!
    $from: DateTime!
    $to: DateTime!
  ) {
    user(login: $username) {
      createdAt
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getContributionDateRange(now: Date) {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return {
    from: new Date(
      today - (CONTRIBUTION_HISTORY_DAYS - 1) * DAY_IN_MILLISECONDS,
    ).toISOString(),
    to: new Date(today + DAY_IN_MILLISECONDS - 1).toISOString(),
  };
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export async function fetchContributionCalendar(
  username: string,
  now = new Date(),
): Promise<unknown> {
  if (Number.isNaN(now.getTime())) {
    throw new TypeError("Expected now to be a valid date");
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new GitHubApiError("GITHUB_TOKEN is not configured", 500);
  }

  const { from, to } = getContributionDateRange(now);
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    cache: "force-cache",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "Gitty",
    },
    body: JSON.stringify({
      query: CONTRIBUTION_CALENDAR_QUERY,
      variables: { username, from, to },
    }),
    next: { revalidate: GITHUB_CONTRIBUTIONS_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new GitHubApiError(
      `GitHub GraphQL request failed with status ${response.status}`,
      response.status,
    );
  }

  const value: unknown = await response.json();

  if (!isRecord(value)) {
    throw new GitHubApiError("GitHub GraphQL returned an invalid response", 502);
  }

  if (Array.isArray(value.errors) && value.errors.length > 0) {
    throw new GitHubApiError("GitHub GraphQL returned errors", 502);
  }

  return value;
}
