export function normalizeAction(action) {
  const normalized = action?.toLowerCase();
  if (normalized === 'edit') return 'update';
  if (normalized === 'read') return 'view';
  return normalized;
}