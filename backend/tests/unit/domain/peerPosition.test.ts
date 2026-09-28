import { peerLabel } from '../../../src/domain/peerPosition';

const PEER_AVERAGE = 100_000;

const averageOf = (...salaries: number[]) => salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;

describe('peerLabel', () => {
  describe('with fewer than 3 peers', () => {
    it('returns "Not enough peers" when there are no peers', () => {
      expect(peerLabel(100_000, 0, 0)).toBe('Not enough peers');
    });

    it('returns "Not enough peers" for 2 peers, however far the salary is from their average', () => {
      expect(peerLabel(200_000, PEER_AVERAGE, 2)).toBe('Not enough peers');
    });
  });

  describe('with at least 3 peers', () => {
    it('returns "At average" when the salary equals the peer average', () => {
      expect(peerLabel(100_000, PEER_AVERAGE, 3)).toBe('At average');
    });

    it('returns "At average" when the salary is exactly 5% above the peer average', () => {
      expect(peerLabel(105_000, PEER_AVERAGE, 3)).toBe('At average');
    });

    it('returns "At average" when the salary is exactly 5% below the peer average', () => {
      expect(peerLabel(95_000, PEER_AVERAGE, 3)).toBe('At average');
    });

    it('returns "Above average" when the salary is just over 5% above the peer average', () => {
      expect(peerLabel(105_001, PEER_AVERAGE, 3)).toBe('Above average');
    });

    it('returns "Below average" when the salary is just over 5% below the peer average', () => {
      expect(peerLabel(94_999, PEER_AVERAGE, 3)).toBe('Below average');
    });

    it('returns "Above average" for a salary well above the average of a large peer group', () => {
      expect(peerLabel(150_000, PEER_AVERAGE, 250)).toBe('Above average');
    });
  });

  describe('with a fractional peer average', () => {
    it('compares against the exact average: 95,000 is more than 5% below an average of 100,000.33', () => {
      expect(peerLabel(95_000, averageOf(100_000, 100_000, 100_001), 3)).toBe('Below average');
    });

    it('compares against the exact average: 105,000 is more than 5% above an average of 99,999.67', () => {
      expect(peerLabel(105_000, averageOf(99_999, 100_000, 100_000), 3)).toBe('Above average');
    });
  });
});
