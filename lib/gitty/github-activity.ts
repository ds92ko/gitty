export interface GitHubActivityDay {
  date: string;
  active: boolean;
}

export interface GitHubActivity {
  activeToday: boolean;
  activeDays7: number;
  activeDays30: number;
  activeDays90: number;
  activeDays180: number;
  daysSinceLastActivity: number;
  previousActivityGap: number | null;
  recentDays7: GitHubActivityDay[];
}
