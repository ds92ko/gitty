export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface ContributionCalendar {
  userCreatedAt: Date;
  days: ContributionDay[];
}
