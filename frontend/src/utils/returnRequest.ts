export const RETURN_REASONS = [
  'Unused item — changed my mind',
  'Damaged in delivery',
  'Defective or not as described',
  'Wrong item received',
  'Opened food/treat — arrived damaged or incorrect',
  'Other',
] as const;

export function createReturnReference(now = new Date()): string {
  const day = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RET-${day}-${rand}`;
}

export function buildReturnIntakeMessage(input: {
  reference: string;
  orderNumber: string;
  reason: string;
  details: string;
}): string {
  return [
    `Return request ${input.reference}`,
    `Order number: ${input.orderNumber}`,
    `Reason: ${input.reason}`,
    input.details.trim() ? `Details: ${input.details.trim()}` : 'Details: (none)',
  ].join('\n');
}
