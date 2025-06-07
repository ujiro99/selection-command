import { HUB_URL } from '@/const'

const msg = `
Ces Conditions d'Utilisation (ci-après dénommées les "Conditions") établissent les conditions d'utilisation du "Selection Command Hub" (ci-après dénommé le "Service") fourni par l'Opérateur (ci-après dénommé "nous"). Veuillez lire attentivement ces Conditions avant d'utiliser le Service. En utilisant le Service, vous êtes réputé avoir accepté ces Conditions.

## 1. Application
1. Ces Conditions s'appliquent à toutes les relations entre nous et les utilisateurs concernant l'utilisation du Service.
2. Toute règle ou directive établie séparément par nous concernant le Service constituera une partie de ces Conditions.

## 2. Description du Service
1. Le Service est lié à l'extension Chrome "Selection Command" et fournit les fonctionnalités suivantes :
   - La possibilité pour les utilisateurs de publier des commandes (ci-après dénommées "Données Publiées").
   - La possibilité pour les utilisateurs de consulter et de récupérer les commandes publiées par d'autres utilisateurs.
2. Les Données Publiées comprennent les informations suivantes :
   - Le titre d'une page web.
   - L'URL d'une page web.
   - L'icône d'une page web.
   - La description et la classification d'une commande.
   - Autres informations nécessaires à l'affichage d'une page web.
3. Le Service ne nécessite pas d'inscription d'utilisateur et peut être utilisé de manière anonyme.

## 3. Conduites Interdites
Les utilisateurs sont interdits de s'engager dans les activités suivantes lors de l'utilisation du Service :
- Actes qui violent les lois ou l'ordre public et les bonnes mœurs.
- Actes qui portent atteinte aux droits d'autrui (par exemple, droits d'auteur, marques déposées, droits à la vie privée).
- Fourniture d'informations fausses, inexactes ou nuisibles comme Données Publiées.
- Actes qui causent des dommages au Service ou à d'autres utilisateurs.
- Tout autre acte jugé inapproprié par nous.

## 4. Gestion des Données Publiées
1. Les utilisateurs sont seuls responsables de leurs Données Publiées. Une fois que les Données Publiées sont soumises, elles ne peuvent pas être modifiées ou supprimées, veuillez donc faire preuve de prudence lors de la publication de contenu.
2. Nous nous réservons le droit de supprimer ou de rendre privées les Données Publiées si nécessaire, mais n'y sommes pas obligés.
3. Si un tiers présente des réclamations pour violation de droits concernant les Données Publiées, nous pouvons modifier ou supprimer ces données à notre discrétion.
4. La reproduction, la duplication ou l'utilisation non autorisée des Données Publiées ou d'une partie du Service à des fins autres que l'utilisation du Service est interdite.

## 5. Droits de Propriété Intellectuelle et Permissions d'Utilisation
1. Tous les droits de propriété intellectuelle liés au Service appartiennent à nous ou aux propriétaires légitimes.
2. Les utilisateurs conservent la propriété de leurs Données Publiées mais sont réputés accorder la permission pour leur utilisation par d'autres dans les circonstances suivantes :
   - D'autres utilisateurs peuvent consulter, récupérer, utiliser, modifier et redistribuer les Données Publiées dans le cadre du Service.
   - Nous pouvons utiliser, publier, modifier et distribuer les Données Publiées selon les besoins pour exploiter le Service.

## 6. Clause de Non-Responsabilité
1. Nous ne garantissons pas que le Service répondra à des fins spécifiques, fournira une utilité ou assurera la sécurité pour les utilisateurs.
2. Nous ne sommes pas responsables des dommages ou des litiges découlant des Données Publiées ou de leur contenu.
3. Nous ne sommes pas non plus responsables des dommages résultant d'interruptions ou de la résiliation du Service.

## 7. Politique de Confidentialité
1. Le traitement des informations personnelles et des cookies liés à l'utilisation de ce service sera régi par la Politique de Confidentialité établie séparément par nous.
2. Pour plus de détails, veuillez consulter la page suivante :
   - [Politique de Confidentialité](${HUB_URL}/fr/privacy)

## 8. Suspension et Restrictions
1. Si un utilisateur viole ces Conditions, nous pouvons restreindre l'accès ou suspendre son utilisation du Service sans préavis.

## 9. Modifications et Résiliation
1. Nous nous réservons le droit de modifier ou de résilier ces Conditions et/ou le contenu du Service sans préavis.
2. L'utilisation continue du Service après que des modifications ont été apportées constitue l'acceptation des nouvelles Conditions.

## 10. Contact Support
Pour les demandes de renseignements ou les demandes de support concernant ce Service, veuillez nous contacter via :
- [Page de Support du Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

## 11. Loi Applicable et Juridiction
1. Ces Conditions seront régies par la loi japonaise.
2. En cas de litiges découlant de ces Conditions ou du Service, la juridiction exclusive sera celle des tribunaux du Japon.

En vigueur à partir du 01/10/2025
`
export default msg
