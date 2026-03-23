// Fonction pour générer un CSV côté client
export function generateCSV(data: any[], headers: { key: string; label: string }[]): string {
  const csvHeaders = headers.map(h => h.label).join(',')
  const csvRows = data.map(row => 
    headers.map(h => {
      const value = row[h.key]
      // Échapper les virgules et guillemets
      const stringValue = String(value || '').replace(/"/g, '""')
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

// Fonction pour télécharger un fichier
export function downloadFile(content: string | Blob, filename: string, mimeType?: string) {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: `${mimeType || 'text/csv'};charset=utf-8` })
    : content
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Types pour les exports
export interface Contact {
  id: string
  nom: string
  email?: string
  telephone?: string
  poste?: string
  isPrincipal?: boolean
  dateCreation: Date | string
}

export interface ClientExport {
  id: string
  nomEntreprise: string
  secteur?: string
  caTotal: number
  dateCreation: Date | string
  contacts: Contact[]
  adresse?: string
  ville?: string
  codePostal?: string
  departement?: string
}

export interface ProspectExport {
  id: string
  nomEntreprise: string
  secteur?: string
  dateCreation: Date | string
  contacts: Contact[]
  adresse?: string
  ville?: string
  codePostal?: string
  departement?: string
}

export interface DevisExport {
  id: string
  titre: string
  montant: number
  statut: string
  clientNom: string
  clientEntreprise?: string
  dateEcheance: Date | string
  dateCreation: Date | string
}

// Export clients vers CSV
export async function exportClientsToCSV(clients: ClientExport[]) {
  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'nomEntreprise', label: 'Entreprise' },
    { key: 'secteur', label: 'Secteur' },
    { key: 'adresse', label: 'Adresse' },
    { key: 'codePostal', label: 'Code Postal' },
    { key: 'ville', label: 'Ville' },
    { key: 'departement', label: 'Département' },
    { key: 'caTotal', label: 'CA Total' },
    { key: 'dateCreation', label: 'Date de création' },
    { key: 'contactPrincipal', label: 'Contact Principal' },
    { key: 'emailPrincipal', label: 'Email Principal' },
    { key: 'telephonePrincipal', label: 'Téléphone Principal' }
  ]

  // Transformer les données pour l'export
  const exportData = clients.map(client => ({
    ...client,
    contactPrincipal: client.contacts.find(c => c.isPrincipal)?.nom || '',
    emailPrincipal: client.contacts.find(c => c.isPrincipal)?.email || '',
    telephonePrincipal: client.contacts.find(c => c.isPrincipal)?.telephone || ''
  }))

  const csvContent = generateCSV(exportData, headers)
  downloadFile(csvContent, 'clients_export.csv', 'text/csv')
}

// Export devis vers CSV
export async function exportDevisToCSV(devis: DevisExport[]) {
  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'titre', label: 'Titre' },
    { key: 'montant', label: 'Montant' },
    { key: 'statut', label: 'Statut' },
    { key: 'clientNom', label: 'Client' },
    { key: 'clientEntreprise', label: 'Entreprise' },
    { key: 'dateEcheance', label: 'Date d\'échéance' },
    { key: 'dateCreation', label: 'Date de création' }
  ]

  const csvContent = generateCSV(devis, headers)
  downloadFile(csvContent, 'devis_export.csv', 'text/csv')
}

// Export clients vers Excel (simplifié)
export async function exportClientsToExcel(clients: ClientExport[]) {
  // Créer un tableau HTML qui peut être ouvert dans Excel
  const headers = ['ID', 'Entreprise', 'Secteur', 'Adresse', 'Code Postal', 'Ville', 'Département', 'CA Total', 'Date de création', 'Contact Principal', 'Email Principal', 'Téléphone Principal']
  const rows = clients.map(client => {
    const principalContact = client.contacts.find(c => c.isPrincipal)
    return [
      client.id,
      client.nomEntreprise,
      client.secteur || '',
      client.adresse || '',
      client.codePostal || '',
      client.ville || '',
      client.departement || '',
      client.caTotal,
      new Date(client.dateCreation).toLocaleDateString('fr-FR'),
      principalContact?.nom || '',
      principalContact?.email || '',
      principalContact?.telephone || ''
    ]
  })

  const htmlContent = `
    <table>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
    </table>
  `

  downloadFile(htmlContent, 'clients_export.xls', 'application/vnd.ms-excel')
}

// Export prospects vers CSV
export async function exportProspectsToCSV(prospects: ProspectExport[]) {
  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'nomEntreprise', label: 'Entreprise' },
    { key: 'secteur', label: 'Secteur' },
    { key: 'adresse', label: 'Adresse' },
    { key: 'codePostal', label: 'Code Postal' },
    { key: 'ville', label: 'Ville' },
    { key: 'departement', label: 'Département' },
    { key: 'dateCreation', label: 'Date de création' },
    { key: 'contactPrincipal', label: 'Contact Principal' },
    { key: 'emailPrincipal', label: 'Email Principal' },
    { key: 'telephonePrincipal', label: 'Téléphone Principal' }
  ]

  // Transformer les données pour l'export
  const exportData = prospects.map(prospect => ({
    ...prospect,
    contactPrincipal: prospect.contacts.find(c => c.isPrincipal)?.nom || '',
    emailPrincipal: prospect.contacts.find(c => c.isPrincipal)?.email || '',
    telephonePrincipal: prospect.contacts.find(c => c.isPrincipal)?.telephone || ''
  }))

  const csvContent = generateCSV(exportData, headers)
  downloadFile(csvContent, 'prospects_export.csv', 'text/csv')
}

// Export prospects vers Excel (simplifié)
export async function exportProspectsToExcel(prospects: ProspectExport[]) {
  const headers = ['ID', 'Entreprise', 'Secteur', 'Adresse', 'Code Postal', 'Ville', 'Département', 'Date de création', 'Contact Principal', 'Email Principal', 'Téléphone Principal']
  const rows = prospects.map(prospect => {
    const principalContact = prospect.contacts.find(c => c.isPrincipal)
    return [
      prospect.id,
      prospect.nomEntreprise,
      prospect.secteur || '',
      prospect.adresse || '',
      prospect.codePostal || '',
      prospect.ville || '',
      prospect.departement || '',
      new Date(prospect.dateCreation).toLocaleDateString('fr-FR'),
      principalContact?.nom || '',
      principalContact?.email || '',
      principalContact?.telephone || ''
    ]
  })

  const htmlContent = `
    <table>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
    </table>
  `

  downloadFile(htmlContent, 'prospects_export.xls', 'application/vnd.ms-excel')
}

// Export devis vers Excel (simplifié)
export async function exportDevisToExcel(devis: DevisExport[]) {
  const headers = ['ID', 'Titre', 'Montant', 'Statut', 'Client', 'Entreprise', 'Date d\'échéance', 'Date de création']
  const rows = devis.map(devi => [
    devi.id,
    devi.titre,
    devi.montant,
    devi.statut,
    devi.clientNom,
    devi.clientEntreprise || '',
    new Date(devi.dateEcheance).toLocaleDateString('fr-FR'),
    new Date(devi.dateCreation).toLocaleDateString('fr-FR')
  ])

  const htmlContent = `
    <table>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
    </table>
  `

  downloadFile(htmlContent, 'devis_export.xls', 'application/vnd.ms-excel')
}
