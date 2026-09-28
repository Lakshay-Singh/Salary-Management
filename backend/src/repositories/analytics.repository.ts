/** Salary figures are whole units of the country's own currency; average and median are rounded. */
export interface CountryStats {
  countryCode: string;
  currencyCode: string;
  headcount: number;
  min: number;
  max: number;
  average: number;
  median: number;
}

export interface JobTitleStats {
  jobTitle: string;
  headcount: number;
  min: number;
  average: number;
  max: number;
}

export interface AnalyticsRepository {
  /** One entry per country that has at least one employee, sorted by country code. */
  getCountryStats(): Promise<CountryStats[]>;
  /** One entry per job title in the country, sorted by title. Null when the country is not supported. */
  getJobTitleStats(countryCode: string): Promise<JobTitleStats[] | null>;
}
