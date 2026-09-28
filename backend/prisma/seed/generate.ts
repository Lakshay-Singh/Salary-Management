import { COUNTRIES, JOB_TITLES, type SeedCountry, type SeedJobTitle } from './data';

export interface SeedEmployee {
  fullName: string;
  jobTitle: string;
  countryCode: string;
  salary: number;
}

// Pay runs from 85% to 130% of the typical salary for the country and title
const MIN_FACTOR = 0.85;
const MAX_FACTOR = 1.3;
const ROUND_TO = 1_000;

/**
 * Mulberry32: a tiny seeded PRNG built only from 32-bit integer operations,
 * so the same seed yields the same sequence on every machine and Node version (unlike Math.random).
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roundToNearest = (value: number) => Math.round(value / ROUND_TO) * ROUND_TO;

export function salaryBand(country: SeedCountry, jobTitle: SeedJobTitle): { min: number; max: number } {
  const typical = country.softwareEngineerSalary * jobTitle.salaryMultiplier;
  return { min: roundToNearest(typical * MIN_FACTOR), max: roundToNearest(typical * MAX_FACTOR) };
}

function pickWeighted<T extends { headcountWeight: number }>(items: readonly T[], random: () => number): T {
  const candidates = items.filter((item) => item.headcountWeight > 0);
  let remaining = random() * candidates.reduce((sum, item) => sum + item.headcountWeight, 0);
  for (const candidate of candidates) {
    remaining -= candidate.headcountWeight;
    if (remaining < 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

const pickOne = <T>(items: readonly T[], random: () => number): T => items[Math.floor(random() * items.length)];

/** Deterministic: the same count and seed always produce the same employees, in the same order. */
export function generateEmployees(count: number, seed: number): SeedEmployee[] {
  const random = mulberry32(seed);

  return Array.from({ length: count }, () => {
    const country = pickWeighted(COUNTRIES, random);
    const jobTitle = pickWeighted(JOB_TITLES, random);
    const firstName = pickOne(country.firstNames, random);
    const lastName = pickOne(country.lastNames, random);
    // Squaring skews pay towards the bottom of the band with a long tail above, as real pay does,
    // so a country's median sits below its average
    const position = random() ** 2;
    const typical = country.softwareEngineerSalary * jobTitle.salaryMultiplier;

    return {
      fullName: `${firstName} ${lastName}`,
      jobTitle: jobTitle.title,
      countryCode: country.code,
      salary: roundToNearest(typical * (MIN_FACTOR + (MAX_FACTOR - MIN_FACTOR) * position)),
    };
  });
}
