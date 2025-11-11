// Main App Component
const { useState, useEffect } = React;

function App({ currentRoute }) {
    const [appState, setAppState] = useState({
        personnes: [],
        planning: [],
        datesSelectionnees: [],
        membresSelectionnes: [],
        disponibilitesParDate: {},
        rolesParTypeJour: {},
        modeEquite: true,
        modeDebug: false,
        jours: [],
        roles: {}
    });

    const [configExpanded, setConfigExpanded] = useState(true);

    // Constants
    const JOURS_SEMAINE = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    // Load data from localStorage on mount
    useEffect(() => {
        const data = localStorage.getItem('planningData');
        if (data) {
            setAppState(JSON.parse(data));
        }
    }, []);

    // Save data to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('planningData', JSON.stringify(appState));
    }, [appState]);

    // Toggle configuration panel
    const toggleConfig = () => {
        setConfigExpanded(!configExpanded);
    };

    // Switch tab
    const switchTab = (tabName) => {
        window.Router.navigate(tabName);
    };

    // Add a person
    const ajouterPersonne = (nom) => {
        if (nom && !appState.personnes.find(p => p.nom === nom)) {
            const newPersonne = { nom, disponibilites: [] };
            setAppState(prev => ({
                ...prev,
                personnes: [...prev.personnes, newPersonne]
            }));
            return true;
        }
        return false;
    };

    // Remove a person
    const supprimerPersonne = (nom) => {
        setAppState(prev => ({
            ...prev,
            personnes: prev.personnes.filter(p => p.nom !== nom)
        }));
    };

    // Add date
    const ajouterDate = (dateString) => {
        if (!appState.datesSelectionnees.includes(dateString)) {
            setAppState(prev => ({
                ...prev,
                datesSelectionnees: [...prev.datesSelectionnees, dateString].sort()
            }));
        }
    };

    // Set multiple dates at once (to avoid duplicates)
    const setDates = (dateStrings) => {
        setAppState(prev => ({
            ...prev,
            datesSelectionnees: [...dateStrings].sort()
        }));
    };

    // Remove date
    const supprimerDate = (dateString) => {
        setAppState(prev => ({
            ...prev,
            datesSelectionnees: prev.datesSelectionnees.filter(d => d !== dateString)
        }));
    };

    // Add role
    const ajouterRole = (typeJour, nomRole) => {
        setAppState(prev => {
            const newRoles = { ...prev.rolesParTypeJour };
            if (!newRoles[typeJour]) {
                newRoles[typeJour] = [];
            }
            if (!newRoles[typeJour].includes(nomRole)) {
                newRoles[typeJour] = [...newRoles[typeJour], nomRole];
            }
            return {
                ...prev,
                rolesParTypeJour: newRoles
            };
        });
    };

    // Remove role
    const supprimerRole = (typeJour, nomRole) => {
        setAppState(prev => {
            const newRoles = { ...prev.rolesParTypeJour };
            if (newRoles[typeJour]) {
                newRoles[typeJour] = newRoles[typeJour].filter(r => r !== nomRole);
            }
            return {
                ...prev,
                rolesParTypeJour: newRoles
            };
        });
    };

    // Toggle availability
    const toggleDisponibilite = (date, personne) => {
        setAppState(prev => {
            const newDisponibilites = { ...prev.disponibilitesParDate };
            if (!newDisponibilites[date]) {
                newDisponibilites[date] = {};
            }
            newDisponibilites[date][personne] = !newDisponibilites[date][personne];
            return {
                ...prev,
                disponibilitesParDate: newDisponibilites
            };
        });
    };

    // Toggle member selection for planning
    const toggleMembreSelection = (nom) => {
        setAppState(prev => {
            const newMembres = [...prev.membresSelectionnes];
            const index = newMembres.indexOf(nom);
            if (index === -1) {
                newMembres.push(nom);
            } else {
                newMembres.splice(index, 1);
            }
            return {
                ...prev,
                membresSelectionnes: newMembres
            };
        });
    };

    // Calculate week number for a date
    const calculerNumeroSemaine = (date) => {
        const debutAnnee = new Date(date.getFullYear(), 0, 1);
        const diffTemps = date - debutAnnee;
        const diffJours = Math.floor(diffTemps / (1000 * 60 * 60 * 24));
        return Math.ceil((diffJours + 1) / 7);
    };

    // Group dates by week
    const regrouperDatesParSemaine = (dates) => {
        const datesParSemaine = {};
        dates.forEach(dateStr => {
            const date = new Date(dateStr);
            const numeroSemaine = calculerNumeroSemaine(date);
            if (!datesParSemaine[numeroSemaine]) {
                datesParSemaine[numeroSemaine] = [];
            }
            datesParSemaine[numeroSemaine].push(dateStr);
        });
        Object.keys(datesParSemaine).forEach(semaine => {
            datesParSemaine[semaine].sort();
        });
        return datesParSemaine;
    };

    // Generate planning with advanced algorithm
    const genererPlanning = () => {
        const modeEquite = appState.modeEquite;
        const modeDebug = appState.modeDebug;

        if (Object.keys(appState.rolesParTypeJour).length === 0) {
            alert('Veuillez d\'abord configurer les rôles par type de jour');
            return;
        }

        if (appState.membresSelectionnes.length === 0) {
            alert('Veuillez d\'abord sélectionner des membres');
            return;
        }

        if (appState.datesSelectionnees.length === 0) {
            alert('Veuillez sélectionner des dates');
            return;
        }

        const newPlanning = [];
        const compteurs = {};
        appState.membresSelectionnes.forEach(nom => compteurs[nom] = 0);

        let erreurs = [];

        // Sort dates
        const datesTriees = [...appState.datesSelectionnees].sort();

        for (const date of datesTriees) {
            const dateObj = new Date(date);
            const jourIndex = dateObj.getDay();
            const rolesDuJour = appState.rolesParTypeJour[jourIndex] || [];

            if (rolesDuJour.length === 0) {
                continue;
            }

            // Filter available members for this date
            const personnesDisponibles = appState.membresSelectionnes.filter(membre =>
                appState.disponibilitesParDate[date]?.[membre]
            );

            if (personnesDisponibles.length === 0) {
                erreurs.push(`${date}: Aucune personne disponible`);
                continue;
            }

            // Filter people not already assigned on this date
            const personnesDejaAssignees = newPlanning
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
                // Check if role is already assigned on this date
                const roleDejaAssigne = newPlanning.some(aff =>
                    aff.date === date && aff.role === role
                );

                if (roleDejaAssigne) {
                    continue;
                }

                let personneTrouvee = null;

                // Rotation rule: prioritize people who haven't done this role
                const personnesSansRole = personnesEligibles.filter(p => {
                    return !newPlanning.some(aff => aff.personne === p && aff.role === role);
                });

                if (personnesSansRole.length > 0) {
                    personnesEligibles = personnesSansRole;
                }

                if (modeEquite) {
                    // Find person with least assignments
                    const minCompteur = Math.min(...personnesEligibles.map(p => compteurs[p]));
                    const candidats = personnesEligibles.filter(p => compteurs[p] === minCompteur);

                    personneTrouvee = candidats[Math.floor(Math.random() * candidats.length)];
                } else {
                    // Random mode
                    personneTrouvee = personnesEligibles[
                        Math.floor(Math.random() * personnesEligibles.length)
                    ];
                }

                if (personneTrouvee) {
                    const numeroSemaine = calculerNumeroSemaine(dateObj);
                    const nomJour = JOURS_SEMAINE[jourIndex];
                    newPlanning.push({
                        semaine: numeroSemaine,
                        date: date,
                        jour: nomJour,
                        role,
                        personne: personneTrouvee
                    });
                    compteurs[personneTrouvee]++;

                    // Remove person from eligible list for this date
                    personnesEligibles = personnesEligibles.filter(p => p !== personneTrouvee);
                }
            }
        }

        setAppState(prev => ({
            ...prev,
            planning: newPlanning
        }));

        if (erreurs.length > 0 && modeDebug) {
            console.log('Erreurs:', erreurs);
        }
    };

    // Reset planning
    const reinitialiserPlanning = () => {
        setAppState(prev => ({
            ...prev,
            planning: []
        }));
    };

    // Modify assignment 
    const modifierAffectationParDate = (dateStr, role, nouvellePersonne) => {
        setAppState(prev => {
            // Find and remove the old assignment
            let newPlanning = prev.planning.filter(aff =>
                !(aff.date === dateStr && aff.role === role)
            );

            // Add the new assignment if a person is selected
            if (nouvellePersonne) {
                // Get date info for the new assignment
                const dateObj = new Date(dateStr);
                const jourIndex = dateObj.getDay();
                const nomJour = JOURS_SEMAINE[jourIndex];
                const numeroSemaine = calculerNumeroSemaine(dateObj);

                newPlanning.push({
                    semaine: numeroSemaine,
                    date: dateStr,
                    jour: nomJour,
                    role,
                    personne: nouvellePersonne
                });
            }

            return { ...prev, planning: newPlanning };
        });
    };

    // Modify a role
    const modifierRole = (ancienNomRole, nouveauNomRole, jourIndex) => {
        if (nouveauNomRole === ancienNomRole) return; // No change needed

        // Check if the new role name already exists for this day
        if (appState.rolesParTypeJour[jourIndex] && appState.rolesParTypeJour[jourIndex].includes(nouveauNomRole)) {
            alert(`Le rôle "${nouveauNomRole}" existe déjà pour ce type de jour`);
            return false;
        }

        setAppState(prev => {
            const newRolesParTypeJour = { ...prev.rolesParTypeJour };
            if (newRolesParTypeJour[jourIndex]) {
                const index = newRolesParTypeJour[jourIndex].indexOf(ancienNomRole);
                if (index !== -1) {
                    newRolesParTypeJour[jourIndex][index] = nouveauNomRole;
                }
            }

            // Also update any planning assignments with the old role name
            const newPlanning = prev.planning.map(aff => {
                if (aff.role === ancienNomRole) {
                    // Check if this assignment is for the correct day type
                    const dateObj = new Date(aff.date);
                    if (dateObj.getDay() === jourIndex) {
                        return { ...aff, role: nouveauNomRole };
                    }
                }
                return aff;
            });

            return { ...prev, rolesParTypeJour: newRolesParTypeJour, planning: newPlanning };
        });

        return true;
    };

    // Reset all data
    const reinitialiserDonnees = () => {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ?')) {
            setAppState({
                personnes: [],
                planning: [],
                datesSelectionnees: [],
                membresSelectionnes: [],
                disponibilitesParDate: {},
                rolesParTypeJour: {},
                modeEquite: true,
                modeDebug: false,
                jours: [],
                roles: {}
            });
        }
    };

    // Export to JSON
    const exporterJSON = () => {
        const data = {
            personnes: appState.personnes,
            datesSelectionnees: appState.datesSelectionnees,
            disponibilitesParDate: appState.disponibilitesParDate,
            rolesParTypeJour: appState.rolesParTypeJour
        };
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'planning-config.json';
        link.click();
    };

    // Import from JSON
    const importerJSON = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);

                        // Validate structure
                        if (!data.personnes || !Array.isArray(data.personnes)) {
                            throw new Error('Format invalide: "personnes" manquant ou non-array');
                        }

                        if (!data.datesSelectionnees || !Array.isArray(data.datesSelectionnees)) {
                            throw new Error('Format invalide: "datesSelectionnees" manquant ou non-array');
                        }

                        if (!data.rolesParTypeJour || typeof data.rolesParTypeJour !== 'object') {
                            throw new Error('Format invalide: "rolesParTypeJour" manquant ou non-object');
                        }

                        setAppState(prev => ({
                            ...prev,
                            personnes: data.personnes || [],
                            datesSelectionnees: data.datesSelectionnees || [],
                            membresSelectionnes: data.membresSelectionnes || [],
                            disponibilitesParDate: data.disponibilitesParDate || {},
                            rolesParTypeJour: data.rolesParTypeJour || {}
                        }));
                        alert('Configuration importée avec succès !');
                    } catch (error) {
                        alert('Erreur lors de l\'importation : ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    // Import planning from JSON
    const importerPlanningJSON = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);

                        // Validate structure
                        if (!data.config || !data.planning) {
                            throw new Error('Format invalide: structure du fichier incomplète');
                        }

                        // Import configuration
                        if (data.config.personnes) setAppState(prev => ({ ...prev, personnes: data.config.personnes }));
                        if (data.config.datesSelectionnees) setAppState(prev => ({ ...prev, datesSelectionnees: data.config.datesSelectionnees }));
                        if (data.config.membresSelectionnes) setAppState(prev => ({ ...prev, membresSelectionnes: data.config.membresSelectionnes }));
                        if (data.config.disponibilitesParDate) setAppState(prev => ({ ...prev, disponibilitesParDate: data.config.disponibilitesParDate }));
                        if (data.config.rolesParTypeJour) setAppState(prev => ({ ...prev, rolesParTypeJour: data.config.rolesParTypeJour }));

                        // Import planning
                        if (Array.isArray(data.planning)) {
                            setAppState(prev => ({ ...prev, planning: data.planning }));
                        }

                        alert('Planning importé avec succès !');
                    } catch (error) {
                        alert('Erreur lors de l\'importation : ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    // Get all unique days from selected dates
    const getJoursAvecDates = () => {
        const joursMap = {};
        appState.datesSelectionnees.forEach(dateString => {
            const date = new Date(dateString);
            const jourSemaine = date.getDay();
            if (!joursMap[jourSemaine]) {
                joursMap[jourSemaine] = {
                    jour: JOURS_SEMAINE[jourSemaine],
                    dates: []
                };
            }
            joursMap[jourSemaine].dates.push(dateString);
        });
        return joursMap;
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="glass-effect rounded-2xl p-8 mb-8 text-center fade-in">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                    <i className="fas fa-calendar-alt mr-3 text-gray-700"></i>
                    Planning d'Affectation de Rôles Religieux
                </h1>
                <p className="text-gray-600 text-lg">Génération automatique équilibrée sur plusieurs semaines</p>
            </div>

            {/* Configuration Panel */}
            <div className="glass-effect rounded-2xl mb-8 overflow-hidden fade-in">
                <div
                    className="bg-white border-b p-6 cursor-pointer flex justify-between items-center"
                    onClick={toggleConfig}
                >
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <i className="fas fa-cog mr-3"></i>
                        Configuration
                    </h2>
                    <i
                        className={`fas fa-chevron-down text-gray-900 text-xl transition-transform duration-300 ${
                            configExpanded ? '' : 'rotate-180'
                        }`}
                    ></i>
                </div>
                <div
                    className={`p-6 ${configExpanded ? 'config-expanded' : 'config-collapsed'}`}
                    style={{
                        maxHeight: configExpanded ? '1000px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease'
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Mode de génération
                            </label>
                            <select
                                className="w-full px-4 py-3 rounded-lg focus:outline-none"
                                value="dates"
                                readOnly
                            >
                                <option value="dates">Par dates sélectionnées</option>
                            </select>
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={appState.modeEquite}
                                    onChange={(e) =>
                                        setAppState(prev => ({ ...prev, modeEquite: e.target.checked }))
                                    }
                                    className="mr-3"
                                />
                                <span className="text-gray-700 font-medium">Mode équité absolue</span>
                            </label>
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={appState.modeDebug}
                                    onChange={(e) =>
                                        setAppState(prev => ({ ...prev, modeDebug: e.target.checked }))
                                    }
                                    className="mr-3"
                                />
                                <span className="text-gray-700 font-medium">Afficher debug</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="glass-effect rounded-2xl overflow-hidden fade-in">
                <div className="flex border-b border-gray-200">
                    <button
                        className={`tab-button flex-1 py-4 px-6 font-semibold text-gray-600 transition-all duration-300 active border-r border-gray-200 ${
                            currentRoute === 'configurer' ? 'active' : ''
                        }`}
                        onClick={() => switchTab('configurer')}
                    >
                        <i className="fas fa-sliders-h mr-2"></i>
                        Configurer
                    </button>
                    <button
                        className={`tab-button flex-1 py-4 px-6 font-semibold text-gray-600 transition-all duration-300 border-r border-gray-200 ${
                            currentRoute === 'planning' ? 'active' : ''
                        }`}
                        onClick={() => switchTab('planning')}
                    >
                        <i className="fas fa-calendar-week mr-2"></i>
                        Planning
                    </button>
                    <button
                        className={`tab-button flex-1 py-4 px-6 font-semibold text-gray-600 transition-all duration-300 ${
                            currentRoute === 'statistiques' ? 'active' : ''
                        }`}
                        onClick={() => switchTab('statistiques')}
                    >
                        <i className="fas fa-chart-bar mr-2"></i>
                        Statistiques
                    </button>

                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {currentRoute === 'configurer' && (
                        <ConfigurerTab
                            appState={appState}
                            ajouterPersonne={ajouterPersonne}
                            supprimerPersonne={supprimerPersonne}
                            ajouterDate={ajouterDate}
                            setDates={setDates}
                            supprimerDate={supprimerDate}
                            ajouterRole={ajouterRole}
                            supprimerRole={supprimerRole}
                            modifierRole={modifierRole}
                            toggleDisponibilite={toggleDisponibilite}
                            toggleMembreSelection={toggleMembreSelection}
                            exporterJSON={exporterJSON}
                            importerJSON={importerJSON}
                            reinitialiserDonnees={reinitialiserDonnees}
                            getJoursAvecDates={getJoursAvecDates}
                        />
                    )}
                    {currentRoute === 'planning' && (
                        <PlanningTab
                            appState={appState}
                            genererPlanning={genererPlanning}
                            reinitialiserPlanning={reinitialiserPlanning}
                            importerPlanningJSON={importerPlanningJSON}
                            modifierAffectationParDate={modifierAffectationParDate}
                        />
                    )}
                    {currentRoute === 'statistiques' && (
                        <StatistiquesTab appState={appState} />
                    )}

                </div>
            </div>
        </div>
    );
}
