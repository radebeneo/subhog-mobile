export function normalizeProfileNamePart(value: string): string {
  return value.trim();
}

export function deriveProfileName(firstName: string, lastName: string): string {
  return [firstName, lastName]
    .map(normalizeProfileNamePart)
    .filter(Boolean)
    .join(" ");
}

export function isValidProfileName(firstName: string, lastName: string): boolean {
  return (
    normalizeProfileNamePart(firstName).length > 0 &&
    normalizeProfileNamePart(lastName).length > 0
  );
}
