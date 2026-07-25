/** Parse boolean from JSON body, query strings, or numeric flags. */
export function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return undefined;
}

export function parseRequiredBoolean(value: unknown): boolean | undefined {
  const parsed = parseOptionalBoolean(value);
  return parsed;
}
