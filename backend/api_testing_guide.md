# 🚀 Guide Complet de Test des API (OCP Intervention Management)

Ce guide contient toutes les étapes et requêtes nécessaires pour tester l'intégralité des fonctionnalités de l'API.

---

## 🔑 Étape 1 : L'Authentification (Login)
Les API sont sécurisées et nécessitent un jeton **JWT**. Vous devez d'abord vous connecter pour récupérer le Token correspondant au rôle souhaité.

### 📥 Requête de Login
* **Méthode :** `POST`
* **URL :** `http://localhost:8080/api/auth/login`
* **Headers :** `Content-Type: application/json`
* **Body (JSON) :**

```json
{
  "email": "admin@ocp.ma",
  "password": "password"
}
```

### 👤 Identifiants Disponibles (depuis data.sql)
| Rôle | Email | Mot de passe | Rôle Spring Security |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin@ocp.ma` | `password` | `ROLE_ADMIN` |
| **Demandeur** | `demandeur@ocp.ma` | `password` | `ROLE_DEMANDEUR` |
| **Technicien N1** | `tech_n1@ocp.ma` | `password` | `ROLE_N1` |
| **Technicien N2** | `tech_n2@ocp.ma` | `password` | `ROLE_N2` |
| **Technicien N3** | `tech_n3@ocp.ma` | `password` | `ROLE_N3` |

---

## 🛠️ Comment Configurer Postman / Bruno pour les API Protégées ?
Une fois le login réussi, récupérez la valeur de `token` dans la réponse JSON.

Pour chaque requête protégée :
1. Allez dans l'onglet **Headers** (ou **Authorization** > **Bearer Token** dans Postman/Bruno).
2. Ajoutez un Header :
   * **Key :** `Authorization`
   * **Value :** `Bearer <VOTRE_TOKEN_JWT>`
   *(Exemple : `Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiUk...`)*

---

## 👤 1. API Administrateur (`/api/admin/**`)
> [!IMPORTANT]
> Ces API nécessitent le token d'un utilisateur avec le rôle `ROLE_ADMIN` (ex: `admin@ocp.ma`).

### ➕ Créer / Modifier un Utilisateur
* **Méthode :** `POST`
* **URL :** `http://localhost:8080/api/admin/users`
* **Body (JSON) :**
```json
{
  "nom": "Benani",
  "prenom": "Karim",
  "email": "karim.benani@ocp.ma",
  "telephone": "0677777777",
  "password": "$2a$10$1cl3azAICoHXviDDPW4Cw.2ReeLbFGUSVxbrIzfU50xbJ9i3/FiRK",
  "role": "ROLE_DEMANDEUR",
  "status": true,
  "travaille": false
}
```

### 📋 Récupérer tous les Utilisateurs
* **Méthode :** `GET`
* **URL :** `http://localhost:8080/api/admin/users`

### ❌ Supprimer un Utilisateur
* **Méthode :** `DELETE`
* **URL :** `http://localhost:8080/api/admin/users/{id}` (remplacer `{id}` par l'ID de l'utilisateur)

### ➕ Créer / Modifier un Équipement
* **Méthode :** `POST`
* **URL :** `http://localhost:8080/api/admin/equipments`
* **Body (JSON) :**
```json
{
  "nom": "Pompe Hydraulique P12",
  "reference": "REF-P12",
  "description": "Pompe principale de relevage",
  "etat": "BON",
  "disponible": true,
  "localisation": "Zone Extraction"
}
```

### 📋 Récupérer tous les Équipements
* **Méthode :** `GET`
* **URL :** `http://localhost:8080/api/admin/equipments`

### ❌ Supprimer un Équipement
* **Méthode :** `DELETE`
* **URL :** `http://localhost:8080/api/admin/equipments/{id}` (remplacer `{id}` par l'ID de l'équipement)

### 📅 Planifier une Intervention Préventive
* **Méthode :** `POST`
* **URL :** `http://localhost:8080/api/admin/preventive?demandeurId=1`
* **Body (JSON) :**
```json
{
  "titre": "Maintenance préventive CV01",
  "description": "Graissage des roulements",
  "priorite": "MEDIUM",
  "statut": "PENDING",
  "equipement": {
    "id": 1
  }
}
```

### 📊 Dashboard & Statistiques
* **Méthode :** `GET`
* **URL :** `http://localhost:8080/api/admin/dashboard/stats`

---

## 📝 2. API Demandeur (`/api/demandeur/**`)
> [!IMPORTANT]
> Ces API nécessitent le token d'un utilisateur avec le rôle `ROLE_DEMANDEUR` (ex: `demandeur@ocp.ma`).

### ➕ Créer un Ticket (Demande d'intervention)
* **Méthode :** `POST`
* **URL :** `http://localhost:8080/api/demandeur/tickets?demandeurId=2`
* **Body (JSON) :**
```json
{
  "titre": "Panne Convoyeur principal",
  "description": "Le tapis roulant s'est arrêté de manière inopinée",
  "priorite": "HIGH",
  "statut": "PENDING",
  "equipement": {
    "id": 1
  }
}
```

### 📋 Consulter mes Demandes
* **Méthode :** `GET`
* **URL :** `http://localhost:8080/api/demandeur/tickets?demandeurId=2`

### ⭐ Évaluer l'Intervention (Une fois Clôturée)
* **Méthode :** `POST`
* **URL :** `http://localhost:8080/api/demandeur/tickets/{ticketId}/evaluer` (remplacer `{ticketId}`)
* **Body (JSON) :**
```json
{
  "note": 5,
  "commentaire": "Excellente réactivité, problème résolu en moins de 30 minutes !"
}
```

---

## 🔧 3. API Technicien (`/api/technicien/**`)
> [!IMPORTANT]
> Ces API nécessitent le token d'un Technicien (`ROLE_N1`, `ROLE_N2` ou `ROLE_N3`).

### 🚀 1. Démarrer une Intervention
* **Méthode :** `POST`
* **URL :** `http://localhost:8080/api/technicien/interventions/start`
* **Body (JSON) :**
```json
{
  "ticketId": 1,
  "technicienId": 3,
  "statut": "IN_PROGRESS_N1"
}
```

### 📝 2. Enregistrer une Action
* **Méthode :** `PUT`
* **URL :** `http://localhost:8080/api/technicien/interventions/{interventionId}/actions`
* **Body (JSON) :**
```json
{
  "actionADistance": "Redémarrage du système logiciel de contrôle",
  "surSiteEffectue": false,
  "manipulationLourdeEffectue": false
}
```

### 📈 3. Escalader le Ticket (vers N2 ou N3)
* **Méthode :** `POST`
* **URL :** `http://localhost:8080/api/technicien/interventions/{interventionId}/escalader`
* **Body (JSON) :**
```json
{
  "rapport": "Problème mécanique au niveau du moteur. Nécessite une intervention sur site.",
  "prochainStatut": "ESCALATED_N2",
  "groupeCible": "ROLE_N2"
}
```

### 🔒 4. Clôturer Définitivement le Ticket
* **Méthode :** `POST`
* **URL :** `http://localhost:8080/api/technicien/interventions/{interventionId}/cloturer`
* **Body (JSON) :**
```json
{
  "rapport": "Changement de la courroie de transmission effectué avec succès."
}
```

---

## 🔔 4. API Notifications (`/api/notifications/**`)
> [!NOTE]
> Accessible par tout utilisateur authentifié pour suivre ses alertes en temps réel.

### 📋 Récupérer mes Alertes
* **Méthode :** `GET`
* **URL :** `http://localhost:8080/api/notifications?userId=1`

### 👁️ Marquer une Alerte comme Lue
* **Méthode :** `PUT`
* **URL :** `http://localhost:8080/api/notifications/{notificationId}/read`
