# Configuration Grok (xAI)

L'optimisation IA des tournées utilise **Grok** via l'API xAI (compatible OpenAI).
Si `GROQ_API_KEY` est aussi définie, Groq sert de solution de secours en cas d'erreur Grok.

## Obtenir votre clé API

1. Allez sur **https://console.x.ai** et connectez-vous
2. Ajoutez des crédits si nécessaire (l'API xAI est payante à l'usage)
3. Menu **API Keys** → **Create API Key**, puis copiez la clé (commence par `xai-...`)

## Ajouter la clé dans le projet

Dans le fichier `.env` à la racine (et dans les variables d'environnement Vercel en production) :

```bash
XAI_API_KEY="xai-...votre-cle-ici"
# Optionnel : changer de modèle (défaut : grok-4.3)
# GROK_MODEL="grok-4.3"
```

Redémarrez ensuite le serveur.

## Vérification

Connecté à l'application, ouvrez `/api/test-ia` : la réponse doit contenir `"ok": true` et `"provider": "Grok"`.

## Utilisation

Page **Tournées** → configurez votre tournée → **Optimiser la tournée**.
