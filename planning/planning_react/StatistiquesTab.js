// Statistiques Tab Component
const { useState, useMemo } = React;

function StatistiquesTab({ appState }) {
    const [filters, setFilters] = useState({
        personnes: new Set(),
        semaines: new Set(),
        roles: new Set(),
        allPersonnes: true,
        allSemaines: true,
        allRoles: true
    });

    const JOURS_SEMAINE = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    // Get unique values
    const uniquePersonnes = useMemo(() => {
        return [...new Set(appState.planning.map(p => p.personne))].filter(p => p !== 'Non assigné');
    }, [appState.planning]);

    const uniqueSemaines = useMemo(() => {
        return [...new Set(appState.planning.map(p => p.semaine))].sort((a, b) => a - b);
    }, [appState.planning]);

    const uniqueRoles = useMemo(() => {
        return [...new Set(appState.planning.map(p => p.role))].sort();
    }, [appState.planning]);

    // Get filtered data
    const filteredPlanning = useMemo(() => {
        let filtered = [...appState.planning];

        if (!filters.allPersonnes && filters.personnes.size > 0) {
            filtered = filtered.filter(p => filters.personnes.has(p.personne));
        }

        if (!filters.allSemaines && filters.semaines.size > 0) {
            filtered = filtered.filter(p => filters.semaines.has(p.semaine));
        }

        if (!filters.allRoles && filters.roles.size > 0) {
            filtered = filtered.filter(p => filters.roles.has(p.role));
        }

        return filtered;
    }, [appState.planning, filters]);

    // Calculate statistics
    const statistics = useMemo(() => {
        const stats = {
            totalAffectations: filteredPlanning.length,
            personnesActives: 0,
            repartitionParPersonne: {},
            repartitionParRole: {},
            repartitionParSemaine: {},
            repartitionParJour: {},
            tauxAssignation: 0
        };

        let assignees = 0;

        filteredPlanning.forEach(item => {
            // Count by person
            if (item.personne !== 'Non assigné') {
                stats.repartitionParPersonne[item.personne] =
                    (stats.repartitionParPersonne[item.personne] || 0) + 1;
                assignees++;
            }

            // Count by role
            stats.repartitionParRole[item.role] =
                (stats.repartitionParRole[item.role] || 0) + 1;

            // Count by week
            stats.repartitionParSemaine[item.semaine] =
                (stats.repartitionParSemaine[item.semaine] || 0) + 1;

            // Count by day
            stats.repartitionParJour[item.jour] =
                (stats.repartitionParJour[item.jour] || 0) + 1;
        });

        stats.personnesActives = Object.keys(stats.repartitionParPersonne).length;
        stats.tauxAssignation = stats.totalAffectations > 0
            ? Math.round((assignees / stats.totalAffectations) * 100)
            : 0;

        return stats;
    }, [filteredPlanning]);

    // Handle filter changes
    const toggleAllPersonnes = () => {
        setFilters(prev => ({
            ...prev,
            allPersonnes: !prev.allPersonnes,
            personnes: new Set()
        }));
    };

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

    const toggleAllSemaines = () => {
        setFilters(prev => ({
            ...prev,
            allSemaines: !prev.allSemaines,
            semaines: new Set()
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

    const toggleAllRoles = () => {
        setFilters(prev => ({
            ...prev,
            allRoles: !prev.allRoles,
            roles: new Set()
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

    return (
        <div>
            {appState.planning.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    <i className="fas fa-chart-line text-6xl mb-4 text-gray-300"></i>
                    <p className="text-lg">Générez un planning pour voir les statistiques</p>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <i className="fas fa-filter mr-2 text-gray-700"></i>
                            Filtres avancés
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Personnes Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <i className="fas fa-users mr-1"></i>
                                    Personnes
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.allPersonnes}
                                            onChange={toggleAllPersonnes}
                                            className="cursor-pointer"
                                        />
                                        <span className="font-semibold">Toutes les personnes</span>
                                    </label>
                                    <hr className="my-2 border-gray-300" />
                                    {uniquePersonnes.map((personne) => (
                                        <label key={personne} className="flex items-center gap-2 mb-2 cursor-pointer">
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

                            {/* Semaines Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <i className="fas fa-calendar-week mr-1"></i>
                                    Semaines
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.allSemaines}
                                            onChange={toggleAllSemaines}
                                            className="cursor-pointer"
                                        />
                                        <span className="font-semibold">Toutes les semaines</span>
                                    </label>
                                    <hr className="my-2 border-gray-300" />
                                    {uniqueSemaines.map((semaine) => (
                                        <label key={semaine} className="flex items-center gap-2 mb-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filters.semaines.has(semaine)}
                                                onChange={() => toggleSemaine(semaine)}
                                                className="cursor-pointer"
                                            />
                                            <span>Semaine {semaine}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Roles Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <i className="fas fa-tasks mr-1"></i>
                                    Rôles
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
                                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.allRoles}
                                            onChange={toggleAllRoles}
                                            className="cursor-pointer"
                                        />
                                        <span className="font-semibold">Tous les rôles</span>
                                    </label>
                                    <hr className="my-2 border-gray-300" />
                                    {uniqueRoles.map((role) => (
                                        <label key={role} className="flex items-center gap-2 mb-2 cursor-pointer">
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
                        </div>
                    </div>

                    {/* Statistics Results */}
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="stat-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total affectations</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {statistics.totalAffectations}
                                        </p>
                                    </div>
                                    <i className="fas fa-tasks text-3xl text-blue-500"></i>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Personnes actives</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {statistics.personnesActives}
                                        </p>
                                    </div>
                                    <i className="fas fa-users text-3xl text-green-500"></i>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Semaines</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {uniqueSemaines.length}
                                        </p>
                                    </div>
                                    <i className="fas fa-calendar-week text-3xl text-purple-500"></i>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Taux d'assignation</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            {statistics.tauxAssignation}%
                                        </p>
                                    </div>
                                    <i className="fas fa-percentage text-3xl text-orange-500"></i>
                                </div>
                            </div>
                        </div>

                        {/* Distribution by Person */}
                        {Object.keys(statistics.repartitionParPersonne).length > 0 && (
                            <div className="bg-white rounded-xl p-6 shadow-lg">
                                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                    <i className="fas fa-user-chart mr-2 text-green-500"></i>
                                    Répartition par personne
                                </h3>
                                <div className="space-y-3">
                                    {Object.entries(statistics.repartitionParPersonne)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([personne, count]) => {
                                            const percentage = Math.round(
                                                (count / statistics.totalAffectations) * 100
                                            );
                                            return (
                                                <div key={personne}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {personne}
                                                        </span>
                                                        <span className="text-sm text-gray-600">
                                                            {count} affectation(s) ({percentage}%)
                                                        </span>
                                                    </div>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Distribution by Role */}
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-tags mr-2 text-purple-500"></i>
                                Répartition par rôle
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(statistics.repartitionParRole)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([role, count]) => {
                                        const percentage = Math.round(
                                            (count / statistics.totalAffectations) * 100
                                        );
                                        return (
                                            <div key={role}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {role}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {count} affectation(s) ({percentage}%)
                                                    </span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Distribution by Week */}
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-calendar-week mr-2 text-blue-500"></i>
                                Répartition par semaine
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(statistics.repartitionParSemaine)
                                    .sort((a, b) => a[1] - b[1])
                                    .map(([semaine, count]) => {
                                        const percentage = Math.round(
                                            (count / statistics.totalAffectations) * 100
                                        );
                                        return (
                                            <div key={semaine} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-gray-800">
                                                        Semaine {semaine}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {percentage}%
                                                    </span>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {count}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    affectation(s)
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Distribution by Day */}
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-calendar-day mr-2 text-orange-500"></i>
                                Répartition par jour
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(statistics.repartitionParJour)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([jour, count]) => {
                                        const percentage = Math.round(
                                            (count / statistics.totalAffectations) * 100
                                        );
                                        return (
                                            <div key={jour} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-gray-800">
                                                        {jour}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {percentage}%
                                                    </span>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">
                                                    {count}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    affectation(s)
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Detailed Statistics by Person */}
                        {Object.keys(statistics.repartitionParPersonne).length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                    <i className="fas fa-user-circle mr-2 text-indigo-500"></i>
                                    Statistiques détaillées par personne
                                </h3>
                                {Object.entries(statistics.repartitionParPersonne)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([personne, count]) => {
                                        const details = filteredPlanning.filter(p => p.personne === personne);
                                        const parRole = {};
                                        const parJour = {};
                                        const parSemaine = {};

                                        details.forEach(item => {
                                            parRole[item.role] = (parRole[item.role] || 0) + 1;
                                            parJour[item.jour] = (parJour[item.jour] || 0) + 1;
                                            parSemaine[item.semaine] = (parSemaine[item.semaine] || 0) + 1;
                                        });

                                        return (
                                            <div key={personne} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-2xl font-bold text-gray-900">{personne}</h4>
                                                    <div className="text-4xl font-bold text-indigo-600">{count}</div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    {/* By Role */}
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                            <i className="fas fa-tasks mr-1"></i>
                                                            Par rôle:
                                                        </div>
                                                        <div className="space-y-1">
                                                            {Object.entries(parRole)
                                                                .sort((a, b) => b[1] - a[1])
                                                                .map(([role, countRole]) => {
                                                                    const percentage = Math.round((countRole / count) * 100);
                                                                    return (
                                                                        <div key={role} className="flex justify-between items-center text-sm">
                                                                            <span className="text-gray-700">{role}</span>
                                                                            <span className="font-bold text-gray-900">
                                                                                {countRole} ({percentage}%)
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>

                                                    {/* By Day */}
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                            <i className="fas fa-calendar-day mr-1"></i>
                                                            Par jour:
                                                        </div>
                                                        <div className="space-y-1">
                                                            {Object.entries(parJour)
                                                                .sort((a, b) => b[1] - a[1])
                                                                .map(([jour, countJour]) => {
                                                                    const percentage = Math.round((countJour / count) * 100);
                                                                    return (
                                                                        <div key={jour} className="flex justify-between items-center text-sm">
                                                                            <span className="text-gray-700">{jour}</span>
                                                                            <span className="font-bold text-gray-900">
                                                                                {countJour} ({percentage}%)
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>

                                                    {/* By Week */}
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                            <i className="fas fa-calendar-week mr-1"></i>
                                                            Par semaine:
                                                        </div>
                                                        <div className="space-y-1">
                                                            {Object.entries(parSemaine)
                                                                .sort((a, b) => a[0] - b[0])
                                                                .map(([semaine, countSemaine]) => (
                                                                    <div key={semaine} className="flex justify-between items-center text-sm">
                                                                        <span className="text-gray-700">Semaine {semaine}</span>
                                                                        <span className="font-bold text-gray-900">{countSemaine}</span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Chronological Details */}
                                                <div className="mt-4 border-t border-gray-200 pt-4">
                                                    <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                        <i className="fas fa-list mr-1"></i>
                                                        Détail des affectations:
                                                    </div>
                                                    <div className="max-h-40 overflow-y-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="sticky top-0 bg-gray-50">
                                                                <tr className="text-left">
                                                                    <th className="py-1 px-2">Semaine</th>
                                                                    <th className="py-1 px-2">Date</th>
                                                                    <th className="py-1 px-2">Jour</th>
                                                                    <th className="py-1 px-2">Rôle</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {details
                                                                    .sort((a, b) => {
                                                                        if (a.semaine !== b.semaine) return a.semaine - b.semaine;
                                                                        return a.date.localeCompare(b.date);
                                                                    })
                                                                    .map((detail, index) => (
                                                                        <tr key={index} className="border-t border-gray-100">
                                                                            <td className="py-1 px-2">{detail.semaine}</td>
                                                                            <td className="py-1 px-2">{detail.date}</td>
                                                                            <td className="py-1 px-2">{detail.jour}</td>
                                                                            <td className="py-1 px-2">{detail.role}</td>
                                                                        </tr>
                                                                    ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
