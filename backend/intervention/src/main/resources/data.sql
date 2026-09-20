-- L'Administrateur
INSERT IGNORE INTO users (id, nom, prenom, email, telephone, password, role, status, travaille) 
VALUES (1, 'Boussami', 'Salma', 'admin@ocp.ma', '0600000000', '$2a$10$1cl3azAICoHXviDDPW4Cw.2ReeLbFGUSVxbrIzfU50xbJ9i3/FiRK', 'ROLE_ADMIN', true, false);

-- Utilisateur Simple
INSERT IGNORE INTO users (id, nom, prenom, email, telephone, password, role, status, travaille) 
VALUES (2, 'Alami', 'Anas', 'demandeur@ocp.ma', '0622222222', '$2a$10$1cl3azAICoHXviDDPW4Cw.2ReeLbFGUSVxbrIzfU50xbJ9i3/FiRK', 'ROLE_DEMANDEUR', true, false);

-- Technicien Niveau 1
INSERT IGNORE INTO users (id, nom, prenom, email, telephone, password, role, status, travaille) 
VALUES (3, 'El Mohriri', 'Ahmed', 'tech_n1@ocp.ma', '0611111111', '$2a$10$1cl3azAICoHXviDDPW4Cw.2ReeLbFGUSVxbrIzfU50xbJ9i3/FiRK', 'ROLE_N1', true, false);

-- Technicien Niveau 2
INSERT IGNORE INTO users (id, nom, prenom, email, telephone, password, role, status, travaille) 
VALUES (4, 'Benali', 'Karim', 'tech_n2@ocp.ma', '0622222223', '$2a$10$1cl3azAICoHXviDDPW4Cw.2ReeLbFGUSVxbrIzfU50xbJ9i3/FiRK', 'ROLE_N2', true, false);

-- Technicien Niveau 3
INSERT IGNORE INTO users (id, nom, prenom, email, telephone, password, role, status, travaille) 
VALUES (5, 'Idrissi', 'Omar', 'tech_n3@ocp.ma', '0644444444', '$2a$10$1cl3azAICoHXviDDPW4Cw.2ReeLbFGUSVxbrIzfU50xbJ9i3/FiRK', 'ROLE_N3', true, false);

-- Équipements de démonstration
INSERT IGNORE INTO equipements
(id, code_inventaire, nom, type, marque, modele, numero_serie, localisation, statut, etat_affectation, description)
VALUES
(1, 'PC001', 'PC Direction', 'ORDINATEUR', 'Dell', 'OptiPlex 7010', 'DL001', 'Direction', 'ACTIF', 'EN_UTILISATION', 'Poste direction'),
(2, 'PC002', 'PC Stock 01', 'ORDINATEUR', 'HP', 'ProDesk 400', 'HP002', 'Stock Informatique', 'ACTIF', 'DISPONIBLE', 'PC de remplacement'),
(3, 'IMP001', 'Imprimante RH', 'IMPRIMANTE', 'HP', 'LaserJet Pro M404', 'IMP001', 'RH', 'ACTIF', 'EN_UTILISATION', 'Imprimante RH'),
(4, 'TEL001', 'Telephone Cisco Direction', 'TELEPHONE_IP', 'Cisco', 'CP-8841', 'TEL001', 'Direction', 'ACTIF', 'EN_UTILISATION', 'Telephone IP'),
(5, 'TEL002', 'Telephone Cisco Stock', 'TELEPHONE_IP', 'Cisco', 'CP-8851', 'TEL002', 'Stock Informatique', 'ACTIF', 'DISPONIBLE', 'Telephone de remplacement'),
(6, 'SW001', 'Switch Principal', 'SWITCH', 'Cisco', 'Catalyst 2960', 'SW001', 'Salle Serveurs', 'ACTIF', 'EN_UTILISATION', 'Switch principal'),
(7, 'RTR001', 'Routeur Principal', 'ROUTEUR', 'Cisco', 'ISR 4331', 'RTR001', 'Salle Serveurs', 'ACTIF', 'EN_UTILISATION', 'Routeur principal'),
(8, 'AP001', 'Point Acces WiFi RH', 'POINT_ACCES_WIFI', 'Cisco', 'Aironet 1830', 'AP001', 'RH', 'ACTIF', 'EN_UTILISATION', 'WiFi RH'),
(9, 'SRV001', 'Serveur Fichiers', 'SERVEUR', 'Dell', 'PowerEdge R740', 'SRV001', 'Datacenter', 'ACTIF', 'EN_UTILISATION', 'Serveur fichiers'),
(10, 'OND001', 'Onduleur Datacenter', 'ONDULEUR', 'APC', 'Smart UPS 3000', 'OND001', 'Datacenter', 'ACTIF', 'EN_UTILISATION', 'Protection electrique');


