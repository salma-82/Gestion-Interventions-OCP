$ErrorActionPreference = "Stop"

# URLs
$baseUrl = "http://localhost:8080/api"
$loginUrl = "$baseUrl/auth/login"

# Helper to send UTF-8 JSON requests
function Invoke-PostUtf8($url, $headers, $bodyObject) {
    $json = $bodyObject | ConvertTo-Json -Depth 10
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    return Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $bytes
}

function Invoke-PutUtf8($url, $headers, $bodyObject) {
    $json = $bodyObject | ConvertTo-Json -Depth 10
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    return Invoke-RestMethod -Uri $url -Method Put -Headers $headers -Body $bytes
}

Write-Host "=== 1. Connexion en tant que Technicien N1 ==="
$n1Login = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body '{"email":"tech_n1@ocp.ma","password":"password"}'
$n1Token = $n1Login.token
$n1Headers = @{
    "Authorization" = "Bearer $n1Token"
    "Content-Type" = "application/json; charset=utf-8"
}
Write-Host "Token N1 récupéré: $($n1Token.Substring(0, 15))..."

Write-Host "`n=== 2. Démarrer intervention N1 ==="
$startPayload = @{
    ticketId = 100
    technicienId = 3
    statut = "IN_PROGRESS_N1"
}
$intervention = Invoke-PostUtf8 "$baseUrl/technicien/interventions/start" $n1Headers $startPayload
$interventionId = $intervention.id
Write-Host "Intervention N1 démarrée avec ID: $interventionId"

Write-Host "`n=== 3. Enregistrer action N1 ==="
$actionPayload = @{
    actionADistance = "Tentative de diagnostic à distance"
    surSiteEffectue = $false
    manipulationLourdeEffectue = $false
}
Invoke-PutUtf8 "$baseUrl/technicien/interventions/$interventionId/actions" $n1Headers $actionPayload
Write-Host "Action N1 enregistrée"

Write-Host "`n=== 4. Enregistrer Rapport N1 (Brouillon) ==="
$rapportDraftPayload = @{
    diagnostic = "Panne de réseau local"
    actionsRealisees = "Ping test, redémarrage port switch"
    resultat = "Non résolu à distance"
    commentaire = "Besoin d'un technicien N2 sur place"
    tempsPasse = "15 min"
}
Invoke-PutUtf8 "$baseUrl/technicien/interventions/$interventionId/rapport" $n1Headers $rapportDraftPayload
Write-Host "Rapport N1 (brouillon) enregistré"

Write-Host "`n=== 5. Escalader de N1 vers N2 ==="
$escaladePayload = @{
    rapport = "Diagnostic: Panne de réseau local`nActions réalisées: Ping test, redémarrage port switch`nRésultat (Problème résolu): Non résolu à distance`nCommentaire: Besoin d'un technicien N2 sur place`nTemps passé: 15 min"
    prochainStatut = "ESCALATED_N2"
    groupeCible = "ROLE_N2"
}
Invoke-PostUtf8 "$baseUrl/technicien/interventions/$interventionId/escalader" $n1Headers $escaladePayload
Write-Host "Ticket escaladé vers N2"


Write-Host "`n=== 6. Connexion en tant que Technicien N2 ==="
$n2Login = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body '{"email":"tech_n2@ocp.ma","password":"password"}'
$n2Token = $n2Login.token
$n2Headers = @{
    "Authorization" = "Bearer $n2Token"
    "Content-Type" = "application/json; charset=utf-8"
}
Write-Host "Token N2 récupéré: $($n2Token.Substring(0, 15))..."

Write-Host "`n=== 7. Démarrer intervention N2 ==="
$startPayloadN2 = @{
    ticketId = 100
    technicienId = 4
    statut = "EN_COURS_N2"
}
$interventionN2 = Invoke-PostUtf8 "$baseUrl/technicien/interventions/start" $n2Headers $startPayloadN2
$interventionIdN2 = $interventionN2.id
Write-Host "Intervention N2 démarrée avec ID: $interventionIdN2"

Write-Host "`n=== 8. Escalader de N2 vers N3 ==="
$reportN2 = "Diagnostic: Switch grillé`nAction Corrective: Changement de switch requis`nRésultat: Équipement HS`nObservations Technicien: Besoin d'une expertise N3 pour remplacement matériel critique`nTemps passé: 45 min"
$escaladeN2Payload = @{
    rapport = $reportN2
    prochainStatut = "ESCALATED_N3"
    groupeCible = "ROLE_N3"
}
Invoke-PostUtf8 "$baseUrl/technicien/interventions/$interventionIdN2/escalader" $n2Headers $escaladeN2Payload
Write-Host "Ticket escaladé vers N3"


Write-Host "`n=== 9. Connexion en tant que Technicien N3 ==="
$n3Login = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body '{"email":"tech_n3@ocp.ma","password":"password"}'
$n3Token = $n3Login.token
$n3Headers = @{
    "Authorization" = "Bearer $n3Token"
    "Content-Type" = "application/json; charset=utf-8"
}
Write-Host "Token N3 récupéré: $($n3Token.Substring(0, 15))..."

Write-Host "`n=== 10. Démarrer intervention N3 ==="
$startPayloadN3 = @{
    ticketId = 100
    technicienId = 5
    statut = "IN_PROGRESS_N3"
}
$interventionN3 = Invoke-PostUtf8 "$baseUrl/technicien/interventions/start" $n3Headers $startPayloadN3
$interventionIdN3 = $interventionN3.id
Write-Host "Intervention N3 démarrée avec ID: $interventionIdN3"

Write-Host "`n=== 11. Enregistrer Actions de Diagnostic N3 ==="
$actionPayloadN3 = @{
    actionADistance = '{"subStatus":"IN_PROGRESS_N3","startTime":"12:00","location":"Salle Serveurs","equipmentState":"HS","safetyChecks":"OK","calibrationState":"OK","tests":["Contrôle des signaux d''entrées/sorties API","Vérification des tensions d''alimentation (Multimètre)"],"customObservations":"Equipement grillé suite surtension"}'
    surSiteEffectue = $true
    manipulationLourdeEffectue = $true
}
Invoke-PutUtf8 "$baseUrl/technicien/interventions/$interventionIdN3/actions" $n3Headers $actionPayloadN3
Write-Host "Actions N3 enregistrées"

Write-Host "`n=== 12. Clôturer l'intervention N3 avec rapport et remplacement d'équipement ==="
$formattedReport = "--- RAPPORT EXPERT TECHNIQUE N3 ---
Diagnostic de panne : Court-circuit alimentation
Problème racine : Ticket for workflow test
Solution / Action corrective appliquée : Remplacement standard de switch
Équipement Remplacé : Telephone Cisco Stock
Temps total d'intervention : 1h 15m
Observations de l'expert N3 : Remplacement effectué avec succès
Niveau de gravité final : HIGH"

$closePayload = @{
    rapport = $formattedReport
    replacementEquipmentId = "5"
}
Invoke-PostUtf8 "$baseUrl/technicien/interventions/$interventionIdN3/cloturer" $n3Headers $closePayload
Write-Host "Intervention N3 clôturée avec succès !"


Write-Host "`n=== 13. Connexion en tant que Demandeur ==="
$demandeurLogin = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body '{"email":"demandeur@ocp.ma","password":"password"}'
$demandeurToken = $demandeurLogin.token
$demandeurHeaders = @{
    "Authorization" = "Bearer $demandeurToken"
    "Content-Type" = "application/json; charset=utf-8"
}
Write-Host "Token Demandeur récupéré"

Write-Host "`n=== 14. Envoyer Évaluation Demandeur ==="
$evalPayload = @{
    note = 5
    commentaire = "Remplacement rapide de l'équipement, excellent support N3 !"
}
Invoke-PostUtf8 "$baseUrl/demandeur/tickets/100/evaluer" $demandeurHeaders $evalPayload
Write-Host "Évaluation enregistrée avec succès !"

Write-Host "`n=== WORKFLOW E2E RÉUSSI AVEC SUCCÈS ! ==="
