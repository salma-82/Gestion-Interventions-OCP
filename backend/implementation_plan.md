# Plan d'implémentation - Changement de mot de passe avec vérification par email

Ce plan décrit les modifications à apporter au backend (Spring Boot) et au frontend (React dans `gmao-app`) pour ajouter la fonctionnalité de changement de mot de passe sécurisé par e-mail pour tous les rôles de l'application GMAO OCP.

## 🛠️ Modifications du Backend (Spring Boot)

Le backend utilise déjà `spring-boot-starter-mail` et possède une configuration SMTP Gmail dans `application.properties`. Nous allons :
1. Sécuriser les endpoints de profil dans la configuration de sécurité.
2. Injecter `JavaMailSender` dans `AuthController` pour envoyer de réels e-mails au format HTML aux couleurs d'OCP (vert `#006633`).
3. Adapter l'endpoint `/api/auth/send-verification` pour qu'il envoie l'e-mail au lieu de renvoyer le code en clair dans la réponse (tout en écrivant le code dans la console du serveur pour faciliter les tests locaux).

### 1. Sécurité des Endpoints

Dans [SecurityConfig.java](file:///c:/Users/HP/Desktop/Gestion-Interventions-OCP/backend/intervention/src/main/java/com/ocp/intervention/security/SecurityConfig.java) :
Actuellement, tout `/api/auth/**` est public (`permitAll()`). Nous allons restreindre cela afin que seul `/api/auth/login` soit public. Les autres endpoints de profil (`/api/auth/me`, `/api/auth/verify-password`, `/api/auth/send-verification`, `/api/auth/change-password`) nécessiteront une authentification JWT valide.

### 2. Contrôleur d'Authentification

Dans [AuthController.java](file:///c:/Users/HP/Desktop/Gestion-Interventions-OCP/backend/intervention/src/main/java/com/ocp/intervention/controller/AuthController.java) :
- Injecter `JavaMailSender` et la propriété `@Value("${spring.mail.username}") private String mailFrom`.
- Implémenter une méthode `sendVerificationEmail` pour envoyer un e-mail HTML soigné aux couleurs OCP.
- Modifier `/send-verification` pour envoyer l'e-mail à l'adresse de l'utilisateur connecté et ne plus renvoyer le code de vérification au client.

---

## 💻 Modifications du Frontend (React - `gmao-app`)

Nous allons créer un composant de profil partagé et l'intégrer dans les dashboards.

### 1. Nouveau composant `UserProfile`

Nous allons créer deux nouveaux fichiers dans `gmao-app/src/features/admin/pages/` :
- [UserProfile.jsx](file:///c:/Users/HP/Desktop/Gestion-Interventions-OCP/gmao-app/src/features/admin/pages/UserProfile.jsx) : composant principal avec :
  - Un appel initial à `/api/auth/me` pour récupérer les informations de l'utilisateur (nom, email, téléphone, rôle).
  - Étape 1 : Formulaire de mot de passe actuel. Lors du clic sur "Envoyer le code", l'application appelle d'abord `/api/auth/verify-password`. Si le mot de passe est correct, elle appelle `/api/auth/send-verification` pour envoyer le code et passe à l'étape 2.
  - Étape 2 : Formulaire avec saisie du code à 6 chiffres + nouveau mot de passe + confirmation. Lors du clic sur "Confirmer le changement", l'application appelle `/api/auth/change-password`. En cas de succès, elle supprime le token et redirige vers `/login` après un message de confirmation.
  - Gestion des états de chargement (loading states) et des messages d'erreur.
- [UserProfile.css](file:///c:/Users/HP/Desktop/Gestion-Interventions-OCP/gmao-app/src/features/admin/pages/UserProfile.css) : styles soignés avec les couleurs OCP (`#006633`), ombres douces et mise en page responsive à deux colonnes (informations personnelles à gauche, sécurité/changement de mot de passe à gauche/droite).

### 2. Intégration dans les Dashboards

#### A. [AdminDashboard.jsx](file:///c:/Users/HP/Desktop/Gestion-Interventions-OCP/gmao-app/src/features/admin/pages/AdminDashboard.jsx)
- Importer `UserProfile` depuis `./UserProfile`.
- Ajouter un élément `profile` dans le menu de navigation de la sidebar.
- Rendre le composant `<UserProfile />` quand l'onglet actif est `profile`.
- Rendre les informations du pied de page de la sidebar dynamiques (récupérer les informations de l'utilisateur connecté à l'aide de l'endpoint `/api/auth/me` au lieu d'afficher "Administrateur" et "Super Admin" en dur).

#### B. [DemandeurDashboard.jsx](file:///c:/Users/HP/Desktop/Gestion-Interventions-OCP/gmao-app/src/features/admin/pages/DemandeurDashboard.jsx)
- Remplacer la fonction mock locale `UserProfile` par l'import du vrai composant `UserProfile`.
- Rendre le pied de page de la sidebar dynamique en récupérant les infos de l'utilisateur connecté via `/api/auth/me` au lieu de "Anas Alami".

---

## 🧪 Plan de vérification

### 1. Tests automatiques et manuels du Backend
- Démarrer le serveur Spring Boot.
- Tester l'envoi d'e-mail avec les endpoints en utilisant un client REST (ex. Postman) :
  1. Authentification pour obtenir le JWT token.
  2. Appel à `GET /api/auth/me` avec le token pour vérifier les données utilisateur.
  3. Appel à `POST /api/auth/verify-password` avec un mot de passe correct et incorrect.
  4. Appel à `POST /api/auth/send-verification` pour déclencher l'e-mail. Vérifier la réception de l'e-mail HTML et la console système.
  5. Appel à `PUT /api/auth/change-password` avec code expiré, code erroné et code correct pour valider la logique de changement.

### 2. Tests du Frontend
- Lancer le serveur de développement React (`npm run dev`).
- Se connecter à l'application.
- Cliquer sur "Mon Profil" et tester le parcours complet de modification du mot de passe.
- Valider la responsivité de l'interface en modifiant la taille de l'écran du navigateur.
