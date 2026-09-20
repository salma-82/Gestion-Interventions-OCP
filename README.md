# Gestion des Interventions OCP

Application web de gestion des interventions techniques développée dans le cadre d'un projet de fin d'études au sein du Groupe OCP.

## 📌 Description

Cette application permet de gérer et suivre les interventions techniques, les tickets, les équipements et les utilisateurs.

Elle propose plusieurs interfaces selon le rôle de l'utilisateur :

- Administrateur
- Technicien
- Demandeur

## 🚀 Fonctionnalités

- Authentification et autorisation
- Gestion des utilisateurs
- Gestion des tickets
- Gestion des interventions
- Gestion des équipements
- Suivi des interventions
- Notifications
- Évaluation des interventions
- Tableaux de bord
- Gestion des rôles et permissions
- Sécurisation des API avec JWT

## 🏗️ Architecture

Le projet est organisé en deux parties :

```text
Gestion-Interventions-OCP/
│
├── backend/
│   └── intervention/
│       ├── src/
│       ├── pom.xml
│       └── mvnw
│
├── Frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
