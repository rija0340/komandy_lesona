// État de l'application
let jours = [];
let roles = {}; // {jour: [roles]}
let personnes = []; // [{nom, disponibilites: [jours]}]
let planning = []; // [{semaine, jour, role, personne}]

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    chargerDonnees();
    afficherListes();
});

// ===== GESTION DE L'INTERFACE =====

function toggleConfig() {
    const section = document.getElementById('configSection');
    const toggle = document.getElementById('configToggle');
    
    if (section.classList.contains('config-expanded')) {
        section.classList.remove('config-expanded');
        section.classList.add('config-collapsed');
        toggle.classList.add('rotate-180');
    } else {
        section.classList.remove('config-collapsed');
        section.classList.add('config-expanded');
        toggle.classList.remove('rotate-180');
    }
}

function switchTab(tabName) {
    // Cacher tous les contenus
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Enlever active de tous les boutons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Afficher le contenu sélectionné
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    // Activer le bouton
    event.target.classList.add('active');
    
    // Rafraîchir les données selon l'onglet
    if (tabName === 'statistiques') {
        initialiserFiltresStats();
        afficherStatsAvancees();
    }
}

// ===== AJOUT DE DONNÉES =====

function ajouterJourAvecRoles() {
    const nomJour = document.getElementById('nomJour').value.trim();
    const rolesText = document.getElementById('rolesJour').value.trim();
    
    if (!nomJour) {
        afficherMessage('Veuillez entrer un nom de jour', 'error');
        return;
    }
    
    if (!rolesText) {
        afficherMessage('Veuillez entrer au moins un rôle', 'error');
        return;
    }
    
    if (jours.includes(nomJour)) {
        afficherMessage('Ce jour existe déjà', 'error');
        return;
    }
    
    const rolesArray = rolesText.split('\n').map(r => r.trim()).filter(r => r);
    
    jours.push(nomJour);
    roles[nomJour] = rolesArray;
    
    document.getElementById('nomJour').value = '';
    document.getElementById('rolesJour').value = '';
    
    sauvegarderDonnees();
    afficherListes();
    mettreAJourSelects();
    
    afficherMessage(`Jour "${nomJour}" ajouté avec ${rolesArray.length} rôle(s)`, 'success');
}

function ajouterPersonne() {
    const nom = document.getElementById('nomPersonne').value.trim();
    
    if (!nom) {
        afficherMessage('Veuillez entrer un nom', 'error');
        return;
    }
    
    if (personnes.some(p => p.nom === nom)) {
        afficherMessage('Cette personne existe déjà', 'error');
        return;
    }
    
    const disponibilites = [];
    jours.forEach(jour => {
        const checkbox = document.getElementById(`dispo-${jour}`);
        if (checkbox && checkbox.checked) {
            disponibilites.push(jour);
        }
    });
    
    if (disponibilites.length === 0) {
        afficherMessage('Veuillez sélectionner au moins un jour de disponibilité', 'error');
        return;
    }
    
    personnes.push({ nom, disponibilites });
    
    document.getElementById('nomPersonne').value = '';
    jours.forEach(jour => {
        const checkbox = document.getElementById(`dispo-${jour}`);
        if (checkbox) checkbox.checked = false;
    });
    
    sauvegarderDonnees();
    afficherListes();
    mettreAJourSelects();
    
    afficherMessage(`Personne "${nom}" ajoutée`, 'success');
}

function ajouterRoleJour() {
    const jour = document.getElementById('jourAModifier').value;
    const nouveauRole = document.getElementById('nouveauRole').value.trim();
    
    if (!jour || !nouveauRole) {
        afficherMessage('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (roles[jour].includes(nouveauRole)) {
        afficherMessage('Ce rôle existe déjà pour ce jour', 'error');
        return;
    }
    
    roles[jour].push(nouveauRole);
    document.getElementById('nouveauRole').value = '';
    
    sauvegarderDonnees();
    chargerRolesJour();
    afficherListes();
    
    afficherMessage(`Rôle "${nouveauRole}" ajouté`, 'success');
}

// ===== MODIFICATION =====

function chargerRolesJour() {
    const jour = document.getElementById('jourAModifier').value;
    const container = document.getElementById('rolesJourContainer');
    const ajoutContainer = document.getElementById('ajoutRoleContainer');
    const liste = document.getElementById('listeRolesJourAModifier');
    
    if (!jour) {
        container.style.display = 'none';
        ajoutContainer.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    ajoutContainer.style.display = 'block';
    
    liste.innerHTML = '';
    roles[jour].forEach(role => {
        const badge = document.createElement('span');
        badge.className = 'role-badge inline-flex items-center gap-2';
        badge.innerHTML = `
            ${role}
            <button onclick="supprimerRoleJour('${jour}', '${role}')" 
                    class="remove-btn hover:text-red-200">
                <i class="fas fa-times"></i>
            </button>
        `;
        liste.appendChild(badge);
    });
}

function supprimerRoleJour(jour, role) {
    if (!confirm(`Supprimer le rôle "${role}" ?`)) return;
    
    roles[jour] = roles[jour].filter(r => r !== role);
    
    if (roles[jour].length === 0) {
        if (!confirm(`Plus aucun rôle pour "${jour}". Supprimer ce jour ?`)) {
            return;
        }
        supprimerJour(jour);
        return;
    }
    
    sauvegarderDonnees();
    chargerRolesJour();
    afficherListes();
    
    afficherMessage(`Rôle "${role}" supprimé`, 'success');
}

function chargerDisponibilitesPersonne() {
    const nom = document.getElementById('personneAModifier').value;
    const container = document.getElementById('disponibilitesPersonneContainer');
    const liste = document.getElementById('listeDisponibilitesPersonne');
    
    if (!nom) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    const personne = personnes.find(p => p.nom === nom);
    if (!personne) return;
    
    liste.innerHTML = '';
    jours.forEach(jour => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `modif-dispo-${jour}`;
        checkbox.checked = personne.disponibilites.includes(jour);
        checkbox.onchange = () => {
            modifierDisponibilite(nom, jour, checkbox.checked);
        };
        
        const label = document.createElement('label');
        label.htmlFor = `modif-dispo-${jour}`;
        label.textContent = jour;
        label.className = 'cursor-pointer';
        
        div.appendChild(checkbox);
        div.appendChild(label);
        liste.appendChild(div);
    });
}

function modifierDisponibilite(nom, jour, ajouter) {
    const personne = personnes.find(p => p.nom === nom);
    if (!personne) return;
    
    if (ajouter) {
        if (!personne.disponibilites.includes(jour)) {
            personne.disponibilites.push(jour);
        }
    } else {
        personne.disponibilites = personne.disponibilites.filter(j => j !== jour);
        
        if (personne.disponibilites.length === 0) {
            afficherMessage('Une personne doit avoir au moins un jour de disponibilité', 'error');
            document.getElementById(`modif-dispo-${jour}`).checked = true;
            personne.disponibilites.push(jour);
            return;
        }
    }
    
    sauvegarderDonnees();
    afficherListes();
}

// ===== SUPPRESSION =====

function supprimerJour(jour) {
    jours = jours.filter(j => j !== jour);
    delete roles[jour];
    
    personnes.forEach(p => {
        p.disponibilites = p.disponibilites.filter(j => j !== jour);
    });
    
    personnes = personnes.filter(p => p.disponibilites.length > 0);
    
    sauvegarderDonnees();
    afficherListes();
    mettreAJourSelects();
    
    afficherMessage(`Jour "${jour}" supprimé`, 'success');
}

function supprimerPersonne(nom) {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    
    personnes = personnes.filter(p => p.nom !== nom);
    
    sauvegarderDonnees();
    afficherListes();
    mettreAJourSelects();
    
    afficherMessage(`Personne "${nom}" supprimée`, 'success');
}

// ===== AFFICHAGE =====

function afficherListes() {
    afficherListeJours();
    afficherListeRoles();
    afficherListePersonnes();
    afficherDisponibilites();
}

function afficherListeJours() {
    const liste = document.getElementById('listeJours');
    liste.innerHTML = '';
    
    if (jours.length === 0) {
        liste.innerHTML = '<p class="text-gray-400 text-sm">Aucun jour configuré</p>';
        return;
    }
    
    jours.forEach(jour => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-blue-50 p-3 rounded-lg';
        div.innerHTML = `
            <span class="font-medium text-gray-700">${jour}</span>
            <button onclick="supprimerJour('${jour}')" 
                    class="text-red-500 hover:text-red-700 remove-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;
        liste.appendChild(div);
    });
}

function afficherListeRoles() {
    const liste = document.getElementById('listeRoles');
    liste.innerHTML = '';
    
    if (jours.length === 0) {
        liste.innerHTML = '<p class="text-gray-400 text-sm">Aucun rôle configuré</p>';
        return;
    }
    
    jours.forEach(jour => {
        const div = document.createElement('div');
        div.className = 'bg-purple-50 p-3 rounded-lg';
        
        const titre = document.createElement('div');
        titre.className = 'font-semibold text-gray-700 mb-2';
        titre.textContent = jour;
        
        const rolesDiv = document.createElement('div');
        rolesDiv.className = 'flex flex-wrap gap-1';
        
        roles[jour].forEach(role => {
            const badge = document.createElement('span');
            badge.className = 'text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full';
            badge.textContent = role;
            rolesDiv.appendChild(badge);
        });
        
        div.appendChild(titre);
        div.appendChild(rolesDiv);
        liste.appendChild(div);
    });
}

function afficherListePersonnes() {
    const liste = document.getElementById('listePersonnes');
    liste.innerHTML = '';
    
    if (personnes.length === 0) {
        liste.innerHTML = '<p class="text-gray-400 text-sm">Aucune personne ajoutée</p>';
        return;
    }
    
    personnes.forEach(personne => {
        const div = document.createElement('div');
        div.className = 'bg-green-50 p-3 rounded-lg';
        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-gray-700">${personne.nom}</span>
                <button onclick="supprimerPersonne('${personne.nom}')" 
                        class="text-red-500 hover:text-red-700 remove-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="text-xs text-gray-600">
                <i class="fas fa-calendar-check mr-1"></i>
                ${personne.disponibilites.join(', ')}
            </div>
        `;
        liste.appendChild(div);
    });
}

function afficherDisponibilites() {
    const container = document.getElementById('disponibilitesContainer');
    container.innerHTML = '';
    
    if (jours.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm">Ajoutez d\'abord des jours</p>';
        return;
    }
    
    jours.forEach(jour => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `dispo-${jour}`;
        checkbox.className = 'cursor-pointer';
        
        const label = document.createElement('label');
        label.htmlFor = `dispo-${jour}`;
        label.textContent = jour;
        label.className = 'cursor-pointer text-gray-700';
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

function mettreAJourSelects() {
    // Select jour à modifier
    const selectJour = document.getElementById('jourAModifier');
    selectJour.innerHTML = '<option value="">-- Sélectionner un jour --</option>';
    jours.forEach(jour => {
        const option = document.createElement('option');
        option.value = jour;
        option.textContent = jour;
        selectJour.appendChild(option);
    });
    
    // Select personne à modifier
    const selectPersonne = document.getElementById('personneAModifier');
    selectPersonne.innerHTML = '<option value="">-- Sélectionner une personne --</option>';
    personnes.forEach(personne => {
        const option = document.createElement('option');
        option.value = personne.nom;
        option.textContent = personne.nom;
        selectPersonne.appendChild(option);
    });
    
    // Select pour statistiques
    const selectStats = document.getElementById('personneSelectionnee');
    selectStats.innerHTML = '<option value="">-- Toutes les personnes --</option>';
    personnes.forEach(personne => {
        const option = document.createElement('option');
        option.value = personne.nom;
        option.textContent = personne.nom;
        selectStats.appendChild(option);
    });
}

function afficherMessage(message, type) {
    const messageDiv = document.getElementById('messagePlanning');
    messageDiv.className = `p-4 rounded-lg mb-4 ${
        type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
        type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
        'bg-blue-100 text-blue-800 border border-blue-300'
    }`;
    messageDiv.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle'
            }"></i>
            <span>${message}</span>
        </div>
    `;
    
    setTimeout(() => {
        messageDiv.innerHTML = '';
        messageDiv.className = '';
    }, 5000);
}

// ===== GÉNÉRATION DU PLANNING =====

function genererPlanning() {
    const nbSemaines = parseInt(document.getElementById('nbSemaines').value);
    const modeEquite = document.getElementById('modeEquite').checked;
    const modeDebug = document.getElementById('modeDebug').checked;
    
    if (jours.length === 0) {
        afficherMessage('Veuillez d\'abord configurer des jours', 'error');
        return;
    }
    
    if (personnes.length === 0) {
        afficherMessage('Veuillez d\'abord ajouter des personnes', 'error');
        return;
    }
    
    planning = [];
    const compteurs = {}; // {personne: compteur}
    personnes.forEach(p => compteurs[p.nom] = 0);
    
    let erreurs = [];
    
    for (let semaine = 1; semaine <= nbSemaines; semaine++) {
        for (const jour of jours) {
            const rolesJour = roles[jour];
            const personnesDisponibles = personnes.filter(p => 
                p.disponibilites.includes(jour)
            );
            
            if (personnesDisponibles.length === 0) {
                erreurs.push(`Semaine ${semaine}, ${jour}: Aucune personne disponible`);
                continue;
            }
            
            for (const role of rolesJour) {
                let personneTrouvee = null;
                
                // Filtrer les personnes déjà assignées à ce jour cette semaine
                const personnesDejaAssignees = planning
                    .filter(aff => aff.semaine === semaine && aff.jour === jour)
                    .map(aff => aff.personne);
                
                const personnesEligibles = personnesDisponibles.filter(p => 
                    !personnesDejaAssignees.includes(p.nom)
                );
                
                if (personnesEligibles.length === 0) {
                    // Aucune personne disponible, laisser vide
                    erreurs.push(`Semaine ${semaine}, ${jour}, ${role}: Aucune personne disponible (contrainte respectée)`);
                    continue;
                }
                
                if (modeEquite) {
                    // Trouver la personne avec le moins d'affectations
                    const minCompteur = Math.min(...personnesEligibles.map(p => compteurs[p.nom]));
                    const candidats = personnesEligibles.filter(p => compteurs[p.nom] === minCompteur);
                    
                    personneTrouvee = candidats[Math.floor(Math.random() * candidats.length)];
                } else {
                    // Mode aléatoire simple
                    personneTrouvee = personnesEligibles[
                        Math.floor(Math.random() * personnesEligibles.length)
                    ];
                }
                
                if (personneTrouvee) {
                    planning.push({
                        semaine,
                        jour,
                        role,
                        personne: personneTrouvee.nom
                    });
                    compteurs[personneTrouvee.nom]++;
                }
            }
        }
    }
    
    afficherTableauPlanning();
    
    if (erreurs.length > 0 && modeDebug) {
        afficherMessage(`Planning généré avec ${erreurs.length} problème(s)`, 'error');
        console.log('Erreurs:', erreurs);
    } else if (erreurs.length > 0) {
        afficherMessage('Planning généré (certains rôles n\'ont pas pu être affectés)', 'error');
    } else {
        afficherMessage(`Planning généré avec succès pour ${nbSemaines} semaine(s) !`, 'success');
    }
    
    initialiserFiltresStats();
}

function afficherTableauPlanning() {
    const table = document.getElementById('tableauPlanning');
    const nbSemaines = parseInt(document.getElementById('nbSemaines').value);
    
    // Header: Jour | Rôle | Semaine 1 | Semaine 2 | ...
    let headerHTML = '<tr><th class="border-r border-gray-300">Jour</th><th class="border-r border-gray-300">Rôle</th>';
    for (let semaine = 1; semaine <= nbSemaines; semaine++) {
        headerHTML += `<th class="text-center">Semaine ${semaine}</th>`;
    }
    headerHTML += '</tr>';
    
    // Body: Each row is a day-role combination
    let bodyHTML = '';
    jours.forEach((jour, jourIndex) => {
        roles[jour].forEach((role, roleIndex) => {
            const isFirstRole = roleIndex === 0;
            const rowspan = roles[jour].length;
            
            bodyHTML += '<tr>';
            
            // Day column (with rowspan for first role)
            if (isFirstRole) {
                bodyHTML += `<td rowspan="${rowspan}" class="font-semibold bg-gray-50 border-r border-gray-300 align-top">${jour}</td>`;
            }
            
            // Role column
            bodyHTML += `<td class="bg-gray-50 border-r border-gray-300">${role}</td>`;
            
            // Week columns
            for (let semaine = 1; semaine <= nbSemaines; semaine++) {
                const affectation = planning.find(a => 
                    a.semaine === semaine && 
                    a.jour === jour && 
                    a.role === role
                );
                
                const personne = affectation ? affectation.personne : '';
                const displayText = personne || '<span class="empty-cell">Vide</span>';
                const cellClass = personne ? 'editable-cell' : 'editable-cell empty-cell';
                
                bodyHTML += `<td class="text-center ${cellClass}" 
                    onclick="ouvrirAutocomplete(this, ${semaine}, '${jour}', '${role}')" 
                    data-semaine="${semaine}" 
                    data-jour="${jour}" 
                    data-role="${role}" 
                    data-personne="${personne}">${displayText}</td>`;
            }
            
            bodyHTML += '</tr>';
        });
    });
    
    table.innerHTML = `<thead>${headerHTML}</thead><tbody>${bodyHTML}</tbody>`;
}

// ===== STATISTIQUES AVANCÉES =====

function initialiserFiltresStats() {
    if (planning.length === 0) return;
    
    const nbSemaines = parseInt(document.getElementById('nbSemaines').value);
    
    // Remplir filtre personnes
    const containerPersonnes = document.getElementById('filterPersonnesContainer');
    containerPersonnes.innerHTML = '';
    personnes.forEach(personne => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 mb-2 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="cursor-pointer filter-personne" value="${personne.nom}" checked>
            <span>${personne.nom}</span>
        `;
        containerPersonnes.appendChild(label);
    });
    
    // Remplir filtre semaines
    const containerSemaines = document.getElementById('filterSemainesContainer');
    containerSemaines.innerHTML = '';
    for (let i = 1; i <= nbSemaines; i++) {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 mb-2 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="cursor-pointer filter-semaine" value="${i}" checked>
            <span>Semaine ${i}</span>
        `;
        containerSemaines.appendChild(label);
    }
    
    // Remplir filtre rôles
    const containerRoles = document.getElementById('filterRolesContainer');
    containerRoles.innerHTML = '';
    const allRoles = new Set();
    jours.forEach(jour => {
        roles[jour].forEach(role => allRoles.add(role));
    });
    
    Array.from(allRoles).sort().forEach(role => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 mb-2 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="cursor-pointer filter-role" value="${role}" checked>
            <span>${role}</span>
        `;
        containerRoles.appendChild(label);
    });
}

function toggleAllPersonnes() {
    const checked = document.getElementById('filterAllPersonnes').checked;
    document.querySelectorAll('.filter-personne').forEach(cb => {
        cb.checked = checked;
    });
}

function toggleAllSemaines() {
    const checked = document.getElementById('filterAllSemaines').checked;
    document.querySelectorAll('.filter-semaine').forEach(cb => {
        cb.checked = checked;
    });
}

function toggleAllRoles() {
    const checked = document.getElementById('filterAllRoles').checked;
    document.querySelectorAll('.filter-role').forEach(cb => {
        cb.checked = checked;
    });
}

function afficherStatsAvancees() {
    const container = document.getElementById('statistiquesContainer');
    
    if (planning.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-12">
                <i class="fas fa-chart-line text-6xl mb-4 text-gray-300"></i>
                <p class="text-lg">Générez un planning pour voir les statistiques</p>
            </div>
        `;
        return;
    }
    
    // Récupérer les filtres
    const personnesFiltrees = Array.from(document.querySelectorAll('.filter-personne:checked')).map(cb => cb.value);
    const semainesFiltrees = Array.from(document.querySelectorAll('.filter-semaine:checked')).map(cb => parseInt(cb.value));
    const rolesFiltres = Array.from(document.querySelectorAll('.filter-role:checked')).map(cb => cb.value);
    
    if (personnesFiltrees.length === 0 || semainesFiltrees.length === 0 || rolesFiltres.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-12">
                <i class="fas fa-exclamation-circle text-6xl mb-4 text-gray-300"></i>
                <p class="text-lg">Veuillez sélectionner au moins un filtre dans chaque catégorie</p>
            </div>
        `;
        return;
    }
    
    // Filtrer le planning
    const planningFiltre = planning.filter(aff => 
        personnesFiltrees.includes(aff.personne) &&
        semainesFiltrees.includes(aff.semaine) &&
        rolesFiltres.includes(aff.role)
    );
    
    if (planningFiltre.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-12">
                <i class="fas fa-inbox text-6xl mb-4 text-gray-300"></i>
                <p class="text-lg">Aucune donnée correspondant aux filtres sélectionnés</p>
            </div>
        `;
        return;
    }
    
    // Calculer les statistiques
    const stats = {};
    
    planningFiltre.forEach(aff => {
        if (!stats[aff.personne]) {
            stats[aff.personne] = {
                total: 0,
                parRole: {},
                parJour: {},
                parSemaine: {},
                details: []
            };
        }
        
        stats[aff.personne].total++;
        stats[aff.personne].parRole[aff.role] = (stats[aff.personne].parRole[aff.role] || 0) + 1;
        stats[aff.personne].parJour[aff.jour] = (stats[aff.personne].parJour[aff.jour] || 0) + 1;
        stats[aff.personne].parSemaine[aff.semaine] = (stats[aff.personne].parSemaine[aff.semaine] || 0) + 1;
        stats[aff.personne].details.push(aff);
    });
    
    let html = '';
    
    // Vue d'ensemble
    const totalAffectations = planningFiltre.length;
    const nbPersonnes = Object.keys(stats).length;
    const moyenne = nbPersonnes > 0 ? totalAffectations / nbPersonnes : 0;
    const maxAff = nbPersonnes > 0 ? Math.max(...Object.values(stats).map(s => s.total)) : 0;
    const minAff = nbPersonnes > 0 ? Math.min(...Object.values(stats).map(s => s.total)) : 0;
    
    html += `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-card bg-white border border-gray-200">
                <div class="text-3xl font-bold text-gray-900">${totalAffectations}</div>
                <div class="text-sm text-gray-600">Total affectations</div>
            </div>
            <div class="stat-card bg-white border border-gray-200">
                <div class="text-3xl font-bold text-gray-900">${moyenne.toFixed(1)}</div>
                <div class="text-sm text-gray-600">Moyenne par personne</div>
            </div>
            <div class="stat-card bg-white border border-gray-200">
                <div class="text-3xl font-bold text-gray-900">${maxAff}</div>
                <div class="text-sm text-gray-600">Maximum</div>
            </div>
            <div class="stat-card bg-white border border-gray-200">
                <div class="text-3xl font-bold text-gray-900">${minAff}</div>
                <div class="text-sm text-gray-600">Minimum</div>
            </div>
        </div>
    `;
    
    // Détails par personne
    const sortedPersonnes = Object.keys(stats).sort((a, b) => stats[b].total - stats[a].total);
    
    html += '<div class="grid grid-cols-1 gap-6">';
    sortedPersonnes.forEach(nom => {
        html += genererCarteStatsAvancee(nom, stats[nom]);
    });
    html += '</div>';
    
    container.innerHTML = html;
}

function genererCarteStatsAvancee(nom, stat) {
    let html = `
        <div class="stat-card border border-gray-200">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-2xl font-bold text-gray-900">${nom}</h3>
                <div class="text-4xl font-bold text-gray-900">${stat.total}</div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    `;
    
    // Par rôle
    if (Object.keys(stat.parRole).length > 0) {
        html += `
            <div>
                <div class="text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-tasks mr-1"></i>Par rôle:
                </div>
                <div class="space-y-1">
        `;
        
        Object.entries(stat.parRole).sort((a, b) => b[1] - a[1]).forEach(([role, count]) => {
            const percentage = (count / stat.total * 100).toFixed(0);
            html += `
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700">${role}</span>
                    <span class="text-sm font-bold text-gray-900">${count} (${percentage}%)</span>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    // Par jour
    if (Object.keys(stat.parJour).length > 0) {
        html += `
            <div>
                <div class="text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-calendar-day mr-1"></i>Par jour:
                </div>
                <div class="space-y-1">
        `;
        
        Object.entries(stat.parJour).sort((a, b) => b[1] - a[1]).forEach(([jour, count]) => {
            const percentage = (count / stat.total * 100).toFixed(0);
            html += `
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700">${jour}</span>
                    <span class="text-sm font-bold text-gray-900">${count} (${percentage}%)</span>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    // Par semaine
    if (Object.keys(stat.parSemaine).length > 0) {
        html += `
            <div>
                <div class="text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-calendar-week mr-1"></i>Par semaine:
                </div>
                <div class="space-y-1">
        `;
        
        Object.entries(stat.parSemaine).sort((a, b) => a[0] - b[0]).forEach(([semaine, count]) => {
            html += `
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-700">Semaine ${semaine}</span>
                    <span class="text-sm font-bold text-gray-900">${count}</span>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    html += '</div>';
    
    // Détails chronologiques
    html += `
        <div class="mt-4 border-t border-gray-200 pt-4">
            <div class="text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-list mr-1"></i>Détail des affectations:
            </div>
            <div class="max-h-40 overflow-y-auto">
                <table class="w-full text-sm">
                    <thead class="sticky top-0 bg-gray-50">
                        <tr class="text-left">
                            <th class="py-1 px-2">Semaine</th>
                            <th class="py-1 px-2">Jour</th>
                            <th class="py-1 px-2">Rôle</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    stat.details.sort((a, b) => {
        if (a.semaine !== b.semaine) return a.semaine - b.semaine;
        return jours.indexOf(a.jour) - jours.indexOf(b.jour);
    }).forEach(detail => {
        html += `
            <tr class="border-t border-gray-100">
                <td class="py-1 px-2">${detail.semaine}</td>
                <td class="py-1 px-2">${detail.jour}</td>
                <td class="py-1 px-2">${detail.role}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    html += '</div>';
    
    return html;
}

// Fonction appelée lors de modification de cellule
function rafraichirStats() {
    if (planning.length > 0) {
        afficherStatsAvancees();
    }
}

// Compatibilité - redirige vers nouvelle fonction
function afficherStatsPersonne() {
    afficherStatsAvancees();
}
// ===== EXPORT EXCEL =====

function exporterExcel() {
    if (planning.length === 0) {
        afficherMessage('Veuillez d\'abord générer un planning', 'error');
        return;
    }
    
    const nbSemaines = parseInt(document.getElementById('nbSemaines').value);
    
    // Préparer les données
    const data = [];
    
    // Header: Jour | Rôle | Semaine 1 | Semaine 2 | ...
    const header = ['Jour', 'Rôle'];
    for (let semaine = 1; semaine <= nbSemaines; semaine++) {
        header.push(`Semaine ${semaine}`);
    }
    data.push(header);
    
    // Données: Chaque ligne = jour-rôle
    jours.forEach(jour => {
        roles[jour].forEach(role => {
            const row = [jour, role];
            
            for (let semaine = 1; semaine <= nbSemaines; semaine++) {
                const affectation = planning.find(a => 
                    a.semaine === semaine && 
                    a.jour === jour && 
                    a.role === role
                );
                row.push(affectation ? affectation.personne : '');
            }
            
            data.push(row);
        });
    });
    
    // Créer le workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Largeur des colonnes
    const colWidths = [
        { wch: 15 }, // Jour
        { wch: 20 }  // Rôle
    ];
    for (let i = 0; i < nbSemaines; i++) {
        colWidths.push({ wch: 20 }); // Semaines
    }
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Planning');
    
    // Télécharger
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `planning_roles_${date}.xlsx`);
    
    afficherMessage('Planning exporté avec succès !', 'success');
}

// ===== SAUVEGARDE LOCALE =====

function sauvegarderDonnees() {
    const data = {
        jours,
        roles,
        personnes
    };
    localStorage.setItem('planningRoles', JSON.stringify(data));
}

function chargerDonnees() {
    const saved = localStorage.getItem('planningRoles');
    if (saved) {
        const data = JSON.parse(saved);
        jours = data.jours || [];
        roles = data.roles || {};
        personnes = data.personnes || [];
        
        mettreAJourSelects();
    }
}

// ===== AUTOCOMPLETE POUR CELLULES ÉDITABLES =====

let dropdownActif = null;

function ouvrirAutocomplete(cell, semaine, jour, role) {
    // Fermer le dropdown existant
    if (dropdownActif) {
        dropdownActif.remove();
        dropdownActif = null;
    }
    
    // Récupérer les personnes disponibles pour ce jour
    const personnesDisponibles = personnes.filter(p => 
        p.disponibilites.includes(jour)
    );
    
    if (personnesDisponibles.length === 0) {
        afficherMessage(`Aucune personne disponible pour ${jour}`, 'error');
        return;
    }
    
    // Filtrer les personnes déjà assignées à ce jour cette semaine (pour affichage seulement)
    const personnesDejaAssignees = planning
        .filter(aff => aff.semaine === semaine && aff.jour === jour && aff.role !== role)
        .map(aff => aff.personne);
    
    const personneActuelle = cell.dataset.personne;
    
    // Toutes les personnes disponibles pour ce jour s'affichent
    const personnesEligibles = personnesDisponibles;
    
    // Créer le dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    
    // Position du dropdown
    const rect = cell.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;
    
    // Option pour vider la cellule
    const emptyOption = document.createElement('div');
    emptyOption.className = 'autocomplete-item';
    emptyOption.innerHTML = '<span class="empty-cell">Vider</span>';
    emptyOption.onclick = () => {
        modifierAffectation(semaine, jour, role, null, cell);
        dropdown.remove();
        dropdownActif = null;
    };
    dropdown.appendChild(emptyOption);
    
    // Ajouter un séparateur
    if (personnesEligibles.length > 0) {
        const separator = document.createElement('div');
        separator.style.borderTop = '1px solid #e5e7eb';
        separator.style.margin = '0.25rem 0';
        dropdown.appendChild(separator);
    }
    
    // Options pour les personnes
    personnesEligibles.forEach(personne => {
        const option = document.createElement('div');
        option.className = 'autocomplete-item';
        
        const isDejaAssignee = personnesDejaAssignees.includes(personne.nom);
        
        if (personne.nom === personneActuelle) {
            option.classList.add('selected');
        }
        
        if (isDejaAssignee) {
            option.innerHTML = `${personne.nom} <span style="color: #ef4444; font-size: 0.75rem; margin-left: 0.5rem;">⚠ déjà assigné</span>`;
        } else {
            option.textContent = personne.nom;
        }
        
        option.onclick = () => {
            modifierAffectation(semaine, jour, role, personne.nom, cell);
            dropdown.remove();
            dropdownActif = null;
        };
        dropdown.appendChild(option);
    });
    
    // Message si aucune personne éligible
    if (personnesEligibles.length === 0) {
        const noOption = document.createElement('div');
        noOption.className = 'autocomplete-item';
        noOption.style.color = '#9ca3af';
        noOption.style.fontStyle = 'italic';
        noOption.textContent = 'Aucune personne disponible';
        dropdown.appendChild(noOption);
    }
    
    document.body.appendChild(dropdown);
    dropdownActif = dropdown;
}

function modifierAffectation(semaine, jour, role, nouvellePersonne, cell) {
    // Trouver et supprimer l'ancienne affectation
    const index = planning.findIndex(aff => 
        aff.semaine === semaine && 
        aff.jour === jour && 
        aff.role === role
    );
    
    if (index !== -1) {
        planning.splice(index, 1);
    }
    
    // Ajouter la nouvelle affectation si une personne est sélectionnée
    if (nouvellePersonne) {
        planning.push({
            semaine,
            jour,
            role,
            personne: nouvellePersonne
        });
    }
    
    // Mettre à jour la cellule
    cell.dataset.personne = nouvellePersonne || '';
    if (nouvellePersonne) {
        cell.innerHTML = nouvellePersonne;
        cell.classList.remove('empty-cell');
    } else {
        cell.innerHTML = '<span class="empty-cell">Vide</span>';
        cell.classList.add('empty-cell');
    }
    
    // Rafraîchir les statistiques
    rafraichirStats();
}

// Fermer le dropdown si on clique ailleurs
document.addEventListener('click', (e) => {
    if (dropdownActif && !e.target.closest('.autocomplete-dropdown') && !e.target.closest('.editable-cell')) {
        dropdownActif.remove();
        dropdownActif = null;
    }
});
