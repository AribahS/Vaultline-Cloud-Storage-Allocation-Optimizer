export function formatSize(bytes: number): string;
export function formatDateDmy(timestamp: number): string;
export function formatScore(value: number): string;
export function pluralize(count: number, singular: string, plural?: string, formatter?: (value: number) => string): string;
