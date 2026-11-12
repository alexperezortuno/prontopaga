function allowedCharacters(value: string): string {
  return value.toUpperCase().replace(/[^0-9K]/g, '');
}

function formatBody(body: string): string {
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function splitRut(value: string): { body: string; verifier: string; hasSeparator: boolean } {
  const separatorIndex = value.indexOf('-');

  if (separatorIndex >= 0) {
    const body = value.slice(0, separatorIndex).replace(/[^0-9]/g, '').slice(0, 8);
    const verifier = allowedCharacters(value.slice(separatorIndex + 1)).charAt(0);
    return { body, verifier, hasSeparator: true };
  }

  const compact = allowedCharacters(value).slice(0, 9);
  if (compact.length > 8 && /^\d{8}/.test(compact)) {
    return { body: compact.slice(0, 8), verifier: compact.charAt(8), hasSeparator: false };
  }

  return { body: compact, verifier: '', hasSeparator: false };
}

export function formatRut(value: string): string {
  const { body, verifier, hasSeparator } = splitRut(value);
  const formattedBody = formatBody(body);

  if (hasSeparator) return `${formattedBody}-${verifier}`;
  if (verifier) return `${formattedBody}-${verifier}`;
  return formattedBody;
}

export function normalizeRut(value: string): string | null {
  const { body, verifier } = splitRut(value);
  if (!/^\d{7,8}$/.test(body) || !/^[0-9K]$/.test(verifier)) return null;

  return `${body}-${verifier}`;
}

export function isValidRut(value: string): boolean {
  const normalized = normalizeRut(value);
  if (!normalized) return false;

  const [body, verifier] = normalized.split('-');
  let multiplier = 2;
  let sum = 0;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return verifier === expected;
}

export function rutCaretPosition(formattedValue: string, meaningfulCharacters: number): number {
  if (meaningfulCharacters <= 0) return 0;

  let seen = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/[0-9K]/.test(formattedValue[index])) seen += 1;
    if (seen === meaningfulCharacters) return index + 1;
  }

  return formattedValue.length;
}
