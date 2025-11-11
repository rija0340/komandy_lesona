// État de l'application - Version simplifiée basée sur les dates
let personnes = []; // [{nom}]
let planning = []; // [{semaine, date, jour, role, personne}]

// Variables pour la gestion par dates
let datesSelectionnees = []; // Array of "YYYY-MM-DD" strings
let membresSelectionnes = []; // Array of person names
let disponibilitesParDate = {}; // { "YYYY-MM-DD": { personName: true/false } }
let rolesParTypeJour = {}; // { 0: ["ROLE1"], 1: ["ROLE2"] } where 0=Sunday, 1=Monday, etc.

// Variables obsolètes mais conservées pour compatibilité
let jours = []; // Ancien système - maintenant vide
let roles = {}; // Ancien système - maintenant vide

// Flatpickr instance
let datePickerInstance = null;

// Noms des jours de la semaine (en français)
const JOURS_SEMAINE = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    chargerDonnees();
    initialiserDatePicker();
    afficherDatesSelectionnees();
    afficherRolesParTypeJour();
    afficherMembresSelection();
    afficherGrilleDisponibilite();
    afficherListePersonnes();
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

// ===== GESTION DES DATES ET MEMBRES =====

/**
 * Initialise le sélecteur de dates Flatpickr
 */
function initialiserDatePicker() {
    const datePicker = document.getElementById('datePicker');
    if (!datePicker) return;

    if (datePickerInstance) {
        datePickerInstance.destroy();
    }

    datePickerInstance = flatpickr(datePicker, {
        mode: "multiple",
        dateFormat: "Y-m-d",
        onChange: (selectedDates) => {
            datesSelectionnees = selectedDates.map(d => d.toISOString().split('T')[0]);
            datesSelectionnees.sort(); // Sort dates
            sauvegarderDonnees();
            afficherDatesSelectionnees();
            afficherRolesParTypeJour();
            afficherMembresSelection();
            afficherGrilleDisponibilite();
        }
    });
}

/**
 * Affiche la liste des dates sélectionnées
 */
function afficherDatesSelectionnees() {
    const container = document.getElementById('selectedDatesList');
    const countElement = document.getElementById('countDates');

    if (!container || !countElement) return;

    countElement.textContent = datesSelectionnees.length;

    if (datesSelectionnees.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Aucune date sélectionnée.</p>';
        return;
    }

    container.innerHTML = datesSelectionnees.map(date => {
        const dateObj = new Date(date + 'T12:00:00');
        const formatted = dateObj.toLocaleDateString('fr-FR', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <span class="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                ${formatted}
                <button onclick="retirerDate('${date}')" class="ml-2 text-indigo-600 hover:text-indigo-800">&times;</button>
            </span>
        `;
    }).join('');
}

/**
 * Retire une date de la sélection
 */
function retirerDate(date) {
    datesSelectionnees = datesSelectionnees.filter(d => d !== date);
    datesSelectionnees.sort();

    // Update Flatpickr
    if (datePickerInstance) {
        datePickerInstance.setDate(datesSelectionnees);
    }

    sauvegarderDonnees();
    afficherDatesSelectionnees();
    afficherRolesParTypeJour();
    afficherGrilleDisponibilite();

    // Mettre à jour le select des types de jour pour la gestion des rôles
    mettreAJourSelectTypesJour();
}

/**
 * Affiche la sélection des membres pour ce planning
 */
function afficherMembresSelection() {
    const container = document.getElementById('membresSelection');
    if (!container) return;

    if (personnes.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Ajoutez des personnes pour les sélectionner ici.</p>';
        return;
    }

    container.innerHTML = personnes
        .sort((a, b) => a.nom.localeCompare(b.nom))
        .map(personne => `
        <label class="flex items-center space-x-2 p-1 hover:bg-gray-200 rounded">
            <input type="checkbox" class="rounded border-gray-300 text-indigo-600 shadow-sm"
                   value="${personne.nom}"
                   ${membresSelectionnes.includes(personne.nom) ? 'checked' : ''}
                   onchange="toggleMembreSelection('${personne.nom}')">
            <span class="text-sm">${personne.nom}</span>
        </label>
    `).join('');
}

/**
 * Basculer la sélection d'un membre
 */
function toggleMembreSelection(nom) {
    const index = membresSelectionnes.indexOf(nom);
    if (index === -1) {
        membresSelectionnes.push(nom);
    } else {
        membresSelectionnes.splice(index, 1);
    }

    // Nettoyer les disponibilités pour les membres non sélectionnés
    for (const date in disponibilitesParDate) {
        if (disponibilitesParDate[date][nom]) {
            delete disponibilitesParDate[date][nom];
        }
    }

    sauvegarderDonnees();
    afficherGrilleDisponibilite();
}

/**
 * Affiche l'aperçu de tous les jours et leurs rôles
 */
function afficherRolesParTypeJour() {
    const container = document.getElementById('listeJoursAvecRoles');
    if (!container) return;

    // Si aucune date sélectionnée, afficher un message
    if (datesSelectionnees.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">Sélectionnez des dates pour configurer les rôles</div>';
        return;
    }

    // Déterminer quels jours de la semaine sont présents dans les dates sélectionnées
    const joursPresents = new Set();
    datesSelectionnees.forEach(dateStr => {
        const dateObj = new Date(dateStr + 'T12:00:00');
        joursPresents.add(dateObj.getDay());
    });

    // Afficher chaque jour présent
    container.innerHTML = Array.from(joursPresents).sort().map(jourIndex => {
        const nomJour = JOURS_SEMAINE[jourIndex];
        const roles = rolesParTypeJour[jourIndex] || [];
        const nbDates = datesSelectionnees.filter(dateStr => {
            const dateObj = new Date(dateStr + 'T12:00:00');
            return dateObj.getDay() === jourIndex;
        }).length;

        return `
            <div class="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-3">
                    <h5 class="font-semibold text-gray-800 flex items-center">
                        <i class="fas fa-calendar-day mr-2 text-indigo-500"></i>${nomJour}
                    </h5>
                    <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">${nbDates} date(s)</span>
                </div>

                ${roles.length > 0 ? `
                    <div class="space-y-2">
                        ${roles.map((role, index) => `
                            <div class="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span class="text-sm font-medium text-gray-700">${role}</span>
                                <div class="flex gap-2">
                                    <button onclick="modifierRole('${role}', ${jourIndex})" class="text-blue-600 hover:text-blue-800 text-sm" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="supprimerRolePersonnalise(${jourIndex}, '${role}')" class="text-red-600 hover:text-red-800 text-sm" title="Supprimer">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-4">
                        <p class="text-sm text-gray-500 mb-2">Aucun rôle configuré</p>
                        <p class="text-xs text-gray-400">Utilisez le formulaire ci-dessous pour ajouter des rôles</p>
                    </div>
                `}
            </div>
        `;
    }).join('');

    // Mettre à jour le select des types de jour pour la gestion des rôles
    mettreAJourSelectTypesJour();
}

/**
 * Met à jour le select des types de jour en fonction des dates sélectionnées
 */
function mettreAJourSelectTypesJour() {
    const select = document.getElementById('selectJourPourRole');
    if (!select) return;

    // Vider le select
    select.innerHTML = '<option value="">-- Sélectionner un type de jour --</option>';

    // Si aucune date sélectionnée, sortir
    if (datesSelectionnees.length === 0) {
        return;
    }

    // Déterminer quels jours de la semaine sont présents dans les dates sélectionnées
    const joursPresents = new Set();
    datesSelectionnees.forEach(dateStr => {
        const dateObj = new Date(dateStr + 'T12:00:00');
        joursPresents.add(dateObj.getDay());
    });

    // Ajouter les options pour chaque jour présent
    Array.from(joursPresents).sort().forEach(jourIndex => {
        const nomJour = JOURS_SEMAINE[jourIndex];
        const option = document.createElement('option');
        option.value = jourIndex;
        option.textContent = nomJour;
        select.appendChild(option);
    });
}

/**
 * Charge les rôles pour le jour sélectionné
 */
function chargerRolesPourJourSelectionne() {
    const select = document.getElementById('selectJourPourRole');
    const recapContainer = document.getElementById('recapRoles');

    if (!select || !recapContainer) return;

    const jourIndex = parseInt(select.value);

    if (isNaN(jourIndex)) {
        recapContainer.innerHTML = '<p class="text-gray-500 text-sm">Sélectionnez un type de jour pour voir ses rôles</p>';
        return;
    }

    const nomJour = JOURS_SEMAINE[jourIndex];
    const roles = rolesParTypeJour[jourIndex] || [];

    if (roles.length === 0) {
        recapContainer.innerHTML = `
            <div class="text-center p-4">
                <p class="text-gray-500 text-sm mb-2">Aucun rôle configuré pour ${nomJour}</p>
                <p class="text-xs text-gray-400">Ajoutez des rôles en utilisant le formulaire à gauche</p>
            </div>
        `;
        return;
    }

    // Afficher les rôles
    let html = `
        <div class="mb-3">
            <h5 class="font-semibold text-gray-700 flex items-center">
                <i class="fas fa-calendar-day mr-2 text-indigo-500"></i>${nomJour}
                <span class="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">${roles.length} rôle(s)</span>
            </h5>
        </div>
        <div class="space-y-2">
    `;

    roles.forEach((role, index) => {
        html += `
            <div class="flex items-center justify-between bg-white p-2 rounded border">
                <span class="font-medium text-gray-800">${role}</span>
                <div class="flex gap-2">
                    <button onclick="modifierRole('${role}', ${jourIndex})" class="text-blue-600 hover:text-blue-800 text-sm" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="supprimerRolePersonnalise(${jourIndex}, '${role}')" class="text-red-600 hover:text-red-800 text-sm" title="Supprimer">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    recapContainer.innerHTML = html;
}

/**
 * Ajoute un rôle personnalisé pour un type de jour
 */
function ajouterRolePersonnalise() {
    const selectJour = document.getElementById('selectJourPourRole');
    const inputRole = document.getElementById('nomNouveauRole');

    if (!selectJour || !inputRole) return;

    const jourIndex = parseInt(selectJour.value);
    const nomRole = inputRole.value.trim();

    // Validation
    if (isNaN(jourIndex)) {
        alert('Veuillez sélectionner un type de jour');
        return;
    }

    if (!nomRole) {
        alert('Veuillez entrer un nom de rôle');
        return;
    }

    // Initialiser le tableau pour ce jour si nécessaire
    if (!rolesParTypeJour[jourIndex]) {
        rolesParTypeJour[jourIndex] = [];
    }

    // Vérifier si le rôle existe déjà
    if (rolesParTypeJour[jourIndex].includes(nomRole)) {
        alert('Ce rôle existe déjà pour ce type de jour');
        return;
    }

    // Ajouter le rôle
    rolesParTypeJour[jourIndex].push(nomRole);

    // Vider le champ
    inputRole.value = '';

    // Mettre à jour l'interface
    sauvegarderDonnees();
    chargerRolesPourJourSelectionne();
    afficherRolesParTypeJour();

    alert(`Rôle "${nomRole}" ajouté pour ${JOURS_SEMAINE[jourIndex]}`);
}

/**
 * Supprime un rôle personnalisé
 */
function supprimerRolePersonnalise(jourIndex, nomRole) {
    if (!confirm(`Voulez-vous vraiment supprimer le rôle "${nomRole}" ?`)) {
        return;
    }

    if (rolesParTypeJour[jourIndex]) {
        rolesParTypeJour[jourIndex] = rolesParTypeJour[jourIndex].filter(r => r !== nomRole);

        // Si la liste devient vide, supprimer la clé
        if (rolesParTypeJour[jourIndex].length === 0) {
            delete rolesParTypeJour[jourIndex];
        }
    }

    // Mettre à jour l'interface
    sauvegarderDonnees();
    chargerRolesPourJourSelectionne();
    afficherRolesParTypeJour();

    alert(`Rôle "${nomRole}" supprimé`);
}

/**
 * Modifie un rôle existant
 */
function modifierRole(ancienNomRole, jourIndex) {
    const nouveauNomRole = prompt(`Modifier le rôle "${ancienNomRole}" pour ${JOURS_SEMAINE[jourIndex]}:`, ancienNomRole);

    // Si l'utilisateur annule, ne rien faire
    if (nouveauNomRole === null) {
        return;
    }

    // Vérifier que le nouveau nom n'existe pas déjà (sauf si c'est le même nom)
    if (nouveauNomRole !== ancienNomRole && rolesParTypeJour[jourIndex]?.includes(nouveauNomRole)) {
        alert('Ce rôle existe déjà pour ce type de jour');
        return;
    }

    // Modifier le rôle
    const index = rolesParTypeJour[jourIndex].indexOf(ancienNomRole);
    if (index !== -1) {
        rolesParTypeJour[jourIndex][index] = nouveauNomRole;
    }

    // Mettre à jour l'interface
    sauvegarderDonnees();
    afficherRolesParTypeJour();

    alert(`Rôle modifié de "${ancienNomRole}" vers "${nouveauNomRole}"`);
}

/**
 * Affiche la grille de disponibilité (membres x dates)
 */
function afficherGrilleDisponibilite() {
    const container = document.getElementById('grilleDisponibilite');
    if (!container) return;

    if (datesSelectionnees.length === 0 || membresSelectionnes.length === 0) {
        container.innerHTML = '<p class="text-gray-500 p-4 text-center">Sélectionnez des dates et des membres pour configurer les disponibilités.</p>';
        return;
    }

    // Trier les dates
    const datesTriees = [...datesSelectionnees].sort();

    // Créer le header
    let headHTML = '<tr><th class="sticky left-0 bg-gray-100 p-2 text-left font-semibold">Membre</th>';
    datesTriees.forEach(date => {
        const dateObj = new Date(date + 'T12:00:00');
        const formatted = dateObj.toLocaleDateString('fr-FR', {
            month: 'short',
            day: 'numeric'
        });
        headHTML += `<th class="bg-gray-100 p-2 text-center font-semibold min-w-[100px]">${formatted}</th>`;
    });
    headHTML += '</tr>';

    // Créer le body
    let bodyHTML = '';
    membresSelectionnes.forEach(membre => {
        bodyHTML += `<tr><td class="sticky left-0 bg-white p-2 font-medium">${membre}</td>`;
        datesTriees.forEach(date => {
            const isAvailable = disponibilitesParDate[date]?.[membre] || false;
            bodyHTML += `
                <td class="p-2 text-center">
                    <input type="checkbox" class="rounded border-gray-300 text-indigo-600 shadow-sm"
                           data-date="${date}" data-membre="${membre}"
                           ${isAvailable ? 'checked' : ''}
                           onchange="toggleDisponibilite(this)">
                </td>
            `;
        });
        bodyHTML += '</tr>';
    });

    container.innerHTML = `
        <table class="w-full">
            <thead>${headHTML}</thead>
            <tbody>${bodyHTML}</tbody>
        </table>
    `;
}

/**
 * Basculer la disponibilité d'un membre pour une date
 */
function toggleDisponibilite(checkbox) {
    const date = checkbox.dataset.date;
    const membre = checkbox.dataset.membre;

    if (!disponibilitesParDate[date]) {
        disponibilitesParDate[date] = {};
    }

    disponibilitesParDate[date][membre] = checkbox.checked;

    // Si la case est décochée, on peut supprimer l'entrée
    if (!checkbox.checked) {
        delete disponibilitesParDate[date][membre];
        // Si l'objet est vide, on peut le supprimer
        if (Object.keys(disponibilitesParDate[date]).length === 0) {
            delete disponibilitesParDate[date];
        }
    }

    sauvegarderDonnees();
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

    // Ajouter la personne avec une propriété disponibilites vide (pour compatibilité)
    personnes.push({ nom, disponibilites: [] });

    // Réinitialiser le champ
    document.getElementById('nomPersonne').value = '';

    sauvegarderDonnees();
    afficherListePersonnes();
    afficherMembresSelection();

    // Mettre à jour l'assistant en temps réel s'il est visible
    if (document.getElementById('assistantPanel') && document.getElementById('assistantPanel').style.display !== 'none') {
        // Réinitialiser le conteneur des personnes dans l'assistant pour inclure la nouvelle personne
        const containerPersonnes = document.getElementById('assistantPersonnesContainer');
        if (containerPersonnes) {
            containerPersonnes.innerHTML = '';
            initialiserFiltresAssistant();
            mettreAJourAssistant();
        }
    }

    afficherMessage(`Personne "${nom}" ajoutée`, 'success');
}

/**
 * Affiche la liste des personnes enregistrées
 */
function afficherListePersonnes() {
    const container = document.getElementById('listePersonnes');
    if (!container) return;

    if (personnes.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm">Aucune personne enregistrée</p>';
        return;
    }

    container.innerHTML = personnes
        .sort((a, b) => a.nom.localeCompare(b.nom))
        .map(personne => {
            return `
                <div class="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <span class="font-medium">${personne.nom}</span>
                    <button onclick="supprimerPersonne('${personne.nom}')" class="text-red-600 hover:text-red-800 text-sm">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        }).join('');
}

/**
 * Supprime une personne de la liste
 */
function supprimerPersonne(nom) {
    if (confirm(`Voulez-vous vraiment supprimer "${nom}" ?`)) {
        // Supprimer de la liste des personnes
        personnes = personnes.filter(p => p.nom !== nom);

        // Retirer de la sélection des membres
        membresSelectionnes = membresSelectionnes.filter(n => n !== nom);

        // Nettoyer les disponibilités
        for (const date in disponibilitesParDate) {
            if (disponibilitesParDate[date][nom]) {
                delete disponibilitesParDate[date][nom];
            }
        }

        sauvegarderDonnees();
        afficherListePersonnes();
        afficherMembresSelection();
        afficherGrilleDisponibilite();

        afficherMessage(`Personne "${nom}" supprimée`, 'success');
    }
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
    const select = document.getElementById('jourAModifier');
    if (!select) return; // L'élément n'existe pas dans la nouvelle version

    const jour = select.value;
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
    const select = document.getElementById('personneAModifier');
    if (!select) return; // L'élément n'existe pas dans la nouvelle version

    const nom = select.value;
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

    // Mettre à jour les nouvelles sections
    afficherDatesSelectionnees();
    afficherRolesParTypeJour();
    afficherMembresSelection();
    afficherGrilleDisponibilite();
}

function afficherListeJours() {
    const liste = document.getElementById('listeJours');
    if (!liste) return; // L'élément n'existe pas dans la nouvelle version

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
    if (!liste) return; // L'élément n'existe pas dans la nouvelle version

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
    if (!container) return; // L'élément n'existe pas dans la nouvelle version

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
    // Select jour à modifier (vérifier si l'élément existe)
    const selectJour = document.getElementById('jourAModifier');
    if (selectJour) {
        selectJour.innerHTML = '<option value="">-- Sélectionner un jour --</option>';
        jours.forEach(jour => {
            const option = document.createElement('option');
            option.value = jour;
            option.textContent = jour;
            selectJour.appendChild(option);
        });
    }

    // Select personne à modifier (vérifier si l'élément existe)
    const selectPersonne = document.getElementById('personneAModifier');
    if (selectPersonne) {
        selectPersonne.innerHTML = '<option value="">-- Sélectionner une personne --</option>';
        personnes.forEach(personne => {
            const option = document.createElement('option');
            option.value = personne.nom;
            option.textContent = personne.nom;
            selectPersonne.appendChild(option);
        });
    }
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
    genererPlanningParDates();
}

/**
 * Génère un planning basé sur les dates sélectionnées
 */
function genererPlanningParDates() {
    const modeEquite = document.getElementById('modeEquite').checked;
    const modeDebug = document.getElementById('modeDebug').checked;

    if (Object.keys(rolesParTypeJour).length === 0) {
        afficherMessage('Veuillez d\'abord configurer les rôles par type de jour', 'error');
        return;
    }

    if (membresSelectionnes.length === 0) {
        afficherMessage('Veuillez d\'abord sélectionner des membres', 'error');
        return;
    }

    if (datesSelectionnees.length === 0) {
        afficherMessage('Veuillez sélectionner des dates', 'error');
        return;
    }

    planning = [];
    const compteurs = {}; // {personne: compteur}
    membresSelectionnes.forEach(nom => compteurs[nom] = 0);

    let erreurs = [];

    // Trier les dates
    const datesTriees = [...datesSelectionnees].sort();

    for (const date of datesTriees) {
        const dateObj = new Date(date + 'T12:00:00');
        const jourIndex = dateObj.getDay();
        const rolesDuJour = rolesParTypeJour[jourIndex] || [];

        if (rolesDuJour.length === 0) {
            continue; // Aucun rôle configuré pour ce type de jour
        }

        // Filtrer les membres disponibles pour cette date
        const personnesDisponibles = membresSelectionnes.filter(membre =>
            disponibilitesParDate[date]?.[membre]
        );

        if (personnesDisponibles.length === 0) {
            erreurs.push(`${date}: Aucune personne disponible`);
            continue;
        }

        // Filtrer les personnes déjà assignées à cette date
        const personnesDejaAssignees = planning
            .filter(aff => aff.date === date)
            .map(aff => aff.personne);

        let personnesEligibles = personnesDisponibles.filter(p =>
            !personnesDejaAssignees.includes(p)
        );

        if (personnesEligibles.length === 0) {
            erreurs.push(`${date}: Aucune personne disponible (contrainte respectée)`);
            continue;
        }

        for (const role of rolesDuJour) {
            // Vérifier si ce rôle est déjà assigné à cette date
            const roleDejaAssigne = planning.some(aff =>
                aff.date === date && aff.role === role
            );

            if (roleDejaAssigne) {
                continue;
            }

            let personneTrouvee = null;

            // Règle de rotation: privilégier les personnes n'ayant pas encore fait ce rôle
            const personnesSansRole = personnesEligibles.filter(p => {
                return !planning.some(aff => aff.personne === p && aff.role === role);
            });

            // Si des personnes n'ont pas encore fait ce rôle, les privilégier
            if (personnesSansRole.length > 0) {
                personnesEligibles = personnesSansRole;
            }

            if (modeEquite) {
                // Trouver la personne avec le moins d'affectations
                const minCompteur = Math.min(...personnesEligibles.map(p => compteurs[p]));
                const candidats = personnesEligibles.filter(p => compteurs[p] === minCompteur);

                personneTrouvee = candidats[Math.floor(Math.random() * candidats.length)];
            } else {
                // Mode aléatoire simple
                personneTrouvee = personnesEligibles[
                    Math.floor(Math.random() * personnesEligibles.length)
                ];
            }

            if (personneTrouvee) {
                const nomJour = JOURS_SEMAINE[jourIndex];
                planning.push({
                    semaine: 1, // Les dates sélectionnées sont considérées comme une période
                    date: date,
                    jour: nomJour,
                    role,
                    personne: personneTrouvee
                });
                compteurs[personneTrouvee]++;

                // Retirer la personne de la liste des éligibles pour cette date
                personnesEligibles = personnesEligibles.filter(p => p !== personneTrouvee);
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
        afficherMessage(`Planning généré avec succès pour ${datesTriees.length} date(s) !`, 'success');
    }

    initialiserFiltresStats();
}

function afficherTableauPlanning() {
    const table = document.getElementById('tableauPlanning');

    // Détecter le format du planning
    const hasDates = planning.length > 0 && planning[0].hasOwnProperty('date');

    if (hasDates) {
        afficherTableauPlanningParDates();
    } else {
        // Ancien format - ne devrait plus être utilisé
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="text-center text-gray-500 py-12">
                        <i class="fas fa-calendar-times text-6xl mb-4 text-gray-300"></i>
                        <p class="text-lg">Format non supporté. Veuillez générer un nouveau planning.</p>
                    </th>
                </tr>
            </thead>
        `;
    }
}

/**
 * Affiche le tableau de planning basé sur les dates, groupé par semaines
 */
function afficherTableauPlanningParDates() {
    const table = document.getElementById('tableauPlanning');

    if (datesSelectionnees.length === 0) {
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="text-center text-gray-500 py-12">
                        <i class="fas fa-calendar-times text-6xl mb-4 text-gray-300"></i>
                        <p class="text-lg">Aucun planning généré. Cliquez sur "GÉNÉRER PLANNING"</p>
                    </th>
                </tr>
            </thead>
        `;
        return;
    }

    // Grouper les dates par numéro de semaine
    const datesParSemaine = regrouperDatesParSemaine(datesSelectionnees);
    const numeroSemaines = Object.keys(datesParSemaine).sort((a, b) => parseInt(a) - parseInt(b));

    // Déterminer quels jours de la semaine sont présents dans les dates sélectionnées
    const joursPresents = new Set();
    datesSelectionnees.forEach(dateStr => {
        const dateObj = new Date(dateStr + 'T12:00:00');
        joursPresents.add(dateObj.getDay());
    });

    // Créer l'en-tête
    let headerHTML = '<tr class="desktop-view"><th class="border-r border-gray-300">Jour</th><th class="border-r border-gray-300">Rôle</th>';
    numeroSemaines.forEach(numSemaine => {
        const dates = datesParSemaine[numSemaine];
        if (dates.length === 1) {
            // Une seule date, afficher la date
            const dateObj = new Date(dates[0] + 'T12:00:00');
            const formatted = dateObj.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
            headerHTML += `<th class="text-center">Semaine ${numSemaine}<br><span class="text-xs font-normal">${formatted}</span></th>`;
        } else {
            // Plusieurs dates, afficher la plage
            const dateDebut = new Date(dates[0] + 'T12:00:00');
            const dateFin = new Date(dates[dates.length - 1] + 'T12:00:00');
            const formattedDebut = dateDebut.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
            const formattedFin = dateFin.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
            headerHTML += `<th class="text-center">Semaine ${numSemaine}<br><span class="text-xs font-normal">${formattedDebut}-${formattedFin}</span></th>`;
        }
    });
    headerHTML += '</tr>';

    // Créer le corps - pour chaque jour de la semaine présent dans les dates sélectionnées
    let bodyHTML = '';

    // Ne itérer que sur les jours qui sont présents dans les dates
    JOURS_SEMAINE.forEach((nomJour, jourIndex) => {
        const rolesDuJour = rolesParTypeJour[jourIndex] || [];
        if (rolesDuJour.length === 0) return;

        // Ne traiter que les jours qui sont présents dans les dates sélectionnées
        if (!joursPresents.has(jourIndex)) return;

        rolesDuJour.forEach((role, roleIndex) => {
            const isFirstRole = roleIndex === 0;
            const rowspan = rolesDuJour.length;

            bodyHTML += '<tr class="desktop-view">';

            // Colonne Jour (avec rowspan pour le premier rôle)
            if (isFirstRole) {
                bodyHTML += `<td rowspan="${rowspan}" class="font-semibold bg-gray-50 border-r border-gray-300 align-top">${nomJour}</td>`;
            }

            // Colonne Rôle
            bodyHTML += `<td class="bg-gray-50 border-r border-gray-300">${role}</td>`;

            // Colonnes des semaines
            numeroSemaines.forEach(numSemaine => {
                const dates = datesParSemaine[numSemaine];
                // Trouver une affectation pour ce rôle sur une des dates de cette semaine
                let affectation = null;
                for (const date of dates) {
                    affectation = planning.find(p =>
                        p.date === date &&
                        p.role === role &&
                        p.jour === nomJour
                    );
                    if (affectation) break;
                }

                const personne = affectation ? affectation.personne : '';
                const displayText = personne || '<span class="empty-cell">Vide</span>';
                const cellClass = personne ? 'editable-cell' : 'editable-cell empty-cell';

                // Ajouter des attributs data pour l'édition
                bodyHTML += `<td class="text-center ${cellClass}"
                    data-semaine="${numSemaine}"
                    data-jour="${nomJour}"
                    data-jour-index="${jourIndex}"
                    data-role="${role}"
                    data-personne="${personne}"
                    data-dates="${dates.join(',')}"
                    onclick="ouvrirAutocompletePourDateSpecific(this)">${displayText}</td>`;
            });

            bodyHTML += '</tr>';
        });
    });

    // Vue mobile - grouper par semaine
    numeroSemaines.forEach(numSemaine => {
        const dates = datesParSemaine[numSemaine];
        const dateDebut = new Date(dates[0] + 'T12:00:00');
        const dateFin = new Date(dates[dates.length - 1] + 'T12:00:00');
        const formatted = `${dateDebut.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })} au ${dateFin.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}`;

        bodyHTML += `<tr class="mobile-view"><td colspan="${numeroSemaines.length + 2}" class="week-header bg-gray-100 font-bold text-center py-3">Semaine ${numSemaine}<br><span class="text-xs font-normal">${formatted}</span></td></tr>`;

        JOURS_SEMAINE.forEach(nomJour => {
            const jourIndex = JOURS_SEMAINE.indexOf(nomJour);
            const rolesDuJour = rolesParTypeJour[jourIndex] || [];

            // Ne traiter que les jours qui sont présents dans les dates sélectionnées
            if (!joursPresents.has(jourIndex)) return;

            rolesDuJour.forEach(role => {
                // Trouver une affectation pour ce rôle sur une des dates de cette semaine
                let affectation = null;
                for (const date of dates) {
                    affectation = planning.find(p =>
                        p.date === date &&
                        p.role === role &&
                        p.jour === nomJour
                    );
                    if (affectation) break;
                }

                const personne = affectation ? affectation.personne : '';
                const displayText = personne || '<span class="empty-cell">Vide</span>';
                const cellClass = personne ? 'editable-cell' : 'editable-cell empty-cell';

                bodyHTML += '<tr class="mobile-view">';
                bodyHTML += `<td data-label="Jour" class="font-semibold">${nomJour}</td>`;
                bodyHTML += `<td data-label="Rôle">${role}</td>`;
                // Ajouter des attributs data pour l'édition
                bodyHTML += `<td data-label="Personne" class="${cellClass}"
                    data-semaine="${numSemaine}"
                    data-jour="${nomJour}"
                    data-jour-index="${jourIndex}"
                    data-role="${role}"
                    data-personne="${personne}"
                    data-dates="${dates.join(',')}"
                    onclick="ouvrirAutocompletePourDateSpecific(this)">${displayText}</td>`;
                bodyHTML += '</tr>';
            });
        });
    });

    table.innerHTML = `<thead>${headerHTML}</thead><tbody>${bodyHTML}</tbody>`;

    // Mettre à jour l'assistant
    if (typeof mettreAJourAssistant === 'function') {
        mettreAJourAssistant();
    }
}

/**
 * Calcule le numéro de semaine pour une date donnée
 */
function calculerNumeroSemaine(date) {
    const debutAnnee = new Date(date.getFullYear(), 0, 1);
    const diffTemps = date - debutAnnee;
    const diffJours = Math.floor(diffTemps / (1000 * 60 * 60 * 24));
    return Math.ceil((diffJours + 1) / 7);
}

/**
 * Regroupe les dates par numéro de semaine
 */
function regrouperDatesParSemaine(dates) {
    const datesParSemaine = {};
    const dateReference = new Date(dates[0] + 'T12:00:00');
    const debutAnnee = new Date(dateReference.getFullYear(), 0, 1);

    dates.forEach(dateStr => {
        const date = new Date(dateStr + 'T12:00:00');
        // Calculer le numéro de semaine (approx)
        const numeroSemaine = calculerNumeroSemaine(date);

        if (!datesParSemaine[numeroSemaine]) {
            datesParSemaine[numeroSemaine] = [];
        }
        datesParSemaine[numeroSemaine].push(dateStr);
    });

    // Trier les dates dans chaque semaine
    Object.keys(datesParSemaine).forEach(semaine => {
        datesParSemaine[semaine].sort();
    });

    return datesParSemaine;
}

// ===== ASSISTANT EN TEMPS RÉEL =====

let roleActifSurligne = null;

function mettreAJourAssistant() {
    const panel = document.getElementById('assistantPanel');
    const content = document.getElementById('assistantContent');

    if (planning.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';

    // Initialiser les filtres (checkboxes)
    initialiserFiltresAssistant();

    // Obtenir tous les rôles uniques à partir de rolesParTypeJour
    const tousLesRoles = new Set();
    Object.values(rolesParTypeJour).forEach(roles => {
        roles.forEach(role => tousLesRoles.add(role));
    });
    const rolesArray = Array.from(tousLesRoles).sort();

    // Récupérer les filtres sélectionnés
    const personnesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-personne:checked')).map(cb => cb.value);
    const rolesFiltrees = Array.from(document.querySelectorAll('.assistant-filter-role:checked')).map(cb => cb.value);

    // Récupérer l'état d'assignation sélectionné
    const statutAssignation = document.querySelector('input[name="assistantStatut"]:checked')?.value || 'all';

    // Construire le tableau récapitulatif
    let html = '<div class="overflow-x-auto">';
    html += '<table class="w-full text-xs border-collapse">';

    // En-tête du tableau
    html += '<thead><tr class="bg-gray-100">';
    html += '<th class="border border-gray-300 p-1 text-left sticky left-0 bg-gray-100 z-10">Personne</th>';
    rolesArray.filter(role => rolesFiltrees.includes(role)).forEach(role => {
        html += `<th class="border border-gray-300 p-1 text-center">${role}</th>`;
    });
    html += '<th class="border border-gray-300 p-1 text-center">Total</th>';
    html += '</tr></thead>';

    // Corps du tableau
    html += '<tbody>';
    personnes.filter(p => personnesFiltrees.includes(p.nom)).forEach(personne => {
        html += '<tr class="hover:bg-gray-50">';

        // Colonne nom (cliquable pour surligner)
        html += `<td class="border border-gray-300 p-1 font-semibold sticky left-0 bg-white cursor-pointer hover:bg-blue-50"
                     onclick="surlignerPersonne('${personne.nom}')"
                     data-label="Personne">${personne.nom}</td>`;

        // Colonnes rôles
        let totalPersonne = 0;
        rolesArray.filter(role => rolesFiltrees.includes(role)).forEach(role => {
            // Compter les assignations pour ce rôle
            const nbAssignations = planning.filter(aff =>
                aff.personne === personne.nom &&
                aff.role === role
            ).length;

            totalPersonne += nbAssignations;

            if (nbAssignations > 0) {
                html += `<td class="border border-gray-300 p-1 text-center bg-green-100 cursor-pointer hover:bg-green-200"
                             onclick="surlignerRole('${personne.nom}', '${role}')"
                             title="Assigné ${nbAssignations} fois"
                             data-label="${role}">
                            <span class="text-green-800 font-bold">✓ ${nbAssignations}</span>
                         </td>`;
            } else {
                html += `<td class="border border-gray-300 p-1 text-center bg-gray-100 text-gray-500" data-label="${role}">—</td>`;
            }
        });

        // Colonne Total
        html += `<td class="border border-gray-300 p-1 text-center font-bold ${totalPersonne > 0 ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-500'}">${totalPersonne}</td>`;

        html += '</tr>';
    });

    html += '</tbody></table></div>';

    content.innerHTML = html;

    // Analyser l'équité
    if (analyseDiv) {
        analyserEquite(analyseDiv);
    }
}

/**
 * Analyse l'équité des assignations
 */
function analyserEquite(container) {
    const statsParPersonne = {};

    personnes.forEach(personne => {
        statsParPersonne[personne.nom] = {
            total: 0,
            parRole: {}
        };

        // Compter les assignations par rôle
        Object.values(rolesParTypeJour).flat().forEach(role => {
            const count = planning.filter(aff =>
                aff.personne === personne.nom &&
                aff.role === role
            ).length;
            statsParPersonne[personne.nom].parRole[role] = count;
            statsParPersonne[personne.nom].total += count;
        });
    });

    // Calculer l'équité
    const totalAffectations = Object.values(statsParPersonne).reduce((sum, stats) => sum + stats.total, 0);
    const moyenne = totalAffectations / Object.keys(statsParPersonne).length;

    let html = '<h4 class="font-semibold text-sm mb-2">Analyse d\'équité :</h4>';
    html += `<p class="text-xs text-gray-600 mb-2">Moyenne : ${moyenne.toFixed(1)} affectations par personne</p>`;

    html += '<div class="space-y-1 text-xs">';
    Object.entries(statsParPersonne)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([nom, stats]) => {
            const diff = stats.total - moyenne;
            const status = diff > 0.5 ? 'over' : (diff < -0.5 ? 'under' : 'balanced');
            const statusText = status === 'over' ? 'Trop assigné' : (status === 'under' ? 'Peu assigné' : 'Équilibré');
            const statusColor = status === 'over' ? 'text-red-600' : (status === 'under' ? 'text-yellow-600' : 'text-green-600');

            html += `<div class="flex justify-between">
                <span>${nom}:</span>
                <span class="${statusColor}">${stats.total} (${statusText})</span>
            </div>`;
        });
    html += '</div>';

    container.innerHTML = html;
}

// ===== FONCTIONS POUR L'ASSISTANT EN TEMPS RÉEL =====

/**
 * Initialise les filtres de l'assistant en temps réel
 */
function initialiserFiltresAssistant() {
    // Remplir le conteneur des personnes
    const containerPersonnes = document.getElementById('assistantPersonnesContainer');
    if (containerPersonnes) {
        containerPersonnes.innerHTML = '';
        personnes.forEach(personne => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-1.5 mb-1 cursor-pointer';
            label.innerHTML = `
                <input type="checkbox" class="assistant-filter-personne cursor-pointer" value="${personne.nom}" checked>
                <span>${personne.nom}</span>
            `;
            containerPersonnes.appendChild(label);
        });
    }

    // Remplir le conteneur des rôles
    const containerRoles = document.getElementById('assistantRolesContainer');
    if (containerRoles) {
        containerRoles.innerHTML = '';
        const tousLesRoles = new Set();
        Object.values(rolesParTypeJour).forEach(roles => {
            roles.forEach(role => tousLesRoles.add(role));
        });
        Array.from(tousLesRoles).sort().forEach(role => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-1.5 mb-1 cursor-pointer';
            label.innerHTML = `
                <input type="checkbox" class="assistant-filter-role cursor-pointer" value="${role}" checked>
                <span>${role}</span>
            `;
            containerRoles.appendChild(label);
        });
    }

    // Remplir le conteneur des semaines
    const containerSemaines = document.getElementById('assistantSemainesContainer');
    if (containerSemaines && datesSelectionnees.length > 0) {
        containerSemaines.innerHTML = '';
        const datesParSemaine = regrouperDatesParSemaine(datesSelectionnees);
        Object.keys(datesParSemaine).sort((a, b) => parseInt(a) - parseInt(b)).forEach(numSemaine => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-1.5 mb-1 cursor-pointer';
            const dates = datesParSemaine[numSemaine];
            const dateObj = new Date(dates[0] + 'T12:00:00');
            const formatted = dateObj.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
            label.innerHTML = `
                <input type="checkbox" class="assistant-filter-semaine cursor-pointer" value="${numSemaine}" checked>
                <span>Sem. ${numSemaine}</span>
            `;
            containerSemaines.appendChild(label);
        });
    }
}

/**
 * Bascule toutes les personnes dans l'assistant
 */
function toggleAssistantPersonnes() {
    const allChecked = document.getElementById('assistantAllPersonnes')?.checked;
    document.querySelectorAll('.assistant-filter-personne').forEach(cb => {
        cb.checked = allChecked;
    });
    mettreAJourAssistant();
}

/**
 * Bascule tous les rôles dans l'assistant
 */
function toggleAssistantRoles() {
    const allChecked = document.getElementById('assistantAllRoles')?.checked;
    document.querySelectorAll('.assistant-filter-role').forEach(cb => {
        cb.checked = allChecked;
    });
    mettreAJourAssistant();
}

/**
 * Bascule toutes les semaines dans l'assistant
 */
function toggleAssistantSemaines() {
    const allChecked = document.getElementById('assistantAllSemaines')?.checked;
    document.querySelectorAll('.assistant-filter-semaine').forEach(cb => {
        cb.checked = allChecked;
    });
    mettreAJourAssistant();
}

/**
 * Surligne une personne dans le planning
 */
function surlignerPersonne(nom) {
    // Supprimer la surlignure existante
    document.querySelectorAll('.highlight-cell').forEach(cell => {
        cell.classList.remove('highlight-cell');
    });

    // Surligner les cellules de cette personne
    document.querySelectorAll(`[data-personne="${nom}"]`).forEach(cell => {
        cell.classList.add('highlight-cell');
    });
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
        personnes,
        datesSelectionnees,
        membresSelectionnes,
        disponibilitesParDate,
        rolesParTypeJour
    };
    localStorage.setItem('planningRoles', JSON.stringify(data));
}

function chargerDonnees() {
    const saved = localStorage.getItem('planningRoles');
    if (saved) {
        const data = JSON.parse(saved);
        personnes = data.personnes || [];
        datesSelectionnees = data.datesSelectionnees || [];
        membresSelectionnes = data.membresSelectionnes || [];
        disponibilitesParDate = data.disponibilitesParDate || {};
        rolesParTypeJour = data.rolesParTypeJour || {};

        // Si aucune donnée n'est sauvegardée, charger des données de test
        if (personnes.length === 0 || Object.keys(rolesParTypeJour).length === 0) {
            chargerDonneesTest();
        }
    } else {
        // Aucune donnée sauvegardée, charger des données de test
        chargerDonneesTest();
    }

    // Mettre à jour l'interface
    if (typeof mettreAJourSelects === 'function') {
        mettreAJourSelects();
    }
}

/**
 * Réinitialise complètement les données (vide le localStorage et recharge les données de test)
 */
function reinitialiserDonnees() {
    if (!confirm('Voulez-vous vraiment réinitialiser toutes les données ? Cette action est irréversible.')) {
        return;
    }

    // Vider le localStorage
    localStorage.removeItem('planningRoles');

    // Réinitialiser toutes les variables
    personnes = [];
    planning = [];
    datesSelectionnees = [];
    membresSelectionnes = [];
    disponibilitesParDate = {};
    rolesParTypeJour = {};
    jours = [];
    roles = {};

    // Charger les données de test
    chargerDonneesTest();

    // Rafraîchir l'interface
    afficherListes();
    initialiserDatePicker();
    afficherDatesSelectionnees();
    afficherRolesParTypeJour();
    afficherMembresSelection();
    afficherGrilleDisponibilite();
    afficherListePersonnes();

    // Masquer le planning
    const table = document.getElementById('tableauPlanning');
    table.innerHTML = `
        <thead>
            <tr>
                <th class="text-center text-gray-500 py-12">
                    <i class="fas fa-calendar-times text-6xl mb-4 text-gray-300"></i>
                    <p class="text-lg">Aucun planning généré. Cliquez sur "GÉNÉRER PLANNING"</p>
                </th>
            </tr>
        </thead>
    `;

    // Cacher l'assistant
    document.getElementById('assistantPanel').style.display = 'none';

    alert('Données réinitialisées avec succès !');
}

/**
 * Charge des données de test pour démontrer l'application
 */
function chargerDonneesTest() {
    // Personnes de test
    personnes = [
        { nom: "Rakoto", disponibilites: [] },
        { nom: "Rasoa", disponibilites: [] },
        { nom: "Miora", disponibilites: [] },
        { nom: "Ninia", disponibilites: [] },
        { nom: "Tiana", disponibilites: [] },
        { nom: "Fara", disponibilites: [] },
        { nom: "Jao", disponibilites: [] },
        { nom: "Lalao", disponibilites: [] },
    ];

    // Membres sélectionnés par défaut
    membresSelectionnes = personnes.map(p => p.nom);

    //rolesParTypeJour est maintenant vide - l'utilisateur doit ajouter les rôles manuellement

    // Sauvegarder les données de test
    sauvegarderDonnees();
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

/**
 * Ouvre l'autocomplete pour une date spécifique
 * Si la semaine a plusieurs dates, affiche un sous-menu pour choisir la date
 */
function ouvrirAutocompletePourDateSpecific(cell) {
    const dates = cell.dataset.dates.split(',');
    const role = cell.dataset.role;
    const jour = cell.dataset.jour;
    const personneActuelle = cell.dataset.personne;

    // Si une seule date, ouvrir directement l'autocomplete
    if (dates.length === 1) {
        ouvrirAutocompletePourUneDate(cell, dates[0], role, jour, personneActuelle);
        return;
    }

    // Si plusieurs dates, afficher un sous-menu pour choisir la date
    if (dropdownActif) {
        dropdownActif.remove();
        dropdownActif = null;
    }

    const rect = cell.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.minWidth = '200px';

    // Option pour vider la cellule
    const emptyOption = document.createElement('div');
    emptyOption.className = 'autocomplete-item';
    emptyOption.innerHTML = '<span class="empty-cell">Vider toutes les dates</span>';
    emptyOption.onclick = () => {
        viderAffectationsPourToutesDates(cell, dates, role, jour);
        dropdown.remove();
        dropdownActif = null;
    };
    dropdown.appendChild(emptyOption);

    // Séparateur
    const separator = document.createElement('div');
    separator.style.borderTop = '1px solid #e5e7eb';
    separator.style.margin = '0.25rem 0';
    dropdown.appendChild(separator);

    // Options pour chaque date
    dates.forEach(dateStr => {
        const dateObj = new Date(dateStr + 'T12:00:00');
        const formatted = dateObj.toLocaleDateString('fr-FR', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        const option = document.createElement('div');
        option.className = 'autocomplete-item';
        option.innerHTML = `<i class="fas fa-calendar-day mr-2"></i>${formatted}`;
        option.onclick = () => {
            ouvrirAutocompletePourUneDate(cell, dateStr, role, jour, personneActuelle);
            dropdown.remove();
            dropdownActif = null;
        };
        dropdown.appendChild(option);
    });

    document.body.appendChild(dropdown);
    dropdownActif = dropdown;
}

/**
 * Ouvre l'autocomplete pour une date spécifique
 */
function ouvrirAutocompletePourUneDate(cell, dateStr, role, jour, personneActuelle) {
    // Fermer le dropdown existant
    if (dropdownActif) {
        dropdownActif.remove();
        dropdownActif = null;
    }

    // Récupérer les personnes disponibles pour cette date
    const personnesDisponibles = Object.keys(disponibilitesParDate[dateStr] || {})
        .filter(membre => disponibilitesParDate[dateStr][membre]);

    if (personnesDisponibles.length === 0) {
        alert(`Aucune personne disponible pour cette date (${dateStr})`);
        return;
    }

    // Filtrer les personnes déjà assignées à cette date pour ce rôle
    const personnesDejaAssignees = planning
        .filter(aff => aff.date === dateStr && aff.role === role)
        .map(aff => aff.personne);

    // Créer le dropdown
    const rect = cell.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.minWidth = '200px';

    // Option pour vider la cellule
    const emptyOption = document.createElement('div');
    emptyOption.className = 'autocomplete-item';
    emptyOption.innerHTML = '<span class="empty-cell">Vider</span>';
    emptyOption.onclick = () => {
        modifierAffectationParDate(dateStr, role, null, cell);
        dropdown.remove();
        dropdownActif = null;
    };
    dropdown.appendChild(emptyOption);

    // Séparateur
    const separator = document.createElement('div');
    separator.style.borderTop = '1px solid #e5e7eb';
    separator.style.margin = '0.25rem 0';
    dropdown.appendChild(separator);

    // Options pour les personnes
    personnesDisponibles.forEach(nomPersonne => {
        const option = document.createElement('div');
        option.className = 'autocomplete-item';

        if (nomPersonne === personneActuelle) {
            option.classList.add('selected');
        }

        if (personnesDejaAssignees.includes(nomPersonne)) {
            option.innerHTML = `${nomPersonne} <span style="color: #ef4444; font-size: 0.75rem; margin-left: 0.5rem;">⚠ déjà assigné</span>`;
        } else {
            option.textContent = nomPersonne;
        }

        option.onclick = () => {
            modifierAffectationParDate(dateStr, role, nomPersonne, cell);
            dropdown.remove();
            dropdownActif = null;
        };
        dropdown.appendChild(option);
    });

    document.body.appendChild(dropdown);
    dropdownActif = dropdown;
}

/**
 * Vide les affectations pour toutes les dates d'une semaine
 */
function viderAffectationsPourToutesDates(cell, dates, role, jour) {
    dates.forEach(dateStr => {
        modifierAffectationParDate(dateStr, role, null, cell);
    });
    // Rafraîchir le tableau
    afficherTableauPlanning();
    sauvegarderDonnees();
}

/**
 * Modifie une affectation basée sur une date spécifique
 */
function modifierAffectationParDate(dateStr, role, nouvellePersonne, cell) {
    // Trouver et supprimer l'ancienne affectation pour cette date et ce rôle
    const dateObj = new Date(dateStr + 'T12:00:00');
    const jourIndex = dateObj.getDay();
    const nomJour = JOURS_SEMAINE[jourIndex];

    const index = planning.findIndex(aff =>
        aff.date === dateStr &&
        aff.jour === nomJour &&
        aff.role === role
    );

    if (index !== -1) {
        planning.splice(index, 1);
    }

    // Ajouter la nouvelle affectation si une personne est sélectionnée
    if (nouvellePersonne) {
        const numeroSemaine = calculerNumeroSemaine(dateObj);

        planning.push({
            semaine: numeroSemaine,
            date: dateStr,
            jour: nomJour,
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
    sauvegarderDonnees();
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
