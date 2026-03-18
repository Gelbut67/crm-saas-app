"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Bell, 
  X, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText
} from "lucide-react"

export interface Notification {
  id: string
  type: "reminder" | "alert" | "success"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Charger les notifications depuis localStorage
    loadNotifications()
    
    // Écouter les mises à jour de notifications
    const handleNotificationsUpdated = (event: CustomEvent) => {
      setNotifications(event.detail)
    }
    
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated as EventListener)
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated as EventListener)
    }
  }, [])

  const loadNotifications = () => {
    try {
      const savedNotifications = localStorage.getItem('notifications')
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
        setNotifications(parsedNotifications)
      } else {
        // Utiliser les notifications par défaut seulement si rien n'est sauvegardé
        const initialNotifications: Notification[] = [
          {
            id: "1",
            type: "reminder",
            title: "Rappel : Devis à relancer",
            message: "Le devis 'Application Mobile iOS' pour Marie Martin n'a pas eu de réponse depuis 7 jours",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 heures ago
            read: false,
            actionUrl: "/devis/2",
            actionLabel: "Voir le devis"
          },
          {
            id: "2",
            type: "alert",
            title: "Échéance imminente",
            message: "Le devis 'Maintenance Annuelle' expire dans 3 jours",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 heures ago
            read: false,
            actionUrl: "/devis/3",
            actionLabel: "Voir le devis"
          },
          {
            id: "3",
            type: "success",
            title: "Nouveau client ajouté",
            message: "Sophie Petit a été ajoutée à votre base de clients",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 jour ago
            read: true,
            actionUrl: "/clients/4",
            actionLabel: "Voir le client"
          }
        ]
        setNotifications(initialNotifications)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
      // En cas d'erreur, utiliser les notifications par défaut
      setNotifications([])
    }
  }

  const saveNotifications = (updatedNotifications: Notification[]) => {
    try {
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notifications:", error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifications(updatedNotifications)
    saveNotifications(updatedNotifications)
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updatedNotifications)
    saveNotifications(updatedNotifications)
  }

  const removeNotification = (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id)
    setNotifications(updatedNotifications)
    saveNotifications(updatedNotifications)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "reminder":
        return "border-blue-200 bg-blue-50"
      case "alert":
        return "border-orange-200 bg-orange-50"
      case "success":
        return "border-green-200 bg-green-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    return "Il y a quelques minutes"
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            variant="destructive"
          >
            {unreadCount}
          </Badge>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-hidden shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Tout marquer comme lu
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                        !notification.read ? "bg-muted/50" : ""
                      } ${getNotificationColor(notification.type)}`}
                      onClick={() => {
                        markAsRead(notification.id)
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium truncate">
                              {notification.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            {notification.actionLabel && (
                              <Badge variant="outline" className="text-xs">
                                {notification.actionLabel}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Hook pour générer des rappels automatiques
export function useDevisReminders() {
  const [reminders, setReminders] = useState<Notification[]>([])

  const generateReminders = (devis: any[]) => {
    const today = new Date()
    const newReminders: Notification[] = []

    devis.forEach((devi) => {
      const creationDate = new Date(devi.dateCreation)
      const daysSinceCreation = Math.floor(
        (today.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Rappel après 7 jours pour les devis en cours sans réponse
      if (devi.statut === "en_cours" && daysSinceCreation === 7) {
        newReminders.push({
          id: `reminder-${devi.id}`,
          type: "reminder",
          title: "Rappel : Devis à relancer",
          message: `Le devis "${devi.titre}" pour ${devi.client.nom} n'a pas eu de réponse depuis 7 jours`,
          timestamp: new Date(),
          read: false,
          actionUrl: `/devis/${devi.id}`,
          actionLabel: "Relancer"
        })
      }

      // Alert pour échéance imminente (3 jours avant)
      if (devi.statut === "en_cours") {
        const echeanceDate = new Date(devi.dateEcheance)
        const daysUntilEcheance = Math.floor(
          (echeanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntilEcheance === 3) {
          newReminders.push({
            id: `echeance-${devi.id}`,
            type: "alert",
            title: "Échéance imminente",
            message: `Le devis "${devi.titre}" expire dans 3 jours`,
            timestamp: new Date(),
            read: false,
            actionUrl: `/devis/${devi.id}`,
            actionLabel: "Voir le devis"
          })
        }
      }
    })

    setReminders(newReminders)
    
    // Ajouter les rappels aux notifications existantes
    addNotifications(newReminders)
  }

  return { reminders, generateReminders }
}

// Fonction globale pour ajouter des notifications
export function addNotifications(newNotifications: Notification[]) {
  try {
    const savedNotifications = localStorage.getItem('notifications')
    let existingNotifications: Notification[] = []
    
    if (savedNotifications) {
      existingNotifications = JSON.parse(savedNotifications).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }))
    }
    
    // Éviter les doublons en vérifiant les IDs
    const filteredNewNotifications = newNotifications.filter(
      newNotif => !existingNotifications.some(existing => existing.id === newNotif.id)
    )
    
    const updatedNotifications = [...filteredNewNotifications, ...existingNotifications]
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
    
    // Déclencher un événement pour notifier les composants
    window.dispatchEvent(new CustomEvent('notificationsUpdated', { 
      detail: updatedNotifications 
    }))
  } catch (error) {
    console.error("Erreur lors de l'ajout des notifications:", error)
  }
}

// Fonction pour ajouter une seule notification
export function addNotification(notification: Notification) {
  addNotifications([notification])
}
