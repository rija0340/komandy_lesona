// Assistant Tab Component - Real-time Planning Assistant
const { useState, useMemo } = React;

function AssistantTab({ appState }) {
    const [filters, setFilters] = useState({
        personnes: new Set(),
        roles: new Set(),
        semaines: new Set(),
        allPersonnes: true,
        allRoles: true,
        allSemaines: true,
        statutAssignation: 'all',
        highlightPersonnes: false,
        highlightRoles: false,
        highlightSemaines: false
    });

    const JOURS_SEMAINE = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    // Get all unique values
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

    // Get filtered planning
    const filteredPlanning = useMemo(() => {
        let filtered = [...appState.planning];

        if (!filters.allPersonnes && filters.personnes.size > 0) {
            filtered = filtered.filter(p => filters.personnes.has(p.personne));
        }

        if (!filters.allRoles && filters.roles.size > 0) {
            filtered = filtered.filter(p => filters.roles.has(p.role));
        }

        if (!filters.allSemaines && filters.semaines.size > 0) {
            filtered = filtered.filter(p => filters.semaines.has(p.semaine));
        }

        if (filters.statutAssignation === 'assigned') {
            filtered = filtered.filter(p => p.personne !== 'Non assigné');
        } else if (filters.statutAssignation === 'unassigned') {
            filtered = filtered.filter(p => p.personne === 'Non assigné');
        }

        return filtered;
    }, [appState.planning, filters]);

    // Calculate statistics
    const statistics = useMemo(() => {
        const stats = {};
        const totalAffectations = filteredPlanning.length;

        filteredPlanning.forEach(item => {
            if (!stats[item.personne]) {
                stats[item.personne] = { total: 0, parRole: {} };
            }
            stats[item.personne].total++;
            stats[item.personne].parRole[item.role] = (stats[item.personne].parRole[item.role] || 0) + 1;
        });

        return { stats, totalAffectations };
    }, [filteredPlanning]);

    // Toggle functions
    const togglePersonne = (personne) => {
        setFilters(prev => {
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

    const toggleAllPersonnes = () => {
        setFilters(prev => ({
            ...prev,
            allPersonnes: !prev.allPersonnes,
            personnes: new Set()
        }));
    };

    const toggleRole = (role) => {
        setFilters(prev => {
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

    const toggleAllRoles = () => {
        setFilters(prev => ({
            ...prev,
            allRoles: !prev.allRoles,
            roles: new Set()
        }));
    };

    const toggleSemaine = (semaine) => {
        setFilters(prev => {
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

    const toggleAllSemaines = () => {
        setFilters(prev => ({
            ...prev,
            allSemaines: !prev.allSemaines,
            semaines: new Set()
        }));
    };

    // Analyze fairness
    const analyseEquite = () => {
        const stats = statistics.stats;
        const totalAffectations = statistics.totalAffectations;
        const moyenne = totalAffectations / Object.keys(stats).length;

        return Object.entries(stats)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([nom, data]) => {
                const diff = data.total - moyenne;
                const status = diff > 0.5 ? 'over' : (diff < -0.5 ? 'under' : 'balanced');
                return { nom, total: data.total, status, diff };
            });
    };

    // Get assigned and unassigned roles
    const getRolesSummary = () => {
        const assignes = new Set(filteredPlanning.filter(p => p.personne !== 'Non assigné').map(p => p.role));
        const nonAssignes = new Set(filteredPlanning.filter(p => p.personne === 'Non assigné').map(p => p.role));
        return { assignes: Array.from(assignes), nonAssignes: Array.from(nonAssignes) };
    };

    if (appState.planning.length === 0) {
        return (
            <div className="text-center text-gray-500 py-12">
                <i className="fas fa-robot text-6xl mb-4 text-gray-300"></i>
                <p className="text-lg">Générez un planning pour utiliser l'assistant</p>
            </div>
        );
    }

    const rolesSummary = getRolesSummary();
    const equite = analyseEquite();

    return (
        <div>
            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Personnes Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            <i className="fas fa-user mr-1"></i>
                            Personnes
                            <label className="float-right font-normal cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.highlightPersonnes}
                                    onChange={(e) => setFilters(prev => ({ ...prev, highlightPersonnes: e.target.checked }))}
                                    className="mr-1"
                                />
                                <span className="text-xs">Surligner</span>
                            </label>
                        </label>
                        <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto bg-white text-xs">
                            <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.allPersonnes}
                                    onChange={toggleAllPersonnes}
                                    className="cursor-pointer"
                                />
                                <span className="font-semibold">Toutes</span>
                            </label>
                            <hr className="my-1 border-gray-200" />
                            {uniquePersonnes.map(personne => (
                                <label key={personne} className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.personnes.has(personne)}
                                        onChange={() => togglePersonne(personne)}
                                        className="cursor-pointer"
                                    />
                                    <span>{personne}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Roles Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            <i className="fas fa-tasks mr-1"></i>
                            Rôles
                            <label className="float-right font-normal cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.highlightRoles}
                                    onChange={(e) => setFilters(prev => ({ ...prev, highlightRoles: e.target.checked }))}
                                    className="mr-1"
                                />
                                <span className="text-xs">Surligner</span>
                            </label>
                        </label>
                        <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto bg-white text-xs">
                            <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.allRoles}
                                    onChange={toggleAllRoles}
                                    className="cursor-pointer"
                                />
                                <span className="font-semibold">Tous</span>
                            </label>
                            <hr className="my-1 border-gray-200" />
                            {tousLesRoles.map(role => (
                                <label key={role} className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.roles.has(role)}
                                        onChange={() => toggleRole(role)}
                                        className="cursor-pointer"
                                    />
                                    <span>{role}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Semaines Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            <i className="fas fa-calendar-week mr-1"></i>
                            Semaines
                            <label className="float-right font-normal cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.highlightSemaines}
                                    onChange={(e) => setFilters(prev => ({ ...prev, highlightSemaines: e.target.checked }))}
                                    className="mr-1"
                                />
                                <span className="text-xs">Surligner</span>
                            </label>
                        </label>
                        <div className="border border-gray-300 rounded p-2 max-h-32 overflow-y-auto bg-white text-xs">
                            <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.allSemaines}
                                    onChange={toggleAllSemaines}
                                    className="cursor-pointer"
                                />
                                <span className="font-semibold">Toutes</span>
                            </label>
                            <hr className="my-1 border-gray-200" />
                            {uniqueSemaines.map(semaine => (
                                <label key={semaine} className="flex items-center gap-1.5 mb-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.semaines.has(semaine)}
                                        onChange={() => toggleSemaine(semaine)}
                                        className="cursor-pointer"
                                    />
                                    <span>Sem. {semaine}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Statut Filter */}
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
                                    checked={filters.statutAssignation === 'all'}
                                    onChange={(e) => setFilters(prev => ({ ...prev, statutAssignation: e.target.value }))}
                                    className="cursor-pointer"
                                />
                                <span>Tous</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="statutAssignation"
                                    value="assigned"
                                    checked={filters.statutAssignation === 'assigned'}
                                    onChange={(e) => setFilters(prev => ({ ...prev, statutAssignation: e.target.value }))}
                                    className="cursor-pointer"
                                />
                                <span>Assignés</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="statutAssignation"
                                    value="unassigned"
                                    checked={filters.statutAssignation === 'unassigned'}
                                    onChange={(e) => setFilters(prev => ({ ...prev, statutAssignation: e.target.value }))}
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
                            {tousLesRoles.filter(role => filters.allRoles || filters.roles.has(role)).map(role => (
                                <th key={role} className="border border-gray-300 p-1 text-center">{role}</th>
                            ))}
                            <th className="border border-gray-300 p-1 text-center">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniquePersonnes.filter(p => filters.allPersonnes || filters.personnes.has(p)).map(personne => {
                            let totalPersonne = 0;
                            return (
                                <tr key={personne} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 p-1 font-semibold sticky left-0 bg-white">{personne}</td>
                                    {tousLesRoles.filter(role => filters.allRoles || filters.roles.has(role)).map(role => {
                                        const nbAssignations = filteredPlanning.filter(aff =>
                                            aff.personne === personne && aff.role === role
                                        ).length;
                                        totalPersonne += nbAssignations;
                                        return (
                                            <td key={role} className="border border-gray-300 p-1 text-center">
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
                    Moyenne : {(statistics.totalAffectations / Object.keys(statistics.stats).length).toFixed(1)} affectations par personne
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
    );
}
