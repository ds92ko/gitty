import { describe, expect, it } from "vitest";

import { includePublicContributionDays } from "./parse-contribution-calendar";

describe("includePublicContributionDays", () => {
  it("GraphQL에서 비어 있는 공개 활성 날짜만 보완한다", () => {
    const userCreatedAt = new Date("2020-01-01T00:00:00Z");
    const calendar = {
      userCreatedAt,
      days: [
        { date: "2026-09-17", contributionCount: 3 },
        { date: "2026-09-18", contributionCount: 0 },
        { date: "2026-09-19", contributionCount: 0 },
      ],
    };

    const result = includePublicContributionDays(
      calendar,
      new Set(["2026-09-17", "2026-09-18"]),
    );

    expect(result).toEqual({
      userCreatedAt,
      days: [
        { date: "2026-09-17", contributionCount: 3 },
        { date: "2026-09-18", contributionCount: 1 },
        { date: "2026-09-19", contributionCount: 0 },
      ],
    });
  });
});
