export class InvalidRutError extends Error {
  constructor() {
    super('Invalid RUT');
    this.name = 'InvalidRutError';
  }
}

export class Rut {
  private constructor(private readonly value: string) {}

  static create(input: string): Rut {
    const compact = input.replace(/[.\s]/g, '').toUpperCase();
    const normalized = compact.replace(/-/g, '');

    if (!/^\d{7,8}[0-9K]$/.test(normalized)) {
      throw new InvalidRutError();
    }

    const body = normalized.slice(0, -1);
    const verifier = normalized.at(-1);

    if (verifier === undefined || Rut.calculateVerifier(body) !== verifier) {
      throw new InvalidRutError();
    }

    return new Rut(`${body}-${verifier}`);
  }

  canonical(): string {
    return this.value;
  }

  formatted(): string {
    const [body, verifier] = this.value.split('-');
    const withThousands = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${withThousands}-${verifier}`;
  }

  equals(other: Rut): boolean {
    return this.value === other.value;
  }

  private static calculateVerifier(body: string): string {
    let multiplier = 2;
    let sum = 0;

    for (let index = body.length - 1; index >= 0; index -= 1) {
      sum += Number(body[index]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = 11 - (sum % 11);
    if (remainder === 11) return '0';
    if (remainder === 10) return 'K';
    return String(remainder);
  }
}
