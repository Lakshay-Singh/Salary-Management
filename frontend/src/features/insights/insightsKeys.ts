// Kept free of imports so other features (employee changes make insights stale) can use it without loading the API
export const insightsKeys = {
  all: ['insights'] as const,
  countries: ['insights', 'countries'] as const,
  jobTitles: (countryCode: string) => ['insights', 'job-titles', countryCode] as const,
}
