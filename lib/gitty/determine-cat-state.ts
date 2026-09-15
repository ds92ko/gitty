import type { WidgetCatState } from "./cat-message";
import type { GitHubActivity } from "./github-activity";

type PositiveMetric =
  | "activeDays7"
  | "activeDays30"
  | "activeDays90"
  | "activeDays180";
type PositiveThreshold = Partial<Record<PositiveMetric, number>>;

const POSITIVE_THRESHOLDS = {
  coding: { activeDays7: 2 },
  happy: { activeDays7: 3, activeDays30: 8 },
  cheering: { activeDays7: 4, activeDays30: 12 },
  excited: { activeDays7: 5, activeDays30: 18 },
  proud: { activeDays7: 5, activeDays30: 18, activeDays90: 54 },
  love: {
    activeDays7: 5,
    activeDays30: 18,
    activeDays90: 54,
    activeDays180: 108,
  },
} as const;

const POSITIVE_STATE_RANK: Partial<Record<WidgetCatState, number>> = {
  normal: 0,
  coding: 1,
  happy: 2,
  cheering: 3,
  excited: 4,
  proud: 5,
  love: 6,
};

const MILESTONE_STATES = new Set<WidgetCatState>([
  "excited",
  "proud",
  "love",
]);
const PEEKING_ACTIVITY_GAP_DAYS = 30;

function meetsThreshold(
  activity: GitHubActivity,
  threshold: PositiveThreshold,
) {
  return Object.entries(threshold).every(([key, value]) => {
    const metric = activity[key as PositiveMetric];

    return metric >= value;
  });
}

function determinePositiveState(activity: GitHubActivity): WidgetCatState {
  if (meetsThreshold(activity, POSITIVE_THRESHOLDS.love)) {
    return "love";
  }

  if (meetsThreshold(activity, POSITIVE_THRESHOLDS.proud)) {
    return "proud";
  }

  if (meetsThreshold(activity, POSITIVE_THRESHOLDS.excited)) {
    return "excited";
  }

  if (meetsThreshold(activity, POSITIVE_THRESHOLDS.cheering)) {
    return "cheering";
  }

  if (meetsThreshold(activity, POSITIVE_THRESHOLDS.happy)) {
    return "happy";
  }

  if (meetsThreshold(activity, POSITIVE_THRESHOLDS.coding)) {
    return "coding";
  }

  return "normal";
}

function determineHungerState(
  daysSinceLastActivity: number,
): WidgetCatState {
  if (daysSinceLastActivity >= 30) {
    return "sleeping";
  }

  if (daysSinceLastActivity >= 14) {
    return "burned_out";
  }

  if (daysSinceLastActivity >= 10) {
    return "tired";
  }

  if (daysSinceLastActivity >= 7) {
    return "angry";
  }

  if (daysSinceLastActivity >= 5) {
    return "crying";
  }

  if (daysSinceLastActivity >= 3) {
    return "nervous";
  }

  return "waiting";
}

export function determineCatState(
  current: GitHubActivity,
  previous: GitHubActivity,
): WidgetCatState {
  if (!current.activeToday) {
    return determineHungerState(current.daysSinceLastActivity);
  }

  // Returning after a long absence takes priority over milestone celebrations.
  if (
    current.previousActivityGap !== null &&
    current.previousActivityGap >= PEEKING_ACTIVITY_GAP_DAYS
  ) {
    return "peeking";
  }

  const currentPositiveState = determinePositiveState(current);
  const previousPositiveState = determinePositiveState(previous);
  const currentRank = POSITIVE_STATE_RANK[currentPositiveState] ?? 0;
  const previousRank = POSITIVE_STATE_RANK[previousPositiveState] ?? 0;

  if (
    MILESTONE_STATES.has(currentPositiveState) &&
    currentRank > previousRank
  ) {
    return "celebrating";
  }

  return currentPositiveState;
}
