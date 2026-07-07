// Utilitaires pour calculer le lundi de la semaine (semaine ISO, lundi -> dimanche)
export function getLundiSemaine(date: Date): Date {
  const d = new Date(date)
  const jour = d.getUTCDay() // 0 = dimanche, 1 = lundi, ...
  const diff = d.getUTCDate() - jour + (jour === 0 ? -6 : 1)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff))
}

export function getDimancheSemaine(lundi: Date): Date {
  const d = new Date(lundi)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 6, 23, 59, 59, 999))
}
