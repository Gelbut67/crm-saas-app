# 🤖 Configuration Google Gemini (GRATUIT)

## Pourquoi Gemini ?

- ✅ **100% GRATUIT** (pas de carte bancaire requise)
- ✅ Quota généreux : 60 requêtes/minute
- ✅ Excellent pour l'optimisation logistique
- ✅ Rapide et performant

## 📝 Obtenir votre clé API (2 minutes)

### Étape 1 : Créer un compte Google AI Studio

1. Allez sur : **https://makersuite.google.com/app/apikey**
2. Connectez-vous avec votre compte Google
3. Acceptez les conditions d'utilisation

### Étape 2 : Générer une clé API

1. Cliquez sur **"Create API Key"**
2. Sélectionnez un projet Google Cloud (ou créez-en un nouveau)
3. Copiez la clé générée (commence par `AIza...`)

### Étape 3 : Ajouter la clé dans votre projet

1. Ouvrez le fichier `.env` à la racine du projet
2. Ajoutez cette ligne :

```bash
GEMINI_API_KEY="AIza...votre-cle-ici"
```

3. Sauvegardez le fichier
4. Redémarrez votre serveur de développement

## ✅ Vérification

L'optimisation IA sera automatiquement activée dès que vous :
- Ajoutez la clé dans `.env`
- Redémarrez le serveur

## 🎯 Utilisation

Allez sur la page **Tournées** et :
1. Définissez vos RDV fixes (optionnel)
2. Configurez votre tournée
3. Cliquez sur **"Optimiser la tournée"**

L'IA Gemini analysera vos contraintes et générera l'itinéraire optimal ! 🚀

## 📊 Limites gratuites

- **60 requêtes par minute**
- **1500 requêtes par jour**
- Largement suffisant pour une utilisation normale !

## 🔒 Sécurité

- Ne partagez JAMAIS votre clé API
- Le fichier `.env` est dans `.gitignore` (non versionné)
- La clé reste sur votre serveur uniquement

## ❓ Problèmes ?

Si l'optimisation ne fonctionne pas :
1. Vérifiez que la clé est bien dans `.env`
2. Vérifiez qu'il n'y a pas d'espaces avant/après la clé
3. Redémarrez le serveur
4. Consultez les logs de la console

## 🔄 Fallback

Si Gemini n'est pas disponible, l'application utilisera automatiquement l'algorithme classique (sans IA).
