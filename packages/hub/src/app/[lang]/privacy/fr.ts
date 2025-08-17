import { HUB_URL } from "@/const"

const msg = `
Cette Politique de Confidentialité décrit comment les informations des utilisateurs sont traitées dans Selection Command Hub (ci-après dénommé "le Service"). En utilisant le Service, vous êtes réputé avoir accepté cette Politique de Confidentialité.

## **1. Informations Collectées**

Le Service collecte les types d'informations suivants :

### **1-1. Informations de Commande Publiées par les Utilisateurs**
Le Service collecte les informations de commande publiées par les utilisateurs (par exemple, noms de commande, URLs, descriptions).  
Pour plus de détails sur les paramètres, veuillez consulter les [Conditions d'Utilisation](${HUB_URL}/fr/terms).  
*Note : Ces informations ne sont utilisées que lorsque les utilisateurs publient ou récupèrent des données dans le Service.*

### **1-2. Données d'Utilisation**
Le Service utilise Google Analytics pour collecter des données d'utilisation anonymisées. Ces données comprennent :
- Historique des interactions (par exemple, transitions de page, emplacements et nombre de clics)
- Informations sur l'appareil (par exemple, type de navigateur, système d'exploitation)
- Horodatages d'accès
- Adresses IP source (traitées pour l'anonymisation)
- Autres données statistiques anonymisées fournies par Google Analytics

### **1-3. Collecte d'Informations Personnelles**
Comme le Service ne propose pas de fonctionnalités d'inscription ou de connexion, il ne collecte aucune information personnellement identifiable (par exemple, noms, adresses e-mail, adresses physiques).

## **2. Objectif de l'Utilisation des Informations**

Les informations collectées sont utilisées aux fins suivantes :
1. Analyser et améliorer l'utilisation du Service
2. Fournir les fonctionnalités nécessaires au fonctionnement du Service

## **3. Gestion des Informations**

Le Service gère de manière appropriée les informations collectées pour prévenir tout accès non autorisé ou violation de données. Les données collectées via Google Analytics sont gérées conformément à la [Politique de Confidentialité de Google](https://www.google.com/analytics/terms/us.html).

## **4. Communication à des Tiers**

Le Service ne communique pas les informations collectées à des tiers, sauf si la loi l'exige. Cependant, les données collectées via Google Analytics sont traitées par Google.

## **5. Utilisation des Cookies**

Le Service utilise des cookies via Google Analytics. Les cookies sont stockés dans les navigateurs des utilisateurs et sont utilisés pour améliorer les fonctionnalités et analyser le comportement des utilisateurs dans le Service. Les utilisateurs peuvent désactiver les cookies via les paramètres de leur navigateur ; cependant, certaines fonctionnalités peuvent ne pas fonctionner correctement en conséquence.

## **6. Modifications de la Politique de Confidentialité**

Cette Politique de Confidentialité peut être mise à jour si nécessaire. La politique révisée entrera en vigueur dès sa publication sur cette page.

## **7. Informations de Contact**

Pour toute question concernant cette Politique de Confidentialité, veuillez nous contacter via :
- [Page d'Assistance du Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

En vigueur à partir du 01/10/2025
`
export default msg
