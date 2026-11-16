const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const clock = (d: Date) => {
  const h = d.getHours();
  const m = d.getMinutes();
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

export function formatDrawWhen(value: string | Date | null | undefined, now = new Date()): string {
  if (!value) return 'a definir';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'a definir';
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, now)) return `hoje às ${clock(d)}`;
  if (sameDay(d, tomorrow)) return `amanhã às ${clock(d)}`;
  const day = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `${day} às ${clock(d)}`;
}

export function formatDay(value: string | Date | null | undefined): string {
  if (!value) return 'a definir';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'a definir';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
