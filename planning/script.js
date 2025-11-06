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
    
    // Mettre à jour l'assistant en temps réel s'il est visible
    if (document.getElementById('assistantPanel').style.display !== 'none') {
        // Réinitialiser les conteneurs dans l'assistant pour inclure les nouveaux rôles
        const containerRoles = document.getElementById('assistantRolesContainer');
        containerRoles.innerHTML = ''; // Effacer le contenu actuel
        
        // Réinitialiser les filtres de l'assistant
        initialiserFiltresAssistant();
        
        // Mettre à jour l'affichage de l'assistant
        mettreAJourAssistant();
    }
    
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
    
    // Mettre à jour l'assistant en temps réel s'il est visible
    if (document.getElementById('assistantPanel').style.display !== 'none') {
        // Réinitialiser le conteneur des personnes dans l'assistant pour inclure la nouvelle personne
        const containerPersonnes = document.getElementById('assistantPersonnesContainer');
        containerPersonnes.innerHTML = ''; // Effacer le contenu actuel
        
        // Réinitialiser les filtres de l'assistant
        initialiserFiltresAssistant();
        
        // Mettre à jour l'affichage de l'assistant
        mettreAJourAssistant();
    }
    
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
    
    // Mettre à jour l'assistant en temps réel s'il est visible
    if (document.getElementById('assistantPanel').style.display !== 'none') {
        // Réinitialiser le conteneur des rôles dans l'assistant pour refléter la suppression
        const containerRoles = document.getElementById('assistantRolesContainer');
        containerRoles.innerHTML = ''; // Effacer le contenu actuel
        
        // Réinitialiser les filtres de l'assistant
        initialiserFiltresAssistant();
        
        // Mettre à jour l'affichage de l'assistant
        mettreAJourAssistant();
    }
    
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
    
    // Mettre à jour l'assistant en temps réel s'il est visible
    if (document.getElementById('assistantPanel').style.display !== 'none') {
        // Mettre à jour l'affichage de l'assistant pour refléter les nouvelles disponibilités
        mettreAJourAssistant();
    }
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
    
    // Mettre à jour l'assistant en temps réel s'il est visible
    if (document.getElementById('assistantPanel').style.display !== 'none') {
        // Réinitialiser les conteneurs dans l'assistant pour refléter la suppression
        const containerRoles = document.getElementById('assistantRolesContainer');
        containerRoles.innerHTML = ''; // Effacer le contenu actuel
        
        // Réinitialiser les filtres de l'assistant
        initialiserFiltresAssistant();
        
        // Mettre à jour l'affichage de l'assistant
        mettreAJourAssistant();
    }
    
    afficherMessage(`Jour "${jour}" supprimé`, 'success');
}

function supprimerPersonne(nom) {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    
    personnes = personnes.filter(p => p.nom !== nom);
    
    sauvegarderDonnees();
    afficherListes();
    mettreAJourSelects();
    
    // Mettre à jour l'assistant en temps réel s'il est visible
    if (document.getElementById('assistantPanel').style.display !== 'none') {
        // Réinitialiser le conteneur des personnes dans l'assistant pour refléter la suppression
        const containerPersonnes = document.getElementById('assistantPersonnesContainer');
        containerPersonnes.innerHTML = ''; // Effacer le contenu actuel
        
        // Réinitialiser les filtres de l'assistant
        initialiserFiltresAssistant();
        
        // Mettre à jour l'affichage de l'assistant
        mettreAJourAssistant();
    }
    
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
        div.className = 'flex items-center justify-between bg-blue-50 p-3 rounded-lg draggable-day';
        div.draggable = true;
        div.dataset.jour = jour;
        div.innerHTML = `
            <span class="font-medium text-gray-700 cursor-move"><i class="fas fa-grip-vertical mr-2"></i>${jour}</span>
            <button onclick="supprimerJour('${jour}')" 
                    class="text-red-500 hover:text-red-700 remove-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Add drag event listeners
        div.addEventListener('dragstart', handleDragStart);
        div.addEventListener('dragover', handleDragOver);
        div.addEventListener('dragenter', handleDragEnter);
        div.addEventListener('dragleave', handleDragLeave);
        div.addEventListener('drop', handleDrop);
        div.addEventListener('dragend', handleDragEnd);
        
        liste.appendChild(div);
    });
}

// Drag and drop variables
let dragSrcEl = null;

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('bg-blue-100');
}

function handleDragLeave(e) {
    this.classList.remove('bg-blue-100');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (dragSrcEl !== this) {
        // Swap the days in the array
        const fromJour = dragSrcEl.dataset.jour;
        const toJour = this.dataset.jour;
        
        const fromIndex = jours.indexOf(fromJour);
        const toIndex = jours.indexOf(toJour);
        
        // Remove from old position and insert at new position
        jours.splice(fromIndex, 1);
        if (toIndex >= fromIndex) {
            jours.splice(toIndex, 0, fromJour);
        } else {
            jours.splice(toIndex, 0, fromJour);
        }
        
        sauvegarderDonnees();
        afficherListeJours();
    }
    
    return false;
}

function handleDragEnd(e) {
    document.querySelectorAll('.draggable-day').forEach(div => {
        div.classList.remove('bg-blue-100');
    });
}

function reorganiserJours() {
    if (jours.length <= 1) {
        afficherMessage('Au moins 2 jours sont nécessaires pour réorganiser', 'error');
        return;
    }
    
    // Create a modal to reorder days
    const modal = document.createElement('div');
    modal.id = 'reorganiserModal';
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-xl p-6 max-w-md w-full max-h-96 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">Réorganiser les jours</h3>
                    <button onclick="fermerModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <p class="text-gray-600 mb-3">Faites glisser les jours pour modifier leur ordre:</p>
                    <div id="joursOrderList" class="space-y-2" style="min-height: 100px;">
                        <!-- Les jours seront ajoutés ici -->
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="enregistrerOrdreJours()" class="btn-gradient font-semibold py-2 px-4 rounded-lg flex-1">
                        Enregistrer
                    </button>
                    <button onclick="fermerModal()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Populate the order list with current days
    const orderList = document.getElementById('joursOrderList');
    jours.forEach((jour, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center bg-gray-100 p-3 rounded-lg draggable-item';
        item.draggable = true;
        item.dataset.index = index;
        item.innerHTML = `
            <i class="fas fa-grip-vertical text-gray-500 mr-3 cursor-move"></i>
            <span class="font-medium">${jour}</span>
        `;
        
        // Add drag event listeners
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            item.classList.add('opacity-50');
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('opacity-50');
        });
        
        orderList.appendChild(item);
    });
    
    // Add drop target events
    orderList.addEventListener('dragover', (e) => {
        e.preventDefault();
        orderList.classList.add('border-2', 'border-blue-300');
    });
    
    orderList.addEventListener('dragleave', () => {
        orderList.classList.remove('border-2', 'border-blue-300');
    });
    
    orderList.addEventListener('drop', (e) => {
        e.preventDefault();
        orderList.classList.remove('border-2', 'border-blue-300');
        
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const items = orderList.querySelectorAll('.draggable-item');
        const newIndex = Array.from(items).indexOf(e.target.closest('.draggable-item'));
        
        if (draggedIndex !== -1 && newIndex !== -1 && draggedIndex !== newIndex) {
            // Reorder the items in the UI
            if (draggedIndex < newIndex) {
                orderList.insertBefore(items[draggedIndex], items[newIndex].nextSibling);
            } else {
                orderList.insertBefore(items[draggedIndex], items[newIndex]);
            }
        }
    });
}

function enregistrerOrdreJours() {
    const items = document.querySelectorAll('#joursOrderList .draggable-item');
    const nouvelOrdre = [];
    
    items.forEach(item => {
        const index = parseInt(item.dataset.index);
        nouvelOrdre.push(jours[index]);
    });
    
    // Update the global jours array
    jours = nouvelOrdre;
    
    sauvegarderDonnees();
    afficherListeJours();
    
    fermerModal();
    
    afficherMessage('Ordre des jours enregistré avec succès', 'success');
}

function fermerModal() {
    const modal = document.getElementById('reorganiserModal');
    if (modal) {
        modal.remove();
    }
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
    

}

function afficherMessage(message, type, targetDiv = 'messagePlanning') {
    const messageDiv = document.getElementById(targetDiv);
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
        for (const jour of jours) { // This will respect the current order of jours array
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
                
                let personnesEligibles = personnesDisponibles.filter(p => 
                    !personnesDejaAssignees.includes(p.nom)
                );
                
                if (personnesEligibles.length === 0) {
                    // Aucune personne disponible, laisser vide
                    erreurs.push(`Semaine ${semaine}, ${jour}, ${role}: Aucune personne disponible (contrainte respectée)`);
                    continue;
                }
                
                // Règle de rotation: privilégier les personnes n'ayant pas encore fait ce rôle
                const personnesSansRole = personnesEligibles.filter(p => {
                    return !planning.some(aff => aff.personne === p.nom && aff.role === role);
                });
                
                // Si des personnes n'ont pas encore fait ce rôle, les privilégier
                if (personnesSansRole.length > 0) {
                    personnesEligibles = personnesSansRole;
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
    
    // Header Desktop
    let headerHTML = '<tr class="desktop-view"><th class="border-r border-gray-300">Jour</th><th class="border-r border-gray-300">Rôle</th>';
    for (let semaine = 1; semaine <= nbSemaines; semaine++) {
        headerHTML += `<th class="text-center">Semaine ${semaine}</th>`;
    }
    headerHTML += '</tr>';
    
    // Body Desktop - respecting the order of jours
    let bodyHTML = '';
    jours.forEach((jour, jourIndex) => {
        roles[jour].forEach((role, roleIndex) => {
            const isFirstRole = roleIndex === 0;
            const rowspan = roles[jour].length;
            
            bodyHTML += '<tr class="desktop-view">';
            
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
    
    // Mobile view - group by week, respecting the order of jours
    for (let semaine = 1; semaine <= nbSemaines; semaine++) {
        bodyHTML += `<tr class="mobile-view"><td colspan="3" class="week-header bg-gray-100 font-bold text-center py-3">Semaine ${semaine}</td></tr>`;
        
        jours.forEach(jour => {
            roles[jour].forEach(role => {
                const affectation = planning.find(a => 
                    a.semaine === semaine && 
                    a.jour === jour && 
                    a.role === role
                );
                
                const personne = affectation ? affectation.personne : '';
                const displayText = personne || '<span class="empty-cell">Vide</span>';
                const cellClass = personne ? 'editable-cell' : 'editable-cell empty-cell';
                
                bodyHTML += '<tr class="mobile-view">';
                bodyHTML += `<td data-label="Jour" class="font-semibold">${jour}</td>`;
                bodyHTML += `<td data-label="Rôle">${role}</td>`;
                bodyHTML += `<td data-label="Personne" class="${cellClass}" 
                    onclick="ouvrirAutocomplete(this, ${semaine}, '${jour}', '${role}')" 
                    data-semaine="${semaine}" 
                    data-jour="${jour}" 
                    data-role="${role}" 
                    data-personne="${personne}">${displayText}</td>`;
                bodyHTML += '</tr>';
            });
        });
    }
    
    table.innerHTML = `<thead>${headerHTML}</thead><tbody>${bodyHTML}</tbody>`;
    
    // Mettre à jour l'assistant
    mettreAJourAssistant();
}

// ===== ASSISTANT EN TEMPS RÉEL =====

let roleActifSurligne = null;

function mettreAJourAssistant() {
    const panel = document.getElementById('assistantPanel');
    const content = document.getElementById('assistantContent');
    const analyseDiv = document.getElementById('assistantAnalyse');
    
    if (planning.length === 0) {
        panel.style.display = 'none';
        return;
    }
    
    panel.style.display = 'block';
    
    // Initialiser les filtres (checkboxes)
    initialiserFiltresAssistant();
    
    // Récupérer les filtres sélectionnés
    const personnesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-personne:checked')).map(cb => cb.value);
    const rolesFiltres = Array.from(document.querySelectorAll('.assistant-filter-role:checked')).map(cb => cb.value);
    const semainesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-semaine:checked')).map(cb => parseInt(cb.value));
    
    // Récupérer l'état d'assignation sélectionné
    const statutAssignation = document.querySelector('input[name="assistantStatut"]:checked').value;
    
    // Obtenir tous les rôles uniques dans l'ordre d'apparition (comme dans le tableau d'assignation)
    const tousLesRoles = [];
    jours.forEach(jour => { // This ensures the roles follow the correct day order
        roles[jour].forEach(role => {
            if (rolesFiltres.includes(role) && !tousLesRoles.includes(role)) {
                tousLesRoles.push(role);
            }
        });
    });
    const rolesArray = tousLesRoles;
    
    // Construire le tableau récapitulatif
    let html = '<div class="overflow-x-auto">';
    html += '<table class="w-full text-xs border-collapse">';
    
    // En-tête du tableau
    html += '<thead><tr class="bg-gray-100">';
    html += '<th class="border border-gray-300 p-1 text-left sticky left-0 bg-gray-100 z-10">Personne</th>';
    rolesArray.forEach(role => {
        html += `<th class="border border-gray-300 p-1 text-center">${role}</th>`;
    });
    html += '</tr></thead>';
    
    // Corps du tableau
    html += '<tbody>';
    personnes.filter(p => personnesFiltrees.includes(p.nom)).forEach(personne => {
        html += '<tr class="hover:bg-gray-50">';
        
        // Colonne nom (cliquable pour surligner)
        html += `<td class="border border-gray-300 p-1 font-semibold sticky left-0 bg-white cursor-pointer hover:bg-blue-50" 
                     onclick="surlignerPersonne('${personne.nom}')" 
                     title="${personne.disponibilites.join(', ')}" 
                     data-label="Personne">${personne.nom}</td>`;
        
        // Colonnes rôles
        rolesArray.forEach(role => {
            // Vérifier si la personne est disponible pour ce rôle
            let estDisponible = false;
            let jourDispo = null;
            jours.forEach(jour => {
                if (roles[jour] && roles[jour].includes(role) && personne.disponibilites.includes(jour)) {
                    estDisponible = true;
                    jourDispo = jour;
                }
            });
            
            if (!estDisponible) {
                // Non disponible
                // Check if we should show unavailable cells based on status filter
                if (statutAssignation === 'unassigned' || statutAssignation === 'all') {
                    html += `<td class="border border-gray-300 p-1 text-center bg-gray-200 text-gray-500" data-label="${role}">—</td>`;
                }
            } else {
                // Compter les assignations pour ce rôle (toutes semaines)
                const nbAssignations = planning.filter(aff => 
                    aff.personne === personne.nom && 
                    aff.role === role &&
                    semainesFiltrees.includes(aff.semaine)
                ).length;
                
                if (nbAssignations > 0) {
                    // Assigné - afficher le nombre en vert (cliquable pour surligner)
                    if (statutAssignation === 'assigned' || statutAssignation === 'all') {
                        html += `<td class="border border-gray-300 p-1 text-center bg-green-100 cursor-pointer hover:bg-green-200" 
                                     onclick="surlignerRole('${personne.nom}', '${role}')" 
                                     title="Assigné ${nbAssignations} fois"
                                     data-label="${role}">
                                    <span class="text-green-800 font-bold">✓ ${nbAssignations}</span>
                                 </td>`;
                    } else if (statutAssignation === 'unassigned') {
                        // If showing only unassigned, don't display assigned cells
                        html += `<td class="border border-gray-300 p-1 text-center bg-gray-50 text-gray-300" data-label="${role}">—</td>`;
                    }
                } else {
                    // Non assigné - croix rouge
                    if (statutAssignation === 'unassigned' || statutAssignation === 'all') {
                        html += `<td class="border border-gray-300 p-1 text-center bg-red-50 cursor-pointer hover:bg-red-100" 
                                     onclick="surlignerRole('${personne.nom}', '${role}')" 
                                     title="Jamais assigné"
                                     data-label="${role}">
                                    <span class="text-red-600 font-bold">✗</span>
                                 </td>`;
                    } else if (statutAssignation === 'assigned') {
                        // If showing only assigned, don't display unassigned cells
                        html += `<td class="border border-gray-300 p-1 text-center bg-gray-50 text-gray-300" data-label="${role}">—</td>`;
                    }
                }
            }
        });
        
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    
    content.innerHTML = html;
    
    // Générer l'analyse des rôles jamais assignés
    genererAnalyseRolesNonAssignes(analyseDiv, personnesFiltrees, rolesFiltres, semainesFiltrees);
}

function genererAnalyseRolesNonAssignes(container, personnesFiltrees, rolesFiltres, semainesFiltrees) {
    if (planning.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4 text-sm">Aucune analyse disponible</div>';
        return;
    }
    
    // Liste des rôles jamais assignés
    const rolesNonAssignes = [];
    
    rolesFiltres.forEach(role => {
        const estAssigne = planning.some(aff => 
            aff.role === role && 
            personnesFiltrees.includes(aff.personne) &&
            semainesFiltrees.includes(aff.semaine)
        );
        
        if (!estAssigne) {
            rolesNonAssignes.push(role);
        }
    });
    
    let html = '<div class="text-sm mt-3">';
    html += '<div class="font-semibold text-gray-700 mb-2">🔴 Rôles jamais assignés</div>';
    
    if (rolesNonAssignes.length > 0) {
        html += '<ul class="text-xs text-gray-600 ml-4 list-disc">';
        rolesNonAssignes.forEach(role => {
            html += `<li>${role}</li>`;
        });
        html += '</ul>';
    } else {
        html += '<div class="text-xs text-gray-500 italic">Tous les rôles ont été assignés</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function initialiserFiltresAssistant() {
    const containerPersonnes = document.getElementById('assistantPersonnesContainer');
    const containerRoles = document.getElementById('assistantRolesContainer');
    const containerSemaines = document.getElementById('assistantSemainesContainer');
    
    // Obtenir les sélections actuelles avant de réinitialiser
    const selectedPersonnes = Array.from(document.querySelectorAll('.assistant-filter-personne:checked')).map(cb => cb.value);
    const selectedRoles = Array.from(document.querySelectorAll('.assistant-filter-role:checked')).map(cb => cb.value);
    const selectedSemaines = Array.from(document.querySelectorAll('.assistant-filter-semaine:checked')).map(cb => parseInt(cb.value));
    
    // Obtenir tous les rôles uniques
    const tousLesRoles = new Set();
    jours.forEach(jour => {
        roles[jour].forEach(role => tousLesRoles.add(role));
    });
    
    const nbSemaines = parseInt(document.getElementById('nbSemaines').value);
    
    // Remplir personnes - réinitialiser mais conserver les sélections existantes
    containerPersonnes.innerHTML = '';
    personnes.forEach(p => {
        // Si aucune sélection n'existe (première fois), sélectionner par défaut
        const shouldCheck = selectedPersonnes.length === 0 || selectedPersonnes.includes(p.nom);
        const label = document.createElement('label');
        label.className = 'flex items-center gap-1.5 mb-0.5 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="assistant-filter-personne cursor-pointer" value="${p.nom}" ${shouldCheck ? 'checked' : ''} onchange="mettreAJourAssistant(); verifierEtatTousCheckbox();">
            <span>${p.nom}</span>
        `;
        containerPersonnes.appendChild(label);
    });
    
    // Remplir rôles - réinitialiser mais conserver les sélections existantes
    containerRoles.innerHTML = '';
    Array.from(tousLesRoles).sort().forEach(role => {
        // Si aucune sélection n'existe (première fois), sélectionner par défaut
        const shouldCheck = selectedRoles.length === 0 || selectedRoles.includes(role);
        const label = document.createElement('label');
        label.className = 'flex items-center gap-1.5 mb-0.5 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="assistant-filter-role cursor-pointer" value="${role}" ${shouldCheck ? 'checked' : ''} onchange="mettreAJourAssistant(); verifierEtatTousCheckbox();">
            <span>${role}</span>
        `;
        containerRoles.appendChild(label);
    });
    
    // Remplir semaines - réinitialiser mais conserver les sélections existantes
    containerSemaines.innerHTML = '';
    for (let i = 1; i <= nbSemaines; i++) {
        // Si aucune sélection n'existe (première fois), sélectionner par défaut
        const shouldCheck = selectedSemaines.length === 0 || selectedSemaines.includes(i);
        const label = document.createElement('label');
        label.className = 'flex items-center gap-1.5 mb-0.5 cursor-pointer';
        label.innerHTML = `
            <input type="checkbox" class="assistant-filter-semaine cursor-pointer" value="${i}" ${shouldCheck ? 'checked' : ''} onchange="mettreAJourAssistant(); verifierEtatTousCheckbox();">
            <span>S${i}</span>
        `;
        containerSemaines.appendChild(label);
    }
}

function toggleAssistantPersonnes() {
    const checked = document.getElementById('assistantAllPersonnes').checked;
    document.querySelectorAll('.assistant-filter-personne').forEach(cb => {
        cb.checked = checked;
    });
    mettreAJourAssistant();
}

function toggleAssistantRoles() {
    const checked = document.getElementById('assistantAllRoles').checked;
    document.querySelectorAll('.assistant-filter-role').forEach(cb => {
        cb.checked = checked;
    });
    mettreAJourAssistant();
}

function toggleAssistantSemaines() {
    const checked = document.getElementById('assistantAllSemaines').checked;
    document.querySelectorAll('.assistant-filter-semaine').forEach(cb => {
        cb.checked = checked;
    });
    mettreAJourAssistant();
}

// Fonction pour synchroniser l'état du checkbox "Tous" avec les checkboxes individuels
function verifierEtatTousCheckbox() {
    // Vérifier l'état des personnes
    const personnesCheckboxes = document.querySelectorAll('.assistant-filter-personne');
    const personnesChecked = document.querySelectorAll('.assistant-filter-personne:checked');
    const tousPersonnes = document.getElementById('assistantAllPersonnes');
    if (personnesCheckboxes.length > 0) {
        tousPersonnes.checked = personnesChecked.length === personnesCheckboxes.length;
    } else {
        tousPersonnes.checked = false;
    }
    
    // Vérifier l'état des rôles
    const rolesCheckboxes = document.querySelectorAll('.assistant-filter-role');
    const rolesChecked = document.querySelectorAll('.assistant-filter-role:checked');
    const tousRoles = document.getElementById('assistantAllRoles');
    if (rolesCheckboxes.length > 0) {
        tousRoles.checked = rolesChecked.length === rolesCheckboxes.length;
    } else {
        tousRoles.checked = false;
    }
    
    // Vérifier l'état des semaines
    const semainesCheckboxes = document.querySelectorAll('.assistant-filter-semaine');
    const semainesChecked = document.querySelectorAll('.assistant-filter-semaine:checked');
    const tousSemaines = document.getElementById('assistantAllSemaines');
    if (semainesCheckboxes.length > 0) {
        tousSemaines.checked = semainesChecked.length === semainesCheckboxes.length;
    } else {
        tousSemaines.checked = false;
    }
}

// Fonction appelée après chaque mise à jour de l'assistant pour synchroniser les "Tous" checkboxes
function miseAJourApresAssistant() {
    verifierEtatTousCheckbox();
}

function surlignerCellule(semaine, jour, role, personne) {
    // Retirer tous les surlignages
    document.querySelectorAll('.highlight-cell').forEach(cell => {
        cell.classList.remove('highlight-cell');
    });
    
    // Surligner la cellule spécifique
    document.querySelectorAll('.editable-cell').forEach(cell => {
        const cellSemaine = parseInt(cell.dataset.semaine);
        const cellJour = cell.dataset.jour;
        const cellRole = cell.dataset.role;
        const cellPersonne = cell.dataset.personne;
        
        if (cellSemaine === semaine && cellJour === jour && cellRole === role && cellPersonne === personne) {
            cell.classList.add('highlight-cell');
            // Scroll vers la cellule
            cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

function surlignerPersonne(nomPersonne) {
    // Retirer tous les surlignages
    document.querySelectorAll('.highlight-cell').forEach(cell => {
        cell.classList.remove('highlight-cell');
    });
    
    // Surligner toutes les cellules de cette personne selon les filtres actifs
    const personnesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-personne:checked')).map(cb => cb.value);
    const rolesFiltres = Array.from(document.querySelectorAll('.assistant-filter-role:checked')).map(cb => cb.value);
    const semainesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-semaine:checked')).map(cb => parseInt(cb.value));
    
    document.querySelectorAll('.editable-cell').forEach(cell => {
        const cellPersonne = cell.dataset.personne;
        const cellSemaine = parseInt(cell.dataset.semaine);
        const cellRole = cell.dataset.role;
        
        if (cellPersonne === nomPersonne && 
            personnesFiltrees.includes(cellPersonne) &&
            rolesFiltres.includes(cellRole) &&
            semainesFiltrees.includes(cellSemaine)) {
            cell.classList.add('highlight-cell');
        }
    });
    
    // Scroll vers la première cellule surlignnée
    const firstHighlighted = document.querySelector('.highlight-cell');
    if (firstHighlighted) {
        firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function surlignerRole(personne, role) {
    // Retirer tous les surlignages
    document.querySelectorAll('.highlight-cell').forEach(cell => {
        cell.classList.remove('highlight-cell');
    });
    
    // Retirer active des pills
    document.querySelectorAll('.role-pill.active').forEach(pill => {
        pill.classList.remove('active');
    });
    
    // Si on clique sur le même rôle, désactiver
    if (roleActifSurligne && roleActifSurligne.personne === personne && roleActifSurligne.role === role) {
        roleActifSurligne = null;
        return;
    }
    
    // Activer le nouveau rôle
    roleActifSurligne = { personne, role };
    
    // Surligner les cellules correspondantes selon les filtres
    const semainesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-semaine:checked')).map(cb => parseInt(cb.value));
    
    document.querySelectorAll('.editable-cell').forEach(cell => {
        const cellRole = cell.dataset.role;
        const cellPersonne = cell.dataset.personne;
        const cellSemaine = parseInt(cell.dataset.semaine);
        
        if (cellRole === role && cellPersonne === personne && semainesFiltrees.includes(cellSemaine)) {
            cell.classList.add('highlight-cell');
        }
    });
    
    // Activer la pill cliquée
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Scroll vers la première cellule surlignée
    const firstHighlighted = document.querySelector('.highlight-cell');
    if (firstHighlighted) {
        firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function calculerStatsEquite(personnesFiltrees, rolesFiltres, semainesFiltrees) {
    const stats = {};
    
    personnes.filter(p => personnesFiltrees.includes(p.nom)).forEach(personne => {
        // Compter les opportunités (rôles disponibles * semaines filtrées)
        let nbOpportunites = 0;
        let nbRolesNonDisponibles = 0;
        let rolesDisponibles = [];
        
        // Calculer les opportunités pour les rôles filtrés
        rolesFiltres.forEach(role => {
            let personneDispoRole = false;
            jours.forEach(jour => {
                if (roles[jour] && roles[jour].includes(role)) {
                    if (personne.disponibilites.includes(jour)) {
                        personneDispoRole = true;
                        rolesDisponibles.push(role);
                    }
                }
            });
            
            if (personneDispoRole) {
                nbOpportunites += semainesFiltrees.length;
            } else {
                nbRolesNonDisponibles++;
            }
        });
        
        // Compter les assignations réelles
        const assignations = planning.filter(aff => 
            aff.personne === personne.nom &&
            rolesFiltres.includes(aff.role) &&
            semainesFiltrees.includes(aff.semaine)
        );
        
        const nbAssignations = assignations.length;
        
        // Compter les rôles jamais assignés (même hors filtre)
        const rolesAssignesGlobal = new Set(
            planning.filter(aff => aff.personne === personne.nom).map(aff => aff.role)
        );
        
        const rolesDisponiblesUniques = [...new Set(rolesDisponibles)];
        const nbRolesNonAssignes = rolesDisponiblesUniques.filter(r => !rolesAssignesGlobal.has(r)).length;
        
        // Calculer le taux d'assignation
        const tauxAssignation = nbOpportunites > 0 ? (nbAssignations / nbOpportunites) * 100 : 0;
        
        // Déterminer la couleur selon l'équité
        let couleurEquite;
        if (tauxAssignation < 40) {
            couleurEquite = '#dc2626'; // Rouge - sous-utilisé
        } else if (tauxAssignation < 60) {
            couleurEquite = '#ea580c'; // Orange
        } else if (tauxAssignation < 75) {
            couleurEquite = '#16a34a'; // Vert - équilibré
        } else if (tauxAssignation <= 90) {
            couleurEquite = '#2563eb'; // Bleu
        } else {
            couleurEquite = '#7c2d12'; // Marron - sur-utilisé
        }
        
        stats[personne.nom] = {
            nbOpportunites,
            nbAssignations,
            tauxAssignation,
            couleurEquite,
            nbRolesNonAssignes,
            nbRolesNonDisponibles
        };
    });
    
    return stats;
}

function genererAnalyseEquite(container, statsEquite) {
    if (planning.length === 0 || Object.keys(statsEquite).length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4 text-sm">Aucune analyse disponible</div>';
        return;
    }
    
    let html = '<div class="text-sm space-y-3">';
    
    // Titre
    html += '<div class="font-semibold text-gray-700 mb-2"><i class="fas fa-balance-scale mr-2"></i>Analyse d\'\u00e9quit\u00e9 avancée</div>';
    
    // Calculer les métriques globales
    const tousLesTaux = Object.values(statsEquite).map(s => s.tauxAssignation);
    const moyenneTaux = tousLesTaux.reduce((a, b) => a + b, 0) / tousLesTaux.length;
    const ecartType = Math.sqrt(tousLesTaux.map(x => Math.pow(x - moyenneTaux, 2)).reduce((a, b) => a + b, 0) / tousLesTaux.length);
    
    const personnesSousUtilisees = Object.entries(statsEquite).filter(([_, s]) => s.tauxAssignation < 50);
    const personnesSurUtilisees = Object.entries(statsEquite).filter(([_, s]) => s.tauxAssignation > 80);
    const personnesAvecRolesNonAssignes = Object.entries(statsEquite).filter(([_, s]) => s.nbRolesNonAssignes > 0);
    
    // Métriques globales
    html += '<div class="bg-blue-50 border border-blue-200 rounded p-2">';
    html += '<div class="text-xs font-semibold text-blue-900 mb-1">📊 Métriques globales</div>';
    html += `<div class="text-xs text-gray-700">`;
    html += `Taux moyen: ${moyenneTaux.toFixed(1)}% | Écart-type: ${ecartType.toFixed(1)}%`;
    html += `</div></div>`;
    
    // Alertes d'équité
    if (personnesSousUtilisees.length > 0) {
        html += '<div class="bg-red-50 border border-red-200 rounded p-2">';
        html += '<div class="text-xs font-semibold text-red-900 mb-1">⚠️ Personnes sous-utilisées (< 50%)</div>';
        html += '<ul class="text-xs text-gray-700 ml-4 space-y-0.5">';
        personnesSousUtilisees.forEach(([nom, stats]) => {
            html += `<li><span class="font-semibold cursor-pointer hover:text-blue-600" onclick="surlignerPersonne('${nom}')">${nom}</span>: ${stats.tauxAssignation.toFixed(0)}% (${stats.nbAssignations}/${stats.nbOpportunites})</li>`;
        });
        html += '</ul></div>';
    }
    
    if (personnesSurUtilisees.length > 0) {
        html += '<div class="bg-orange-50 border border-orange-200 rounded p-2">';
        html += '<div class="text-xs font-semibold text-orange-900 mb-1">⚠️ Personnes sur-utilisées (> 80%)</div>';
        html += '<ul class="text-xs text-gray-700 ml-4 space-y-0.5">';
        personnesSurUtilisees.forEach(([nom, stats]) => {
            html += `<li><span class="font-semibold cursor-pointer hover:text-blue-600" onclick="surlignerPersonne('${nom}')">${nom}</span>: ${stats.tauxAssignation.toFixed(0)}% (${stats.nbAssignations}/${stats.nbOpportunites})</li>`;
        });
        html += '</ul></div>';
    }
    
    if (personnesAvecRolesNonAssignes.length > 0) {
        html += '<div class="bg-yellow-50 border border-yellow-200 rounded p-2">';
        html += '<div class="text-xs font-semibold text-yellow-900 mb-1">🔴 Rôles jamais assignés</div>';
        html += '<ul class="text-xs text-gray-700 ml-4 space-y-0.5">';
        personnesAvecRolesNonAssignes.forEach(([nom, stats]) => {
            html += `<li><span class="font-semibold cursor-pointer hover:text-blue-600" onclick="surlignerPersonne('${nom}')">${nom}</span>: ${stats.nbRolesNonAssignes} rôle(s) disponible(s) non assigné(s)</li>`;
        });
        html += '</ul></div>';
    }
    
    // Recommandations
    if (ecartType > 20) {
        html += '<div class="bg-purple-50 border border-purple-200 rounded p-2">';
        html += '<div class="text-xs font-semibold text-purple-900 mb-1">💡 Recommandations</div>';
        html += '<div class="text-xs text-gray-700">';
        html += 'Écart-type élevé détecté. Considérez de rééquilibrer les assignations pour plus d\'\u00e9quité.';
        html += '</div></div>';
    } else {
        html += '<div class="bg-green-50 border border-green-200 rounded p-2">';
        html += '<div class="text-xs font-semibold text-green-900">✅ Planning équilibré</div>';
        html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function genererResumeRoles(container) {
    // Calculer les rôles jamais assignés pour chaque personne
    const rôlesJamaisAssignésParPersonne = {};

    personnes.forEach(personne => {
        // Récupérer tous les rôles disponibles pour cette personne
        const rôlesDisponibles = new Set();
        personne.disponibilites.forEach(jour => {
            if (roles[jour]) {
                roles[jour].forEach(role => rôlesDisponibles.add(role));
            }
        });
        
        // Récupérer les rôles déjà assignés à cette personne
        const rôlesAssignés = new Set();
        planning.forEach(aff => {
            if (aff.personne === personne.nom) {
                rôlesAssignés.add(aff.role);
            }
        });
        
        // Récupérer les rôles jamais assignés à cette personne
        const rôlesJamaisAssignés = [];
        rôlesDisponibles.forEach(role => {
            if (!rôlesAssignés.has(role)) {
                rôlesJamaisAssignés.push(role);
            }
        });
        
        // Enregistrer les données
        rôlesJamaisAssignésParPersonne[personne.nom] = rôlesJamaisAssignés;
    });
    
    // Section pour les rôles jamais assignés (disponibles mais non assignés) pour chaque personne
    let html = '';
    html += '<div class="text-sm font-semibold text-gray-700 mb-2">Rôles jamais assignés:</div>';
    
    let jamaisAssignésHtml = '';
    let personnesAvecRolesJamaisAssignes = [];
    
    personnes.forEach(personne => {
        const rôles = rôlesJamaisAssignésParPersonne[personne.nom];
        if (rôles.length > 0) {
            personnesAvecRolesJamaisAssignes.push({
                nom: personne.nom,
                nbRoles: rôles.length
            });
        }
    });
    
    // Trier les personnes par nombre de rôles non assignés (décroissant)
    personnesAvecRolesJamaisAssignes.sort((a, b) => b.nbRoles - a.nbRoles);
    
    personnesAvecRolesJamaisAssignes.forEach(personne => {
        jamaisAssignésHtml += `
            <div class="flex items-center mb-1">
                <span class="font-semibold text-gray-800 cursor-pointer hover:text-blue-600" 
                      onclick="surlignerPersonne('${personne.nom}')">
                    ${personne.nom}:
                </span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-1">
                    ${personne.nbRoles} rôle(s) disponible(s) non assigné(s)
                </span>
            </div>
        `;
    });
    
    if (jamaisAssignésHtml) {
        html += jamaisAssignésHtml;
    } else {
        html += '<div class="text-gray-500 italic">Aucun rôle non assigné</div>';
    }
    
    container.innerHTML = html;
}

function genererAnalyseRepetitions(container) {
    if (planning.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">Aucune analyse disponible</div>';
        return;
    }
    
    const nbSemaines = parseInt(document.getElementById('nbSemaines').value);
    
    // Détecter les répétitions verticales (même personne, même rôle, semaines consécutives)
    const repetitionsVerticales = [];
    
    jours.forEach(jour => {
        roles[jour].forEach(role => {
            for (let sem = 1; sem < nbSemaines; sem++) {
                const aff1 = planning.find(a => a.semaine === sem && a.jour === jour && a.role === role);
                const aff2 = planning.find(a => a.semaine === sem + 1 && a.jour === jour && a.role === role);
                
                if (aff1 && aff2 && aff1.personne === aff2.personne) {
                    repetitionsVerticales.push({
                        personne: aff1.personne,
                        jour,
                        role,
                        semaines: [sem, sem + 1]
                    });
                }
            }
        });
    });
    
    // Détecter les répétitions horizontales (même personne, même jour, semaine donnée, plusieurs rôles)
    const repetitionsHorizontales = [];
    
    for (let sem = 1; sem <= nbSemaines; sem++) {
        jours.forEach(jour => {
            const affectationsJour = planning.filter(a => a.semaine === sem && a.jour === jour);
            const compteurs = {};
            
            affectationsJour.forEach(aff => {
                compteurs[aff.personne] = (compteurs[aff.personne] || 0) + 1;
            });
            
            Object.entries(compteurs).forEach(([personne, count]) => {
                if (count > 1) {
                    const rolesAssignes = affectationsJour
                        .filter(a => a.personne === personne)
                        .map(a => a.role);
                    
                    repetitionsHorizontales.push({
                        personne,
                        jour,
                        semaine: sem,
                        roles: rolesAssignes,
                        count
                    });
                }
            });
        });
    }
    
    // Générer l'HTML de l'analyse
    let html = '<div class="text-sm">';
    
    html += '<div class="font-semibold text-gray-700 mb-2"><i class="fas fa-chart-line mr-2"></i>Analyse des répétitions</div>';
    
    if (repetitionsVerticales.length === 0 && repetitionsHorizontales.length === 0) {
        html += '<div class="text-gray-600">✓ Aucune répétition détectée</div>';
    } else {
        if (repetitionsVerticales.length > 0) {
            html += '<div class="mb-3">';
            html += '<div class="text-xs font-semibold text-orange-600 mb-1">⚠ Répétitions verticales:</div>';
            html += '<ul class="text-xs text-gray-700 space-y-1 ml-4">';
            
            repetitionsVerticales.forEach(rep => {
                html += `<li>${rep.personne}: ${rep.role} (${rep.jour}) - semaines ${rep.semaines.join(', ')}</li>`;
            });
            
            html += '</ul></div>';
        }
        
        if (repetitionsHorizontales.length > 0) {
            html += '<div class="mb-3">';
            html += '<div class="text-xs font-semibold text-blue-600 mb-1">ℹ Répétitions horizontales:</div>';
            html += '<ul class="text-xs text-gray-700 space-y-1 ml-4">';
            
            repetitionsHorizontales.forEach(rep => {
                html += `<li>${rep.personne}: ${rep.count} rôles le ${rep.jour} (S${rep.semaine}) - ${rep.roles.join(', ')}</li>`;
            });
            
            html += '</ul></div>';
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
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
        return jours.indexOf(a.jour) - jours.indexOf(b.jour); // This ensures the order follows jours array
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
    
    // Rafraîchir les statistiques et l'assistant
    rafraichirStats();
    mettreAJourAssistant();
}

// Fermer le dropdown si on clique ailleurs
document.addEventListener('click', (e) => {
    if (dropdownActif && !e.target.closest('.autocomplete-dropdown') && !e.target.closest('.editable-cell')) {
        dropdownActif.remove();
        dropdownActif = null;
    }
});

// ===== RÉINITIALISATION DU PLANNING =====

function reinitialiserPlanning() {
    if (!confirm('Voulez-vous vraiment réinitialiser le planning ? Toutes les affectations seront supprimées.')) {
        return;
    }
    
    planning = [];
    
    // Vider le tableau
    const table = document.getElementById('tableauPlanning');
    table.innerHTML = `
        <thead class="desktop-view">
            <tr>
                <th>Semaine</th>
            </tr>
        </thead>
        <tbody>
            <tr class="desktop-view">
                <td class="text-center text-gray-500 py-12">
                    <i class="fas fa-calendar-times text-6xl mb-4 text-gray-300"></i>
                    <p class="text-lg">Aucun planning généré. Cliquez sur "GÉNÉRER PLANNING"</p>
                </td>
            </tr>
            <tr class="mobile-view">
                <td class="text-center text-gray-500 py-12">
                    <i class="fas fa-calendar-times text-6xl mb-4 text-gray-300"></i>
                    <p class="text-lg">Aucun planning généré. Cliquez sur "GÉNÉRER PLANNING"</p>
                </td>
            </tr>
        </tbody>
    `;
    
    // Cacher l'assistant
    document.getElementById('assistantPanel').style.display = 'none';
    
    afficherMessage('Planning réinitialisé', 'success');
}

// ===== IMPORT/EXPORT JSON =====

function importerJSON() {
    // Trigger file input click
    document.getElementById('importFile').click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        afficherMessage('Veuillez sélectionner un fichier JSON valide', 'error');
        event.target.value = ''; // Reset file input
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);
            if (importerDonneesJSON(jsonData)) {
                afficherMessage('Données importées avec succès !', 'success', 'messageConfigurer');
                afficherListes();
                mettreAJourSelects();
            }
        } catch (error) {
            console.error('Erreur lors de l\'importation du JSON:', error);
            afficherMessage(`Format JSON invalide: ${error.message}`, 'error', 'messageConfigurer');
        }
        // Reset file input after processing
        event.target.value = '';
    };
    
    reader.onerror = function() {
        afficherMessage('Erreur lors de la lecture du fichier', 'error', 'messageConfigurer');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

function importerDonneesJSON(data) {
    // Validation du JSON
    if (!data.jours || !Array.isArray(data.jours)) {
        afficherMessage('Structure JSON invalide: "jours" manquant ou non-array', 'error', 'messageConfigurer');
        return false;
    }
    
    if (!data.roles || typeof data.roles !== 'object') {
        afficherMessage('Structure JSON invalide: "roles" manquant ou non-object', 'error', 'messageConfigurer');
        return false;
    }
    
    if (!data.personnes || !Array.isArray(data.personnes)) {
        afficherMessage('Structure JSON invalide: "personnes" manquant ou non-array', 'error', 'messageConfigurer');
        return false;
    }
    
    // Validation supplémentaire: Vérifier que les rôles correspondent aux jours
    for (const jour of data.jours) {
        if (!data.roles[jour]) {
            afficherMessage(`Aucun rôle défini pour le jour "${jour}"`, 'error', 'messageConfigurer');
            return false;
        }
        
        if (!Array.isArray(data.roles[jour])) {
            afficherMessage(`Rôles pour "${jour}" n'est pas un tableau`, 'error', 'messageConfigurer');
            return false;
        }
    }
    
    // Validation des personnes: vérifier que les disponibilités correspondent à des jours existants
    for (const personne of data.personnes) {
        if (!personne.nom) {
            afficherMessage('Une personne n\'a pas de nom', 'error', 'messageConfigurer');
            return false;
        }
        
        if (!Array.isArray(personne.disponibilites)) {
            afficherMessage(`Disponibilités de "${personne.nom}" n'est pas un tableau`, 'error', 'messageConfigurer');
            return false;
        }
        
        for (const dispo of personne.disponibilites) {
            if (!data.jours.includes(dispo)) {
                afficherMessage(`Le jour "${dispo}" pour la personne "${personne.nom}" n'existe pas`, 'error', 'messageConfigurer');
                return false;
            }
        }
    }
    
    // Copier les données depuis le JSON
    jours = [...data.jours];
    roles = JSON.parse(JSON.stringify(data.roles));
    personnes = JSON.parse(JSON.stringify(data.personnes));
    
    // Sauvegarder les données
    sauvegarderDonnees();
    
    return true;
}

function exporterJSON() {
    const data = {
        jours,
        roles,
        personnes
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'planning_config.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// ===== EXPORT/IMPORT PLANNING AVEC AFFECTATIONS =====

function exporterPlanningJSON() {
    if (planning.length === 0) {
        afficherMessage('Aucun planning à exporter', 'error');
        return;
    }
    
    const data = {
        config: {
            jours,
            roles,
            personnes
        },
        planning: planning,
        nbSemaines: parseInt(document.getElementById('nbSemaines').value),
        dateExport: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const date = new Date().toISOString().split('T')[0];
    const exportFileDefaultName = `planning_complet_${date}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    afficherMessage('Planning exporté avec succès', 'success');
}

function importerPlanningJSON() {
    document.getElementById('importPlanningFile').click();
}

function handlePlanningImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
        afficherMessage('Veuillez sélectionner un fichier JSON valide', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Valider la structure
            if (!data.config || !data.planning || !data.nbSemaines) {
                afficherMessage('Structure du fichier invalide', 'error');
                return;
            }
            
            // Importer la configuration
            jours = [...data.config.jours];
            roles = JSON.parse(JSON.stringify(data.config.roles));
            personnes = JSON.parse(JSON.stringify(data.config.personnes));
            
            // Importer le planning
            planning = [...data.planning];
            
            // Mettre à jour le nombre de semaines
            document.getElementById('nbSemaines').value = data.nbSemaines;
            
            // Sauvegarder
            sauvegarderDonnees();
            
            // Afficher
            afficherListes();
            mettreAJourSelects();
            afficherTableauPlanning();
            mettreAJourAssistant();
            
            afficherMessage('Planning importé avec succès', 'success');
        } catch (error) {
            console.error('Erreur import:', error);
            afficherMessage(`Erreur lors de l'import: ${error.message}`, 'error');
        }
        event.target.value = '';
    };
    
    reader.onerror = function() {
        afficherMessage('Erreur lors de la lecture du fichier', 'error');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}
