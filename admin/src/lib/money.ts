const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function parseBRLToCents(input: string): number {
  const value = input.trim().replace(/\s/g, '');
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value;

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error('Informe um preço válido, com até duas casas decimais.');
  }

  const [reais, centavos = ''] = normalized.split('.');
  const cents = Number(reais) * 100 + Number(centavos.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) {
    throw new Error('O preço informado é muito alto.');
  }
  return cents;
}

export function formatCents(cents: number): string {
  return brl.format(cents / 100);
}

export function formatCentsInput(cents: number): string {
  const reais = Math.trunc(cents / 100);
  const centavos = Math.abs(cents % 100)
    .toString()
    .padStart(2, '0');
  return `${reais},${centavos}`;
}
