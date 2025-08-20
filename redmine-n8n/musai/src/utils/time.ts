export function formatNaturalTimestamp(timestamp: number): string
{
  const date = new Date(timestamp);
  const now = new Date();

  const sameDay = (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );

  const yesterdayRef = new Date(now);
  yesterdayRef.setDate(now.getDate() - 1);
  const yesterday = (
    date.getFullYear() === yesterdayRef.getFullYear() &&
    date.getMonth() === yesterdayRef.getMonth() &&
    date.getDate() === yesterdayRef.getDate()
  );

  const to12Hour = (d: Date): string =>
  {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const ordinal = (n: number) =>
  {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return (s as any)[(v - 20) % 10] || (s as any)[v] || s[0];
  };

  const time = to12Hour(date);
  if (sameDay) return `Today at ${time}`;
  if (yesterday) return `Yesterday at ${time}`;
  return `${monthNames[date.getMonth()]} ${day}${ordinal(day)}, ${date.getFullYear()} at ${time}`;
}


