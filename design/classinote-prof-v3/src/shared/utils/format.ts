export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatTime(timeStr: string): string {
  return timeStr;
}

export function getInitials(nom: string, prenom: string): string {
  return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
}

export function getGradeColor(note: number, sur: number): string {
  const pct = (note / sur) * 100;
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-rose-600';
}
