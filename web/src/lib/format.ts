/** Small display helpers shared by the screens. */

export const mmss = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
};
export const hm = (iso: string | null, locale?: string) =>
  iso ? new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';
export const dayName = (date: string, locale?: string) =>
  new Date(date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
export const todayLong = (locale?: string) =>
  new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
export function when(iso: string | null, locale?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = d.toDateString() === new Date().toDateString();
  return (today ? (locale === 'ur-PK' ? 'آج' : 'today') : d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })) + ' ' + hm(iso, locale);
}
export const prettyPhone = (p?: string) => (p ? p.replace(/^\+92(\d{3})(\d{7})$/, '+92 $1 $2') : '');
export const initials = (n: string) =>
  n.replace(/^(Mr|Mrs|Ms|Dr)\.\s*/, '').split(' ').map((w) => w[0]).join('').slice(0, 2);
