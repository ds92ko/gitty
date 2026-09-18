import { afterEach, describe, expect, it, vi } from "vitest";

import { GitHubApiError } from "./fetch-contribution-calendar";
import { fetchPublicContributionDays } from "./fetch-public-contribution-days";

function contributionHtml(
  days: Array<{ date: string; level: number }>,
) {
  return days
    .map(
      ({ date, level }) =>
        `<td data-date="${date}" data-level="${level}"></td>`,
    )
    .join("");
}

function contributionResponse(
  days: Array<{ date: string; level: number }>,
) {
  return new Response(contributionHtml(days), { status: 200 });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchPublicContributionDays", () => {
  it("연도를 나눠 조회하고 요청한 365일 범위만 반환한다", async () => {
    const fetchMock = vi.fn((input: string | URL | Request) => {
      const url = new URL(String(input));
      const year = url.searchParams.get("from")?.slice(0, 4);

      if (year === "2025") {
        return Promise.resolve(
          contributionResponse([
            { date: "2025-09-19", level: 4 },
            { date: "2025-09-20", level: 2 },
          ]),
        );
      }

      return Promise.resolve(
        contributionResponse([
          { date: "2026-09-19", level: 1 },
          { date: "2026-09-20", level: 3 },
        ]),
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchPublicContributionDays("octocat", new Date("2026-09-19T12:00:00Z")),
    ).resolves.toEqual(new Set(["2025-09-20", "2026-09-19"]));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      expect.stringContaining("from=2025-01-01&to=2025-12-31"),
      expect.stringContaining("from=2026-01-01&to=2026-12-31"),
    ]);
  });

  it("한 연도 요청이 실패해도 성공한 연도의 결과를 유지한다", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const url = new URL(String(input));

        if (url.searchParams.get("from") === "2025-01-01") {
          return Promise.reject(new Error("request timed out"));
        }

        return Promise.resolve(
          contributionResponse([{ date: "2026-09-18", level: 4 }]),
        );
      }),
    );

    await expect(
      fetchPublicContributionDays("octocat", new Date("2026-09-19T12:00:00Z")),
    ).resolves.toEqual(new Set(["2026-09-18"]));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("2025"),
      expect.any(Error),
    );
  });

  it("모든 연도의 HTML 구조를 해석할 수 없으면 실패한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(new Response("<html>unexpected</html>", { status: 200 })),
      ),
    );

    await expect(
      fetchPublicContributionDays("octocat", new Date("2026-09-19T12:00:00Z")),
    ).rejects.toThrow(GitHubApiError);
  });
});
