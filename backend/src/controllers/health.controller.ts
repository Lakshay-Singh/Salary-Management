import type { RequestHandler } from 'express';

// Liveness only: it says the process is up, not that the database is reachable
export const getHealth: RequestHandler = (_req, res) => {
  res.status(200).json({ status: 'ok' });
};
