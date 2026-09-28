interface ErrorBody {
  error: { code: string; details?: { field: string }[] };
}

/** Field names a 400 response rejected, sorted so tests don't depend on the order validation reports them. */
export const invalidFields = (body: ErrorBody): string[] =>
  (body.error.details ?? []).map((detail) => detail.field).sort();
