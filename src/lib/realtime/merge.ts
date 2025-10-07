// lib/realtime/merge.ts

export function mergeRowUpsert<T extends { id: string }>(
  rows: T[],
  newRow: T
): T[] {
  const idx = rows.findIndex((r) => r.id === newRow.id);
  if (idx >= 0) {
    const updated = [...rows];
    updated[idx] = newRow;
    return updated;
  }
  return [...rows, newRow];
}

export function mergeRowDelete<T extends { id: string }>(
  rows: T[],
  deletedId: string
): T[] {
  return rows.filter((r) => r.id !== deletedId);
}
