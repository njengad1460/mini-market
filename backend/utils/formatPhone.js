export const formatPhone = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return undefined;

  const digits = raw.replace(/[^\d+]/g, '');

  if (digits.startsWith('+')) {
    return digits;
  }

  if (digits.startsWith('254')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+254${digits.slice(1)}`;
  }

  if (/^\d{9}$/.test(digits)) {
    return `+254${digits}`;
  }

  return digits;
};
