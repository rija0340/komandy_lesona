// Planning Tab Component
const { useState, useMemo } = React;

function PlanningTab({ appState, genererPlanning, reinitialiserPlanning, importerPlanningJSON, modifierAffectationParDate }) {
    const [message, setMessage] = useState('');
    
    // Assistant tab state and logic
    const [assistantFilters, setAssistantFilters] = useState({
        personnes: new Set(),
        roles: new Set(),
        semaines: new Set(),
        allPersonnes: true,
        allRoles: true,
        allSemaines: true,
        statutAssignation: 'all'
    });

    // Get all unique values for assistant
    const tousLesRoles = useMemo(() => {
        const roles = new Set();
        Object.values(appState.rolesParTypeJour).forEach(rolesJour => {
            rolesJour.forEach(role => roles.add(role));
        });
        return Array.from(roles).sort();
    }, [appState.rolesParTypeJour]);

    const uniquePersonnes = useMemo(() => {
        return appState.personnes.map(p => p.nom).sort();
    }, [appState.personnes]);

    const uniqueSemaines = useMemo(() => {
        const datesParSemaine = {};
        appState.datesSelectionnees.forEach(dateStr => {
            const date = new Date(dateStr);
            const numeroSemaine = Math.ceil((date.getDay() + 1 + Math.floor((date - new Date(date.getFullYear(), 0, 1)) / 86400000)) / 7);
            if (!datesParSemaine[numeroSemaine]) {
                datesParSemaine[numeroSemaine] = [];
            }
            datesParSemaine[numeroSemaine].push(dateStr);
        });
        return Object.keys(datesParSemaine).map(n => parseInt(n)).sort((a, b) => a - b);
    }, [appState.datesSelectionnees]);

    // Get filtered planning for assistant
    const filteredAssistantPlanning = useMemo(() => {
        let filtered = [...appState.planning];

        if (!assistantFilters.allPersonnes && assistantFilters.personnes.size > 0) {
            filtered = filtered.filter(p => assistantFilters.personnes.has(p.personne));
        }

        if (!assistantFilters.allRoles && assistantFilters.roles.size > 0) {
            filtered = filtered.filter(p => assistantFilters.roles.has(p.role));
        }

        if (!assistantFilters.allSemaines && assistantFilters.semaines.size > 0) {
            filtered = filtered.filter(p => assistantFilters.semaines.has(p.semaine));
        }

        if (assistantFilters.statutAssignation === 'assigned') {
            filtered = filtered.filter(p => p.personne !== 'Non assigné');
        } else if (assistantFilters.statutAssignation === 'unassigned') {
            filtered = filtered.filter(p => p.personne === 'Non assigné');
        }

        return filtered;
    }, [appState.planning, assistantFilters]);

    // Calculate assistant statistics
    const assistantStatistics = useMemo(() => {
        const stats = {};
        const totalAffectations = filteredAssistantPlanning.length;

        filteredAssistantPlanning.forEach(item => {
            if (!stats[item.personne]) {
                stats[item.personne] = { total: 0, parRole: {} };
            }
            stats[item.personne].total++;
            stats[item.personne].parRole[item.role] = (stats[item.personne].parRole[item.role] || 0) + 1;
        });

        return { stats, totalAffectations };
    }, [filteredAssistantPlanning]);

    // Assistant toggle functions
    const toggleAssistantPersonne = (personne) => {
        setAssistantFilters(prev => {
            const newPersonnes = new Set(prev.personnes);
            if (newPersonnes.has(personne)) {
                newPersonnes.delete(personne);
            } else {
                newPersonnes.add(personne);
            }
            return { 
                ...prev, 
                personnes: newPersonnes,
                allPersonnes: false
            };
        });
    };

    const toggleAssistantRole = (role) => {
        setAssistantFilters(prev => {
            const newRoles = new Set(prev.roles);
            if (newRoles.has(role)) {
                newRoles.delete(role);
            } else {
                newRoles.add(role);
            }
            return { 
                ...prev, 
                roles: newRoles,
                allRoles: false
            };
        });
    };

    const toggleAssistantSemaine = (semaine) => {
        setAssistantFilters(prev => {
            const newSemaines = new Set(prev.semaines);
            if (newSemaines.has(semaine)) {
                newSemaines.delete(semaine);
            } else {
                newSemaines.add(semaine);
            }
            return { 
                ...prev, 
                semaines: newSemaines,
                allSemaines: false
            };
        });
    };

    const toggleAllAssistantPersonnes = () => {
        setAssistantFilters(prev => ({
            ...prev,
            allPersonnes: !prev.allPersonnes,
            personnes: new Set()
        }));
    };

    const toggleAllAssistantRoles = () => {
        setAssistantFilters(prev => ({
            ...prev,
            allRoles: !prev.allRoles,
            roles: new Set()
        }));
    };

    const toggleAllAssistantSemaines = () => {
        setAssistantFilters(prev => ({
            ...prev,
            allSemaines: !prev.allSemaines,
            semaines: new Set()
        }));
    };

    // Calculate equity for assistant
    const equite = useMemo(() => {
        const stats = {};
        appState.personnes.forEach(p => {
            stats[p.nom] = filteredAssistantPlanning.filter(a => a.personne === p.nom).length;
        });
        
        const valeurs = Object.values(stats);
        if (valeurs.length === 0) return [];
        
        const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
        const max = Math.max(...valeurs);
        const min = Math.min(...valeurs);
        
        return Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .map(([nom, total]) => {
                const diff = total - moyenne;
                const status = diff > 0.5 ? 'over' : (diff < -0.5 ? 'under' : 'balanced');
                return { nom, total, status, diff };
            });
    }, [filteredAssistantPlanning, appState.personnes]);

    // Calculate roles summary for assistant
    const rolesSummary = useMemo(() => {
        const assignesSet = new Set();
        const nonAssignesSet = new Set();

        // Add all roles from rolesParTypeJour
        Object.values(appState.rolesParTypeJour).forEach(roles => {
            roles.forEach(role => nonAssignesSet.add(role));
        });

        // Remove assigned roles
        appState.planning.forEach(item => {
            if (item.personne !== 'Non assigné' && item.personne !== '') {
                assignesSet.add(item.role);
                nonAssignesSet.delete(item.role);
            }
        });

        return {
            assignes: Array.from(assignesSet),
            nonAssignes: Array.from(nonAssignesSet)
        };
    }, [appState.planning, appState.rolesParTypeJour]);

    const JOURS_SEMAINE = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    // Group planning by week
    const planningByWeek = useMemo(() => {
        const grouped = {};
        appState.planning.forEach(item => {
            if (!grouped[item.semaine]) {
                grouped[item.semaine] = [];
            }
            grouped[item.semaine].push(item);
        });
        return grouped;
    }, [appState.planning]);

    // Get dates grouped by week
    const datesParSemaine = useMemo(() => {
        const grouped = {};
        appState.datesSelectionnees.forEach(dateStr => {
            const date = new Date(dateStr);
            const numeroSemaine = Math.ceil((date.getDay() + 1 + Math.floor((date - new Date(date.getFullYear(), 0, 1)) / 86400000)) / 7);
            if (!grouped[numeroSemaine]) {
                grouped[numeroSemaine] = [];
            }
            grouped[numeroSemaine].push(dateStr);
        });
        Object.keys(grouped).forEach(semaine => {
            grouped[semaine].sort();
        });
        return grouped;
    }, [appState.datesSelectionnees]);

    // Get unique week numbers
    const numeroSemaines = useMemo(() => {
        return Object.keys(datesParSemaine).sort((a, b) => parseInt(a) - parseInt(b));
    }, [datesParSemaine]);

    // Get present days of the week
    const joursPresents = useMemo(() => {
        const jours = new Set();
        appState.datesSelectionnees.forEach(dateStr => {
            const dateObj = new Date(dateStr);
            jours.add(dateObj.getDay());
        });
        return jours;
    }, [appState.datesSelectionnees]);

    // Get all unique roles
    const rolesUniques = useMemo(() => {
        const roles = new Set();
        Object.entries(appState.rolesParTypeJour).forEach(([jourIndex, rolesJour]) => {
            if (joursPresents.has(parseInt(jourIndex))) {
                rolesJour.forEach(role => roles.add(role));
            }
        });
        return Array.from(roles);
    }, [appState.rolesParTypeJour, joursPresents]);

    // Handle generate planning
    const handleGenererPlanning = () => {
        if (appState.datesSelectionnees.length === 0) {
            setMessage('Veuillez sélectionner des dates d\'abord.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        if (appState.personnes.length === 0) {
            setMessage('Veuillez ajouter des personnes d\'abord.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        if (Object.keys(appState.rolesParTypeJour).length === 0) {
            setMessage('Veuillez configurer des rôles d\'abord.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        genererPlanning();
        setMessage('Planning généré avec succès !');
        setTimeout(() => setMessage(''), 3000);
    };

    // Handle reset planning
    const handleReinitialiserPlanning = () => {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser le planning ?')) {
            reinitialiserPlanning();
            setMessage('Planning réinitialisé.');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    // Export to Excel
    const exporterExcel = () => {
        if (appState.planning.length === 0) {
            setMessage('Aucun planning à exporter.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        const data = [['Semaine', 'Date', 'Jour', 'Rôle', 'Personne']];
        appState.planning.forEach(item => {
            data.push([item.semaine, item.date, item.jour, item.role, item.personne]);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Planning');
        XLSX.writeFile(wb, 'planning.xlsx');
    };

    // Export planning to JSON
    const exporterPlanningJSON = () => {
        const data = {
            planning: appState.planning,
            exportDate: new Date().toISOString()
        };
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'planning.json';
        link.click();
    };

    // Import planning from JSON
    const handleImporterPlanningJSON = () => {
        importerPlanningJSON();
    };

    // Editable cell with autocomplete
    const [dropdownActif, setDropdownActif] = useState(null);

    // Modify assignment - this function is now a placeholder that will be replaced
    // by the actual implementation passed from the parent
    // No need to redefine this function since we're receiving it as a prop

    // Open autocomplete for specific date
    const ouvrirAutocompletePourUneDate = (cell, dateStr, role, personneActuelle) => {
        // Close existing dropdown
        if (dropdownActif) {
            dropdownActif.remove();
            setDropdownActif(null);
        }

        // Get available people for this date
        const personnesDisponibles = Object.keys(appState.disponibilitesParDate[dateStr] || {})
            .filter(membre => appState.disponibilitesParDate[dateStr][membre]);

        if (personnesDisponibles.length === 0) {
            alert(`Aucune personne disponible pour cette date (${dateStr})`);
            return;
        }

        // Get people already assigned to this date and role
        const personnesDejaAssignees = appState.planning
            .filter(aff => aff.date === dateStr && aff.role === role)
            .map(aff => aff.personne);

        // Create dropdown
        const rect = cell.getBoundingClientRect();
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.minWidth = '200px';
        dropdown.style.zIndex = '1000';

        // Add styles for dropdown
        const style = document.createElement('style');
        style.textContent = `
            .autocomplete-dropdown {
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                max-height: 200px;
                overflow-y: auto;
            }
            .autocomplete-item {
                padding: 0.5rem 0.75rem;
                cursor: pointer;
                transition: background 0.15s;
            }
            .autocomplete-item:hover {
                background: #f3f4f6;
            }
        `;
        document.head.appendChild(style);

        // Empty option
        const emptyOption = document.createElement('div');
        emptyOption.className = 'autocomplete-item';
        emptyOption.innerHTML = '<span style="color: #9ca3af; font-style: italic;">Vider</span>';
        emptyOption.onclick = () => {
            modifierAffectationParDate(dateStr, role, null);
            dropdown.remove();
            setDropdownActif(null);
        };
        dropdown.appendChild(emptyOption);

        // Separator
        const separator = document.createElement('div');
        separator.style.borderTop = '1px solid #e5e7eb';
        separator.style.margin = '0.25rem 0';
        dropdown.appendChild(separator);

        // Person options
        personnesDisponibles.forEach(nomPersonne => {
            const option = document.createElement('div');
            option.className = 'autocomplete-item';

            if (nomPersonne === personneActuelle) {
                option.style.background = '#e5e7eb';
            }

            if (personnesDejaAssignees.includes(nomPersonne)) {
                option.innerHTML = `${nomPersonne} <span style="color: #ef4444; font-size: 0.75rem; margin-left: 0.5rem;">⚠ déjà assigné</span>`;
            } else {
                option.textContent = nomPersonne;
            }

            option.onclick = () => {
                modifierAffectationParDate(dateStr, role, nomPersonne);
                dropdown.remove();
                setDropdownActif(null);
            };
            dropdown.appendChild(option);
        });

        document.body.appendChild(dropdown);
        setDropdownActif(dropdown);
    };

    return (
        <div>
            {message && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    {message}
                </div>
            )}

            <div className="flex flex-wrap gap-4 mb-6">
                <button
                    onClick={handleGenererPlanning}
                    className="flex-1 md:flex-none btn-gradient font-semibold py-3 px-8 rounded-lg"
                >
                    <i className="fas fa-magic mr-2"></i>
                    GÉNÉRER PLANNING
                </button>
                <button
                    onClick={handleGenererPlanning}
                    className="flex-1 md:flex-none bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                    <i className="fas fa-redo mr-2"></i>
                    RÉESSAYER
                </button>
                <button
                    onClick={handleReinitialiserPlanning}
                    className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                    <i className="fas fa-trash-alt mr-2"></i>
                    RÉINITIALISER
                </button>
                <button
                    onClick={exporterExcel}
                    className="flex-1 md:flex-none bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                    <i className="fas fa-file-excel mr-2"></i>
                    EXPORTER EXCEL
                </button>
                <button
                    onClick={exporterPlanningJSON}
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                    <i className="fas fa-download mr-2"></i>
                    EXPORTER PLANNING
                </button>
                <button
                    onClick={handleImporterPlanningJSON}
                    className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                    <i className="fas fa-upload mr-2"></i>
                    IMPORTER PLANNING
                </button>
            </div>

            {/* Planning Table */}
            <div className="table-container bg-white">
                {appState.planning.length === 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Semaine</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="text-center text-gray-500 py-12">
                                    <i className="fas fa-calendar-times text-6xl mb-4 text-gray-300"></i>
                                    <p className="text-lg">Aucun planning généré. Cliquez sur "GÉNÉRER PLANNING"</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <table>
                        <thead>
                            {/* Desktop View Header */}
                            <tr className="desktop-view">
                                <th className="border-r border-gray-300">Jour</th>
                                <th className="border-r border-gray-300">Rôle</th>
                                {numeroSemaines.map(numSemaine => {
                                    const dates = datesParSemaine[numSemaine];
                                    let formatted;
                                    if (dates.length === 1) {
                                        const dateObj = new Date(dates[0]);
                                        formatted = dateObj.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                                    } else {
                                        const dateDebut = new Date(dates[0]);
                                        const dateFin = new Date(dates[dates.length - 1]);
                                        const formattedDebut = dateDebut.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                                        const formattedFin = dateFin.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                                        formatted = `${formattedDebut}-${formattedFin}`;
                                    }
                                    return (
                                        <th key={numSemaine} className="text-center">
                                            Semaine {numSemaine}
                                            <br />
                                            <span className="text-xs font-normal">{formatted}</span>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Desktop View - Grouped by Day and Role */}
                            {JOURS_SEMAINE.map((nomJour, jourIndex) => {
                                const rolesDuJour = appState.rolesParTypeJour[jourIndex] || [];
                                if (rolesDuJour.length === 0) return null;
                                if (!joursPresents.has(jourIndex)) return null;

                                return rolesDuJour.map((role, roleIndex) => {
                                    const isFirstRole = roleIndex === 0;
                                    const rowspan = rolesDuJour.length;

                                    return (
                                        <tr key={`${jourIndex}-${role}`} className="desktop-view">
                                            {isFirstRole && (
                                                <td rowSpan={rowspan} className="font-semibold bg-gray-50 border-r border-gray-300 align-top">
                                                    {nomJour}
                                                </td>
                                            )}
                                            <td className="bg-gray-50 border-r border-gray-300">
                                                {role}
                                            </td>
                                            {numeroSemaines.map(numSemaine => {
                                                const dates = datesParSemaine[numSemaine];
                                                let affectation = null;
                                                for (const date of dates) {
                                                    affectation = appState.planning.find(p =>
                                                        p.date === date &&
                                                        p.role === role &&
                                                        p.jour === nomJour
                                                    );
                                                    if (affectation) break;
                                                }

                                                const personne = affectation ? affectation.personne : '';
                                                const displayText = personne || 'Vide';
                                                const cellClass = `text-center editable-cell ${!personne ? 'empty-cell' : ''}`;

                                                return (
                                                    <td
                                                        key={numSemaine}
                                                        className={cellClass}
                                                        onClick={(e) => {
                                                            // Find the cell element
                                                            const cell = e.target;
                                                            if (affectation) {
                                                                // Open autocomplete for editing with current person
                                                                ouvrirAutocompletePourUneDate(cell, affectation.date, role, personne);
                                                            } else {
                                                                // Find an appropriate date from the week for the role
                                                                const dates = datesParSemaine[numSemaine];
                                                                if (dates.length > 0) {
                                                                    // Find a date that matches the day of the week for this role
                                                                    const dateForRole = dates.find(date => {
                                                                        const dateObj = new Date(date);
                                                                        const dateJourIndex = dateObj.getDay();
                                                                        return dateJourIndex === jourIndex; // Compare with the day index for this row
                                                                    });
                                                                    
                                                                    // If no specific date found for this day type, use the first date as fallback
                                                                    const targetDate = dateForRole || dates[0];
                                                                    ouvrirAutocompletePourUneDate(cell, targetDate, role, '');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {displayText}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                });
                            })}

                            {/* Mobile View - Grouped by Week */}
                            {numeroSemaines.map(numSemaine => {
                                const dates = datesParSemaine[numSemaine];
                                const dateDebut = new Date(dates[0]);
                                const dateFin = new Date(dates[dates.length - 1]);
                                const formatted = `${dateDebut.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })} au ${dateFin.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}`;

                                return (
                                    <React.Fragment key={`mobile-${numSemaine}`}>
                                        <tr className="mobile-view">
                                            <td colSpan={3} className="week-header bg-gray-100 font-bold text-center py-3">
                                                Semaine {numSemaine}
                                                <br />
                                                <span className="text-xs font-normal">{formatted}</span>
                                            </td>
                                        </tr>
                                        {JOURS_SEMAINE.map(nomJour => {
                                            const jourIndex = JOURS_SEMAINE.indexOf(nomJour);
                                            const rolesDuJour = appState.rolesParTypeJour[jourIndex] || [];
                                            if (!joursPresents.has(jourIndex)) return null;

                                            return rolesDuJour.map(role => {
                                                let affectation = null;
                                                for (const date of dates) {
                                                    affectation = appState.planning.find(p =>
                                                        p.date === date &&
                                                        p.role === role &&
                                                        p.jour === nomJour
                                                    );
                                                    if (affectation) break;
                                                }

                                                const personne = affectation ? affectation.personne : '';
                                                const displayText = personne || 'Vide';

                                                return (
                                                    <tr key={`mobile-${numSemaine}-${jourIndex}-${role}`} className="mobile-view">
                                                        <td data-label="Jour" className="font-semibold">
                                                            {nomJour}
                                                        </td>
                                                        <td data-label="Rôle">
                                                            {role}
                                                        </td>
                                                        <td 
                                                            data-label="Personne" 
                                                            className={`editable-cell ${!personne ? 'empty-cell' : ''}`}
                                                            onClick={(e) => {
                                                                // Find the cell element
                                                                const cell = e.target;
                                                                if (affectation) {
                                                                    // Open autocomplete for editing with current person
                                                                    ouvrirAutocompletePourUneDate(cell, affectation.date, role, personne);
                                                                } else {
                                                                    // Find an appropriate date from the week for the role
                                                                    const dates = datesParSemaine[numSemaine];
                                                                    if (dates.length > 0) {
                                                                        // Find a date that matches the day of the week for this role
                                                                        const dateForRole = dates.find(date => {
                                                                            const dateObj = new Date(date);
                                                                            const dateJourIndex = dateObj.getDay();
                                                                            return dateJourIndex === jourIndex; // Compare with the day index for this row
                                                                        });
                                                                        
                                                                        // If no specific date found for this day type, use the first date as fallback
                                                                        const targetDate = dateForRole || dates[0];
                                                                        ouvrirAutocompletePourUneDate(cell, targetDate, role, '');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            {displayText}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Summary */}
            {appState.planning.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i className="fas fa-chart-pie mr-2 text-blue-500"></i>
                        Résumé du Planning
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="stat-card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total affectations</p>
                                    <p className="text-2xl font-bold text-gray-900">{appState.planning.length}</p>
                                </div>
                                <i className="fas fa-tasks text-3xl text-blue-500"></i>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Semaines</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {Object.keys(planningByWeek).length}
                                    </p>
                                </div>
                                <i className="fas fa-calendar-week text-3xl text-green-500"></i>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Non assignés</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {appState.planning.filter(p => p.personne === 'Non assigné').length}
                                    </p>
                                </div>
                                <i className="fas fa-exclamation-circle text-3xl text-red-500"></i>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Real-time Assistant in Planning Tab */}
            {appState.planning.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-4 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <i className="fas fa-robot mr-2 text-blue-500"></i>
                        Assistant en temps réel
                    </h3>

                    {/* Assistant filters section */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            {/* Filter Persons */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    <i className="fas fa-user mr-1"></i>Personnes
                                </label>
                                <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto bg-white text-xs">
                                    <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={assistantFilters.allPersonnes}
                                            onChange={toggleAllAssistantPersonnes}
                                            className="cursor-pointer"
                                        />
                                        <span className="font-semibold">Toutes</span>
                                    </label>
                                    <hr className="my-1 border-gray-200" />
                                    {uniquePersonnes.map(personne => (
                                        <label key={personne} className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={assistantFilters.personnes.has(personne)}
                                                onChange={() => toggleAssistantPersonne(personne)}
                                                className="cursor-pointer"
                                            />
                                            <span>{personne}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Filter Roles */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    <i className="fas fa-tasks mr-1"></i>Rôles
                                </label>
                                <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto bg-white text-xs">
                                    <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={assistantFilters.allRoles}
                                            onChange={toggleAllAssistantRoles}
                                            className="cursor-pointer"
                                        />
                                        <span className="font-semibold">Tous</span>
                                    </label>
                                    <hr className="my-1 border-gray-200" />
                                    {tousLesRoles.map(role => (
                                        <label key={role} className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={assistantFilters.roles.has(role)}
                                                onChange={() => toggleAssistantRole(role)}
                                                className="cursor-pointer"
                                            />
                                            <span>{role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Filter Weeks */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    <i className="fas fa-calendar-week mr-1"></i>Semaines
                                </label>
                                <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto bg-white text-xs">
                                    <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={assistantFilters.allSemaines}
                                            onChange={toggleAllAssistantSemaines}
                                            className="cursor-pointer"
                                        />
                                        <span className="font-semibold">Toutes</span>
                                    </label>
                                    <hr className="my-1 border-gray-200" />
                                    {uniqueSemaines.map(semaine => (
                                        <label key={semaine} className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={assistantFilters.semaines.has(semaine)}
                                                onChange={() => toggleAssistantSemaine(semaine)}
                                                className="cursor-pointer"
                                            />
                                            <span>Sem. {semaine}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    <i className="fas fa-filter mr-1"></i>
                                    État d'assignation
                                </label>
                                <div className="border border-gray-300 rounded p-2 bg-white text-xs space-y-1">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="statutAssignation"
                                            value="all"
                                            checked={assistantFilters.statutAssignation === 'all'}
                                            onChange={(e) => setAssistantFilters(prev => ({ ...prev, statutAssignation: e.target.value }))}
                                            className="cursor-pointer"
                                        />
                                        <span>Tous</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="statutAssignation"
                                            value="assigned"
                                            checked={assistantFilters.statutAssignation === 'assigned'}
                                            onChange={(e) => setAssistantFilters(prev => ({ ...prev, statutAssignation: e.target.value }))}
                                            className="cursor-pointer"
                                        />
                                        <span>Assignés</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="statutAssignation"
                                            value="unassigned"
                                            checked={assistantFilters.statutAssignation === 'unassigned'}
                                            onChange={(e) => setAssistantFilters(prev => ({ ...prev, statutAssignation: e.target.value }))}
                                            className="cursor-pointer"
                                        />
                                        <span>Non assignés</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Table */}
                    <div className="overflow-x-auto mb-4">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-1 text-left sticky left-0 bg-gray-100 z-10">Personne</th>
                                    {tousLesRoles.filter(role => assistantFilters.allRoles || assistantFilters.roles.has(role)).map(role => (
                                        <th key={role} className="border border-gray-300 p-1 text-center">{role}</th>
                                    ))}
                                    <th className="border border-gray-300 p-1 text-center">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uniquePersonnes.filter(p => assistantFilters.allPersonnes || assistantFilters.personnes.has(p)).map(personne => {
                                    let totalPersonne = 0;
                                    return (
                                        <tr key={personne} className="hover:bg-gray-50">
                                            <td 
                                                className="border border-gray-300 p-1 font-semibold sticky left-0 bg-white cursor-pointer hover:bg-blue-50"
                                            >
                                                {personne}
                                            </td>
                                            {tousLesRoles.filter(role => assistantFilters.allRoles || assistantFilters.roles.has(role)).map(role => {
                                                const nbAssignations = filteredAssistantPlanning.filter(aff =>
                                                    aff.personne === personne && aff.role === role
                                                ).length;
                                                totalPersonne += nbAssignations;
                                                return (
                                                    <td 
                                                        key={role} 
                                                        className="border border-gray-300 p-1 text-center"
                                                    >
                                                        {nbAssignations > 0 ? (
                                                            <span className="text-green-800 font-bold">✓ {nbAssignations}</span>
                                                        ) : (
                                                            <span className="text-gray-500">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="border border-gray-300 p-1 text-center font-bold">
                                                {totalPersonne}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Equity Analysis */}
                    <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-sm mb-2">Analyse d'équité :</h4>
                        <p className="text-xs text-gray-600 mb-2">
                            Moyenne : {(assistantStatistics.totalAffectations / Object.keys(assistantStatistics.stats).length).toFixed(1)} affectations par personne
                        </p>
                        <div className="space-y-1 text-xs">
                            {equite.map(({ nom, total, status, diff }) => {
                                const statusText = status === 'over' ? 'Trop assigné' : (status === 'under' ? 'Peu assigné' : 'Équilibré');
                                const statusColor = status === 'over' ? 'text-red-600' : (status === 'under' ? 'text-yellow-600' : 'text-green-600');
                                return (
                                    <div key={nom} className="flex justify-between">
                                        <span>{nom}:</span>
                                        <span className={statusColor}>{total} ({statusText})</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Roles Summary */}
                    <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-sm mb-2">Résumé des rôles :</h4>
                        <div className="flex flex-wrap gap-2">
                            {rolesSummary.assignes.length > 0 && (
                                <div>
                                    <span className="text-xs font-semibold text-green-600">Assigné : </span>
                                    {rolesSummary.assignes.map(role => (
                                        <span key={role} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {rolesSummary.nonAssignes.length > 0 && (
                                <div className="w-full mt-2">
                                    <span className="text-xs font-semibold text-red-600">Non assigné : </span>
                                    {rolesSummary.nonAssignes.map(role => (
                                        <span key={role} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
