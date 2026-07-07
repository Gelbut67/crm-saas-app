// Utilitaires pour calculer le lundi de la semaine (semaine ISO, lundi -> dimanche)
export function getLundiSemaine(date: Date): Date {
  const d = new Date(date)
  const jour = d.getDay() // 0 = dimanche, 1 = lundi, ...
  const diff = d.getDate() - jour + (jour === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getDimancheSemaine(lundi: Date): Date {
  const d = new Date(lundi)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}
