export type PeerLabel = 'Not enough peers' | 'Below average' | 'At average' | 'Above average';

const MIN_PEERS = 3;
const LOWER_BOUND_RATIO = 0.95;
const UPPER_BOUND_RATIO = 1.05;

/** Where a salary sits against its peers (same country and job title). Within 5% either side of their average, inclusive, is "At average". */
export function peerLabel(salary: number, peerAvg: number, peerCount: number): PeerLabel {
  if (peerCount < MIN_PEERS) return 'Not enough peers';
  if (salary > peerAvg * UPPER_BOUND_RATIO) return 'Above average';
  if (salary < peerAvg * LOWER_BOUND_RATIO) return 'Below average';
  return 'At average';
}

/** How far a salary is from the peer average, as a signed percentage rounded to one decimal place (e.g. 19.6, -15). Halves round away from zero. */
export function percentageDifference(salary: number, peerAvg: number): number {
  const percent = ((salary - peerAvg) / peerAvg) * 100;
  const rounded = Math.sign(percent) * (Math.round(Math.abs(percent) * 10) / 10);
  return rounded + 0; // -0 + 0 is 0, while NaN stays NaN rather than being hidden
}
