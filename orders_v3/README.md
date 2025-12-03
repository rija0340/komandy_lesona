# Komandin'ny Lesona S.S - v3

## 📋 Description

Système de gestion des commandes de publications pour le Sabbat School (École du Sabbat). Cette version consolidée combine les meilleures fonctionnalités des versions précédentes (`orders_deepseek.html` et `orders_glm.html`) avec un design moderne et professionnel.

## ✨ Fonctionnalités Principales

### 📊 Dashboard et Statistiques
- **Cartes de statistiques** affichant:
  - Total des personnes
  - Nombre total de commandes
  - Total des articles commandés
  - Montant total en Ariary (Ar)
- **Mise à jour en temps réel** lors des modifications

### 👥 Gestion des Personnes
- ✅ Ajout de nouvelles personnes
- ✅ Modification des informations
- ✅ Suppression avec confirmation
- ✅ Sélection multiple pour export/affichage groupé
- ✅ Recherche en temps réel par nom

### 📦 Gestion des Commandes
- ✅ **Interface par accordéon** organisée par catégories
- ✅ **Contrôles de quantité** avec boutons +/- et saisie directe
- ✅ **Calcul automatique** des totaux par personne et global
- ✅ **Recherche d'articles** dans le modal de commande
- ✅ **Résumé par catégorie** montrant le nombre d'articles sélectionnés

### 📱 Responsive Design
- ✅ **Vue Desktop**: Tableau complet avec toutes les colonnes (Quantité, Prix unitaire, Total)
- ✅ **Vue Mobile**: Cartes optimisées avec informations condensées
- ✅ **Transitions fluides** entre les vues

### 💾 Import/Export de Données
- ✅ **Export Excel** (.xlsx) avec feuilles multiples
- ✅ **Export PNG** des commandes sélectionnées (html2canvas)
- ✅ **Export JSON** pour sauvegarde complète
- ✅ **Import JSON** pour restauration
- ✅ **Sauvegarde automatique** dans localStorage
- ✅ **Impression** des commandes sélectionnées

### 🎨 Interface Utilisateur
- ✅ **Design moderne** avec gradients et ombres
- ✅ **Animations fluides** (fade in, slide up, scale)
- ✅ **Toast notifications** pour feedback utilisateur
- ✅ **Loading overlay** pendant les opérations
- ✅ **Modals élégants** avec backdrop blur
- ✅ **Boutons colorés** avec états hover

### 📚 Catégories de Publications

#### Publications Principales
- **Lehibe** (Adultes) - MG: GM/PM/TRA, FR: LESONA, EN: STANDARD
- **Tanora Zokiny** (19-35 ans) - MG: GM/TRA, FR: LSN, EN: INVERSE
- **Zatovo** (13-18 ans) - MG: GM/PM, FR: ADO, EN: CRN/RTF
- **Tanora Zandriny** (9-12 ans) - MG: GM/TRA, FR: PRE-ADO, EN: FOCUSPOINT

#### Enfants
- **Ankizy Kely** (5-8 ans) - MG: GM/STIMULANT/TRA, FR: PRIMAIRE
- **Zaza Bodo** (4 ans) - MG: GM/STIMULANT, FR: JARDIN, EN: KGT
- **Zazakely** (1-3 ans) - MG: GM/STIMULANT, FR: DEBUTANT, EN: BEGINNER
- **Zaza Minono** (0-12 mois) - MG: GM/STIMULANT, FR: BEBES, EN: BABIES

#### Autres
- **Mofon'aina** - MG: GM/PM
- **Lehibe/Mofonaina (PACK)** - MG: GM/PM
- **Manao Dingana** - MG: 1/2
- **Accessoires** - SARINTANY, REJISTRA

## 🛠️ Technologies Utilisées

- **HTML5** - Structure sémantique
- **CSS3** - Styles avec variables CSS et animations
- **JavaScript (Vanilla)** - Logique métier sans framework
- **TailwindCSS** (CDN) - Utilities CSS
- **Font Awesome** - Icônes
- **SheetJS (xlsx)** - Export Excel
- **html2canvas** - Export PNG
- **localStorage** - Persistance des données

## 📂 Structure du Projet

```
orders_v3/
├── index.html      # Structure HTML principale
├── styles.css      # Styles CSS personnalisés
├── app.js          # Logique JavaScript
└── README.md       # Documentation
```

## 🚀 Installation et Utilisation

### Prérequis
Un navigateur web moderne (Chrome, Firefox, Edge, Safari)

### Lancement
1. Ouvrir `index.html` dans un navigateur web
2. Les données sont automatiquement chargées depuis localStorage
3. Si aucune donnée n'existe, des données d'exemple sont initialisées

### Utilisation
1. **Ajouter une personne**: Cliquer sur "Ajouter Personne"
2. **Créer une commande**: Cliquer sur le bouton "Modifier" d'une personne
3. **Ajuster les quantités**: Utiliser les boutons +/- ou saisir directement
4. **Valider**: Cliquer sur "Valider" pour enregistrer
5. **Sélectionner**: Cocher les personnes pour export groupé
6. **Exporter**: Choisir Excel, PNG ou JSON selon le besoin

## 💡 Fonctionnalités Avancées

### Calculs Automatiques
- **Total par personne**: Somme de tous les articles commandés
- **Total général**: Somme de toutes les commandes
- **Totaux de colonnes**: Quantités totales par article
- **Statistiques globales**: Mise à jour en temps réel

### Recherche et Filtres
- **Recherche principale**: Filtre les personnes par nom
- **Recherche dans commande**: Filtre les articles disponibles
- **Recherche dans sélection**: Filtre les commandes sélectionnées

### Sauvegarde et Sécurité
- **Auto-sauvegarde**: À chaque modification
- **Export régulier**: Recommandé pour backup
- **Restauration**: Import JSON pour récupération

## 🎯 Différences avec les Versions Précédentes

### Par rapport à `orders_deepseek.html`
- ✨ Ajout des cartes de statistiques
- ✨ Design plus moderne et professionnel
- ✨ Meilleure organisation du code (fichiers séparés)
- ✨ Plus de couleurs et d'animations
- ✨ Meilleure structure des modals

### Par rapport à `orders_glm.html`
- ✨ Conserve le design moderne
- ✨ Simplifié (pas d'onglets multiples)
- ✨ Focus sur les commandes (fonctionnalité principale)
- ✨ Plus de données d'exemple pertinentes
- ✨ Export PNG fonctionnel

## 📱 Compatibilité

- ✅ Chrome/Edge (dernières versions)
- ✅ Firefox (dernières versions)
- ✅ Safari (dernières versions)
- ✅ Mobile (iOS Safari, Chrome Mobile)

## 🔧 Configuration

Les prix et catégories peuvent être modifiés dans `app.js`:
- Fonction `initializeSampleData()` (ligne ~176)
- Modifier la structure `appState.data.categories`

## 📝 Notes

- Les données sont stockées localement dans le navigateur
- Exporter régulièrement en JSON pour ne pas perdre les données
- Compatible avec l'impression (Ctrl+P / Cmd+P)
- Les calculs sont faits en temps réel côté client

## 🙏 Support

Pour toute question ou suggestion, veuillez créer une issue sur le dépôt GitHub.

---

**Version**: 3.0  
**Dernière mise à jour**: Décembre 2025  
**Licence**: MIT
