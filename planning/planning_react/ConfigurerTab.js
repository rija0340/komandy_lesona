// Configurer Tab Component
const { useState, useEffect, useRef } = React;

function ConfigurerTab({
    appState,
    ajouterPersonne,
    supprimerPersonne,
    ajouterDate,
    setDates,
    supprimerDate,
    ajouterRole,
    supprimerRole,
    modifierRole,
    toggleDisponibilite,
    toggleMembreSelection,
    exporterJSON,
    importerJSON,
    reinitialiserDonnees,
    getJoursAvecDates
}) {
    const [nomPersonne, setNomPersonne] = useState('');
    const [selectedDayType, setSelectedDayType] = useState('');
    const [nomNouveauRole, setNomNouveauRole] = useState('');
    const [message, setMessage] = useState('');
    const datePickerRef = useRef(null);
    const flatpickrInstance = useRef(null);

    const JOURS_SEMAINE = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

    // Initialize date picker
    useEffect(() => {
        if (datePickerRef.current && window.flatpickr) {
            if (flatpickrInstance.current) {
                flatpickrInstance.current.destroy();
            }

            flatpickrInstance.current = flatpickr(datePickerRef.current, {
                mode: "multiple",
                dateFormat: "Y-m-d",
                onChange: (selectedDates) => {
                    // Use setDates to avoid duplicates
                    const dateStrings = selectedDates.map(date => date.toISOString().split('T')[0]);
                    setDates(dateStrings);
                }
            });

            // Set selected dates if any
            if (appState.datesSelectionnees.length > 0) {
                const dates = appState.datesSelectionnees.map(d => new Date(d));
                flatpickrInstance.current.setDate(dates);
            }
        }

        return () => {
            if (flatpickrInstance.current) {
                flatpickrInstance.current.destroy();
            }
        };
    }, [appState.datesSelectionnees.length, setDates]); // Re-initialize when number of dates changes

    // Handle add person
    const handleAjouterPersonne = () => {
        if (nomPersonne.trim()) {
            const success = ajouterPersonne(nomPersonne.trim());
            if (success) {
                setNomPersonne('');
                setMessage('Personne ajoutée avec succès !');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Cette personne existe déjà.');
                setTimeout(() => setMessage(''), 3000);
            }
        }
    };

    // Handle add role
    const handleAjouterRole = () => {
        if (selectedDayType && nomNouveauRole.trim()) {
            ajouterRole(parseInt(selectedDayType), nomNouveauRole.trim());
            setNomNouveauRole('');
            setMessage('Rôle ajouté avec succès !');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const joursAvecDates = getJoursAvecDates();
    const typesJourDisponibles = Object.keys(joursAvecDates).map(k => parseInt(k)).sort();

    return (
        <div>
            {message && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Add Person */}
                <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i className="fas fa-user-plus mr-2 text-green-500"></i>
                        Ajouter une personne
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                            <input
                                type="text"
                                value={nomPersonne}
                                onChange={(e) => setNomPersonne(e.target.value)}
                                placeholder="Ex: Miora"
                                className="w-full px-4 py-3 rounded-lg"
                                onKeyPress={(e) => e.key === 'Enter' && handleAjouterPersonne()}
                            />
                        </div>
                        <p className="text-sm text-gray-500">
                            <i className="fas fa-info-circle mr-1"></i>
                            Les disponibilités seront configurées dans la grille ci-dessous
                        </p>
                        <button
                            onClick={handleAjouterPersonne}
                            className="w-full btn-gradient font-semibold py-3 rounded-lg"
                        >
                            <i className="fas fa-user-check mr-2"></i>
                            Ajouter personne
                        </button>
                    </div>
                </div>

                {/* People List */}
                <div className="bg-white rounded-xl p-6 shadow-lg card-hover">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <i className="fas fa-users mr-2 text-green-500"></i>
                        Personnes enregistrées
                    </h3>
                    <div className="space-y-2" style={{ minHeight: '50px' }}>
                        {appState.personnes.length === 0 ? (
                            <p className="text-gray-500 text-sm">Aucune personne enregistrée.</p>
                        ) : (
                            appState.personnes.map((personne, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                                >
                                    <span className="font-medium">{personne.nom}</span>
                                    <button
                                        onClick={() => supprimerPersonne(personne.nom)}
                                        className="text-red-500 hover:text-red-700 remove-btn"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Date Selection */}
            <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-calendar-check mr-2 text-indigo-500"></i>
                    Configuration par Dates
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Sélectionnez des dates spécifiques et configurez les rôles et disponibilités
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Sélectionner les dates
                        </label>
                        <input
                            type="text"
                            ref={datePickerRef}
                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300"
                            placeholder="Cliquez pour sélectionner plusieurs dates"
                        />
                        <div className="text-sm text-gray-600 mt-1">
                            {appState.datesSelectionnees.length} date(s) sélectionnée(s)
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Dates sélectionnées ({appState.datesSelectionnees.length})
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 border rounded-lg">
                            {appState.datesSelectionnees.length === 0 ? (
                                <p className="text-gray-500 text-sm">Aucune date sélectionnée.</p>
                            ) : (
                                appState.datesSelectionnees.map((date, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                                    >
                                        {date}
                                        <button
                                            onClick={() => supprimerDate(date)}
                                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                                        >
                                            <i className="fas fa-times text-xs"></i>
                                        </button>
                                    </span>
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Sélectionner les membres pour ce planning
                        </label>
                        <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 border rounded-lg space-y-2">
                            {appState.personnes.length === 0 ? (
                                <p className="text-gray-500 text-sm">Ajoutez des personnes pour les sélectionner ici.</p>
                            ) : (
                                appState.personnes.map((personne, index) => (
                                    <label key={index} className="flex items-center gap-2 p-1 hover:bg-gray-200 rounded">
                                        <input
                                            type="checkbox"
                                            checked={appState.membresSelectionnes.includes(personne.nom)}
                                            onChange={() => toggleMembreSelection(personne.nom)}
                                            className="rounded border-gray-300 text-indigo-600 shadow-sm"
                                        />
                                        <span className="text-sm">{personne.nom}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Management */}
            <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-tags mr-2 text-purple-500"></i>
                    Gestion des Rôles
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Ajoutez, modifiez ou supprimez des rôles pour chaque type de jour présent dans vos dates
                </p>

                {/* Overview */}
                <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-3">Aperçu par type de jour</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {typesJourDisponibles.length === 0 ? (
                            <p className="text-gray-500 text-sm col-span-full">
                                Sélectionnez des dates pour voir les types de jours disponibles.
                            </p>
                        ) : (
                            typesJourDisponibles.map((typeJour) => (
                                <div key={typeJour} className="border rounded-lg p-4 bg-gray-50">
                                    <h5 className="font-bold text-gray-800 mb-2">
                                        {JOURS_SEMAINE[typeJour]} ({joursAvecDates[typeJour].dates.length} date(s))
                                    </h5>
                                    <div className="flex flex-wrap gap-1">
                                        {appState.rolesParTypeJour[typeJour]?.map((role, index) => (
                                            <span 
                                                key={index} 
                                                className="role-badge inline-flex items-center gap-1.5 cursor-pointer hover:bg-gray-200"
                                                onClick={() => {
                                                    const nouveauNom = prompt(`Modifier le rôle "${role}" pour ${JOURS_SEMAINE[typeJour]}:`, role);
                                                    if (nouveauNom && nouveauNom.trim()) {
                                                        modifierRole(role, nouveauNom.trim(), typeJour);
                                                    }
                                                }}
                                            >
                                                {role}
                                                <i className="fas fa-edit text-xs"></i>
                                            </span>
                                        )) || (
                                            <span className="text-gray-500 text-sm">Aucun rôle</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Add Role Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Ajouter un rôle</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Type de jour
                                </label>
                                <select
                                    value={selectedDayType}
                                    onChange={(e) => setSelectedDayType(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300"
                                >
                                    <option value="">-- Sélectionner un type de jour --</option>
                                    {typesJourDisponibles.map((typeJour) => (
                                        <option key={typeJour} value={typeJour}>
                                            {JOURS_SEMAINE[typeJour]} ({joursAvecDates[typeJour].dates.length} date(s))
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Les types de jour disponibles dépendent de vos dates sélectionnées
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nom du rôle
                                </label>
                                <input
                                    type="text"
                                    value={nomNouveauRole}
                                    onChange={(e) => setNomNouveauRole(e.target.value)}
                                    placeholder="Ex: CUISINIER, ORGANISATEUR, etc."
                                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAjouterRole()}
                                />
                            </div>

                            <button
                                onClick={handleAjouterRole}
                                className="w-full btn-gradient font-semibold py-3 rounded-lg"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Ajouter le rôle
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Détails du jour sélectionné</h4>
                        <div className="border rounded-lg p-3 bg-gray-50 max-h-96 overflow-y-auto">
                            {selectedDayType ? (
                                <div>
                                    <h5 className="font-bold mb-2">{JOURS_SEMAINE[parseInt(selectedDayType)]}</h5>
                                    {appState.rolesParTypeJour[selectedDayType]?.map((role, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-center p-2 bg-white rounded mb-2"
                                        >
                                            <span>{role}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const nouveauNom = prompt(`Modifier le rôle "${role}" pour ${JOURS_SEMAINE[parseInt(selectedDayType)]}:`, role);
                                                        if (nouveauNom && nouveauNom.trim()) {
                                                            modifierRole(role, nouveauNom.trim(), parseInt(selectedDayType));
                                                        }
                                                    }}
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => supprimerRole(parseInt(selectedDayType), role)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )) || <p className="text-gray-500 text-sm">Aucun rôle pour ce jour</p>}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">
                                    Sélectionnez un type de jour pour voir ses rôles
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Import/Export */}
            <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-exchange-alt mr-2 text-gray-700"></i>
                    Import / Export de configuration
                </h3>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={exporterJSON}
                        className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                    >
                        <i className="fas fa-file-download mr-2"></i>
                        Exporter JSON
                    </button>
                    <button
                        onClick={importerJSON}
                        className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                    >
                        <i className="fas fa-file-upload mr-2"></i>
                        Importer JSON
                    </button>
                    <button
                        onClick={reinitialiserDonnees}
                        className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                    >
                        <i className="fas fa-trash-alt mr-2"></i>
                        Réinitialiser complètement
                    </button>
                </div>
            </div>

            {/* Availability Grid */}
            <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-table mr-2 text-cyan-500"></i>
                    Grille de Disponibilité
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Cochez les cases pour indiquer la disponibilité de chaque membre pour chaque date sélectionnée
                </p>
                <div className="border rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                    {appState.datesSelectionnees.length === 0 || appState.personnes.length === 0 ? (
                        <p className="text-gray-500 p-4 text-center">
                            Sélectionnez des dates et des membres pour configurer les disponibilités.
                        </p>
                    ) : (
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th className="bg-gray-50 p-3 text-left">Personne</th>
                                    {appState.datesSelectionnees.map((date, index) => (
                                        <th key={index} className="bg-gray-50 p-3 text-left">
                                            {date}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {appState.personnes.map((personne, pIndex) => (
                                    <tr key={pIndex}>
                                        <td className="p-3 font-medium bg-gray-50">{personne.nom}</td>
                                        {appState.datesSelectionnees.map((date, dIndex) => (
                                            <td key={dIndex} className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={appState.disponibilitesParDate[date]?.[personne.nom] || false}
                                                    onChange={() => toggleDisponibilite(date, personne.nom)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Current Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <i className="fas fa-users mr-2 text-green-500"></i>
                        Personnes enregistrées
                    </h4>
                    <div className="space-y-2">
                        {appState.personnes.length === 0 ? (
                            <p className="text-gray-500 text-sm">Aucune personne</p>
                        ) : (
                            appState.personnes.map((personne, index) => (
                                <div key={index} className="p-2 bg-gray-50 rounded">
                                    {personne.nom}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                        Informations
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>
                            <i className="fas fa-calendar-check mr-2"></i>
                            Sélectionnez des dates spécifiques
                        </p>
                        <p>
                            <i className="fas fa-tasks mr-2"></i>
                            Configurez les rôles par type de jour
                        </p>
                        <p>
                            <i className="fas fa-user-check mr-2"></i>
                            Définissez les disponibilités dans la grille
                        </p>
                        <p>
                            <i className="fas fa-magic mr-2"></i>
                            Générez un planning équilibré
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
