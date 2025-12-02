/**
 * Komandin'ny Lesona S.S - v3
 * Order Management System
 */

// ===================================
// APPLICATION STATE
// ===================================
const appState = {
    data: {
        categories: [],
        people: []
    },
    selectedPerson: null,
    uiState: {
        mainTableSearch: '',
        selectedOrdersSearch: '',
        orderEntrySearch: ''
    }
};

const orderEntryState = {
    currentPersonId: null,
    tempOrders: {},
    originalOrders: {}
};

// Category colors for visual distinction
const categoryColors = {
    'lb': 'bg-blue-50', 'tzo': 'bg-green-50', 'zt': 'bg-yellow-50',
    'tza': 'bg-purple-50', 'ak': 'bg-pink-50', 'zm': 'bg-orange-50',
    'zb': 'bg-red-50', 'mf': 'bg-indigo-50', 'zk': 'bg-cyan-50',
    'fand_zk': 'bg-lime-50', 'llmf_gm': 'bg-teal-50',
    'llmf_pm': 'bg-emerald-50', 'tt': 'bg-amber-50'
};

// ===================================
// DOM ELEMENTS
// ===================================
const elements = {};

function initializeElements() {
    const ids = [
        'loadingOverlay', 'toast', 'toastMessage', 'toastIcon', 'closeToast',
        'addPersonBtn', 'newOrderBtn', 'saveDataBtn', 'exportDataBtn', 'importDataBtn',
        'exportExcelBtn', 'showSelectedOrdersBtn', 'fileInput',
        'mainTableSearchInput', 'tableHeader', 'tableBody', 'mobileCardView', 'desktopTableContainer',
        'orderCount', 'currentDate', 'currentYear',
        'personModal', 'closePersonModal', 'cancelPersonBtn', 'personForm',
        'personNameInput', 'personIdInput',
        'orderEntryModal', 'orderPersonNameDisplay', 'orderPersonIdDisplay',
        'orderTotalRecap', 'categoriesAccordion', 'orderEntrySearchInput',
        'cancelOrderEntry', 'confirmOrderEntry',
        'selectedOrdersDisplay', 'selectedOrdersContent', 'selectedOrdersSearchInput',
        'closeSelectedOrders', 'printSelectedOrders', 'exportSelectedToPngBtn'
    ];
    
    ids.forEach(id => {
        elements[id] = document.getElementById(id);
    });
}

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    loadData();
    setupEventListeners();
    updateDateDisplay();
});

function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (elements.currentDate) {
        elements.currentDate.textContent = now.toLocaleDateString('fr-FR', options);
    }
    if (elements.currentYear) {
        elements.currentYear.textContent = now.getFullYear();
    }
}

// ===================================
// DATA MANAGEMENT
// ===================================
function loadData() {
    showLoading();
    setTimeout(() => {
        const savedData = localStorage.getItem('orderManagementData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                if (parsedData && typeof parsedData === 'object' && 
                    Array.isArray(parsedData.categories) && Array.isArray(parsedData.people)) {
                    appState.data = parsedData;
                    showToast('Données chargées avec succès', 'success');
                } else {
                    initializeSampleData();
                    showToast('Données invalides. Données d\'exemple utilisées.', 'warning');
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                initializeSampleData();
                showToast('Erreur de chargement. Données d\'exemple utilisées', 'error');
            }
        } else {
            initializeSampleData();
            showToast('Initialisé avec des données d\'exemple', 'info');
        }
        renderTable();
        hideLoading();
    }, 300);
}

function saveData() {
    showLoading();
    try {
        localStorage.setItem('orderManagementData', JSON.stringify(appState.data));
        showToast('Données enregistrées avec succès', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        showToast('Erreur d\'enregistrement des données', 'error');
    }
    hideLoading();
}

function exportData() {
    showLoading();
    try {
        const dataStr = JSON.stringify(appState.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileName = `order_data_${new Date().toISOString().slice(0, 10)}.json`;
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', exportFileName);
        link.click();
        showToast('Données exportées avec succès', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'exportation:', error);
        showToast('Erreur lors de l\'exportation', 'error');
    }
    hideLoading();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showLoading();
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData && Array.isArray(importedData.categories) && Array.isArray(importedData.people)) {
                appState.data = importedData;
                saveData();
                renderTable();
                showToast('Données importées avec succès', 'success');
            } else {
                showToast('Format de fichier invalide', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de l\'importation:', error);
            showToast('Erreur lors de l\'importation du fichier', 'error');
        }
        hideLoading();
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ===================================
// SAMPLE DATA
// ===================================
function initializeSampleData() {
    appState.data = {
        categories: [
            {
                id: 'lb', name: 'Lehibe', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: 'GM', price: 3300 },
                        { id: 'pm', name: 'PM', price: 2700 },
                        { id: 'tra', name: 'TRA', price: 2700 }
                    ]},
                    { id: 'fr', name: 'Français', formats: [
                        { id: 'lsn', name: 'LESONA', price: 6000 }
                    ]},
                    { id: 'en', name: 'Anglais', formats: [
                        { id: 'std', name: 'STANDARD', price: 6000 }
                    ]}
                ]
            },
            {
                id: 'tzo', name: 'Tanora Zokiny (19-35taona)', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: '', price: 3300 },
                        { id: 'tr', name: 'TRA', price: 2700 }
                    ]},
                    { id: 'fr', name: 'Français', formats: [
                        { id: 'lsn', name: 'LSN', price: 6000 }
                    ]},
                    { id: 'en', name: 'Anglais', formats: [
                        { id: 'inv', name: 'INVERSE', price: 6000 }
                    ]}
                ]
            },
            {
                id: 'zt', name: 'Zatovo (13-18taona)', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: '', price: 3300 },
                        { id: 'pm', name: '', price: 2700 }
                    ]},
                    { id: 'fr', name: 'Français', formats: [
                        { id: 'ado', name: 'ADO', price: 6000 }
                    ]},
                    { id: 'en', name: 'Anglais', formats: [
                        { id: 'crn', name: 'CRN', price: 6000 },
                        { id: 'rtf', name: 'RTF', price: 6000 }
                    ]}
                ]
            },
            {
                id: 'tza', name: 'Tanora Zandriny (9-12taona)', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: '', price: 3300 },
                        { id: 'tr', name: 'TRA', price: 2700 }
                    ]},
                    { id: 'fr', name: 'Français', formats: [
                        { id: 'prad', name: 'PRE-ADO', price: 6000 }
                    ]},
                    { id: 'en', name: 'Anglais', formats: [
                        { id: 'foc', name: 'FOCUSPOINT', price: 6000 }
                    ]}
                ]
            },
            {
                id: 'ak', name: 'Ankizy Kely (5-8taona)', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: '', price: 3300 },
                        { id: 'sti', name: 'STIMULANT', price: 3700 },
                        { id: 'tr', name: 'TRA', price: 2700 }
                    ]},
                    { id: 'fr', name: 'Français', formats: [
                        { id: 'pr', name: 'PRIMAIRE', price: 6000 }
                    ]}
                ]
            },
            {
                id: 'zb', name: 'Zaza Bodo (4taona)', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: '', price: 3300 },
                        { id: 'sti', name: 'STIMULANT', price: 3700 }
                    ]},
                    { id: 'fr', name: 'Français', formats: [
                        { id: 'jdf', name: 'JARDIN', price: 6000 }
                    ]},
                    { id: 'en', name: 'Anglais', formats: [
                        { id: 'kgt', name: 'KGT', price: 6000 }
                    ]}
                ]
            },
            {
                id: 'zk', name: 'Zazakely (1-3taona)', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: '', price: 3300 },
                        { id: 'sti', name: 'STIMULANT', price: 3700 }
                    ]},
                    { id: 'fr', name: 'Français', formats: [
                        { id: 'deb', name: 'DEBUTANT', price: 6000 }
                    ]},
                    { id: 'en', name: 'Anglais', formats: [
                        { id: 'bgn', name: 'BEGINNER', price: 6000 }
                    ]}
                ]
            },
            {
                id: 'zm', name: 'Zaza Minono (0-12volana)', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: '', price: 3300 },
                        { id: 'sti', name: 'STIMULANT', price: 3700 }
                    ]},
                    { id: 'fr', name: 'Français', formats: [
                        { id: 'bbs', name: 'BEBES', price: 6000 }
                    ]},
                    { id: 'en', name: 'Anglais', formats: [
                        { id: 'bbs', name: 'BABIES', price: 6000 }
                    ]}
                ]
            },
            {
                id: 'mf', name: 'Mofon\'aina', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: 'GM', price: 3300 },
                        { id: 'pm', name: 'PM', price: 2700 }
                    ]}
                ]
            },
            {
                id: 'llmf', name: 'Lehibe/Mofonaina (PACK)', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'gm', name: 'GM', price: 6500 },
                        { id: 'pm', name: 'PM', price: 5300 }
                    ]}
                ]
            },
            {
                id: 'md', name: 'Manao Dingana', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: '1', name: '1', price: 3300 },
                        { id: '2', name: '2', price: 3300 }
                    ]}
                ]
            },
            {
                id: 'acc', name: 'Accessoires', languages: [
                    { id: 'gs', name: 'Malagasy', formats: [
                        { id: 'sari', name: 'SARINTANY', price: 1900 },
                        { id: 'reji', name: 'REJISTRA', price: 1700 }
                    ]}
                ]
            }
        ],
        people: []
    };

    // Ensure all formats have IDs
    appState.data.categories.forEach(cat => {
        cat.languages.forEach(lang => {
            lang.formats.forEach(format => {
                if (!format.id) format.id = 'std';
                if (!format.name) format.name = 'Std';
            });
        });
    });
}

// ===================================
// UI HELPERS
// ===================================
function showLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    if (!elements.toast || !elements.toastMessage) return;

    elements.toastMessage.textContent = message;
    elements.toast.className = 'toast';

    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    if (elements.toastIcon) {
        elements.toastIcon.className = `fas ${iconMap[type] || iconMap.success} text-xl`;
    }

    if (type !== 'success') {
        elements.toast.classList.add(`toast-${type}`);
    }

    elements.toast.classList.remove('hidden');

    setTimeout(() => {
        hideToast();
    }, 4000);
}

function hideToast() {
    if (elements.toast) {
        elements.toast.classList.add('hidden');
    }
}

function showModal(modal) {
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-MG').format(amount) + ' Ar';
}

// ===================================
// EVENT LISTENERS
// ===================================
function setupEventListeners() {
    // Main action buttons
    elements.addPersonBtn?.addEventListener('click', () => showModal(elements.personModal));
    elements.newOrderBtn?.addEventListener('click', openOrderEntry);
    elements.saveDataBtn?.addEventListener('click', saveData);
    elements.exportDataBtn?.addEventListener('click', exportData);
    elements.importDataBtn?.addEventListener('click', () => elements.fileInput?.click());
    elements.exportExcelBtn?.addEventListener('click', exportToExcel);
    elements.showSelectedOrdersBtn?.addEventListener('click', () => displaySelectedOrders(true));

    // File input
    elements.fileInput?.addEventListener('change', handleFileImport);

    // Toast
    elements.closeToast?.addEventListener('click', hideToast);

    // Person modal
    elements.closePersonModal?.addEventListener('click', () => hideModal(elements.personModal));
    elements.cancelPersonBtn?.addEventListener('click', () => hideModal(elements.personModal));
    elements.personForm?.addEventListener('submit', handlePersonSubmit);

    // Order entry modal
    elements.cancelOrderEntry?.addEventListener('click', () => hideModal(elements.orderEntryModal));
    elements.confirmOrderEntry?.addEventListener('click', confirmOrderEntry);

    // Selected orders modal
    elements.closeSelectedOrders?.addEventListener('click', () => hideModal(elements.selectedOrdersDisplay));
    elements.printSelectedOrders?.addEventListener('click', () => window.print());
    elements.exportSelectedToPngBtn?.addEventListener('click', exportSelectedOrdersToPng);

    // Search inputs
    elements.mainTableSearchInput?.addEventListener('input', (e) => {
        appState.uiState.mainTableSearch = e.target.value.toLowerCase();
        renderTableBody();
        renderMobileCards();
    });

    elements.orderEntrySearchInput?.addEventListener('input', (e) => {
        appState.uiState.orderEntrySearch = e.target.value.toLowerCase();
        filterOrderEntryItems();
    });

    elements.selectedOrdersSearchInput?.addEventListener('input', (e) => {
        appState.uiState.selectedOrdersSearch = e.target.value.toLowerCase();
        displaySelectedOrders(false);
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.modal');
            if (modal) hideModal(modal);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                hideModal(modal);
            });
        }
    });
}

// ===================================
// PERSON MANAGEMENT
// ===================================
function handlePersonSubmit(e) {
    e.preventDefault();

    const name = elements.personNameInput?.value.trim();
    const id = elements.personIdInput?.value.trim() || `P${Date.now()}`;

    if (!name) {
        showToast('Veuillez entrer un nom', 'error');
        return;
    }

    // Check for duplicate
    if (appState.data.people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showToast('Cette personne existe déjà', 'warning');
        return;
    }

    const newPerson = {
        id,
        name,
        orders: {},
        selected: false
    };

    appState.data.people.push(newPerson);
    saveData();
    renderTable();
    hideModal(elements.personModal);
    elements.personForm?.reset();
    showToast(`${name} ajouté avec succès`, 'success');

    // Open order entry modal immediately for the new person
    setTimeout(() => {
        openOrderEntryForPerson(id);
    }, 300);
}

function deletePerson(personId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette personne?')) return;

    const index = appState.data.people.findIndex(p => p.id === personId);
    if (index !== -1) {
        const name = appState.data.people[index].name;
        appState.data.people.splice(index, 1);
        saveData();
        renderTable();
        showToast(`${name} supprimé`, 'success');
    }
}

function togglePersonSelection(personId) {
    const person = appState.data.people.find(p => p.id === personId);
    if (person) {
        person.selected = !person.selected;
        renderTable();
    }
}

// ===================================
// TABLE RENDERING
// ===================================
function renderTable() {
    renderTableHeader();
    renderTableBody();
    renderMobileCards();
    updateOrderCount();
}

function updateOrderCount() {
    const count = appState.data.people.length;
    if (elements.orderCount) {
        elements.orderCount.textContent = `(${count} personne${count !== 1 ? 's' : ''})`;
    }
}

function getColumnHeaders() {
    const headers = [];
    appState.data.categories.forEach(category => {
        category.languages.forEach(language => {
            language.formats.forEach(format => {
                const formatId = format.id || 'std';
                headers.push({
                    categoryId: category.id,
                    categoryName: category.name,
                    languageId: language.id,
                    languageName: language.name,
                    formatId: formatId,
                    formatName: format.name,
                    price: format.price,
                    key: `${category.id}|${language.id}|${formatId}`
                });
            });
        });
    });
    return headers;
}

function renderTableHeader() {
    if (!elements.tableHeader) return;

    const headers = getColumnHeaders();

    // Group headers by category (each item will now have 3 columns: qty, unit price, total)
    const categoryGroups = {};
    headers.forEach(h => {
        if (!categoryGroups[h.categoryId]) {
            categoryGroups[h.categoryId] = {
                name: h.categoryName,
                count: 0
            };
        }
        categoryGroups[h.categoryId].count += 3; // 3 columns per item now
    });

    // Row 1: Category names
    let html = '<tr class="bg-gray-100">';
    html += '<th rowspan="2" class="sticky left-0 bg-gray-100 z-20 min-w-[150px]">Nom</th>';
    html += '<th rowspan="2" class="min-w-[40px]">✓</th>';

    Object.entries(categoryGroups).forEach(([id, cat]) => {
        html += `<th colspan="${cat.count}" class="category-header ${categoryColors[id] || 'bg-gray-50'}">${cat.name}</th>`;
    });
    html += '<th rowspan="2" class="min-w-[100px]">Total</th>';
    html += '<th rowspan="2" class="min-w-[80px]">Actions</th>';
    html += '</tr>';

    // Row 2: Sub-headers (Qty, Unit Price, Total)
    html += '<tr class="bg-gray-50">';
    headers.forEach(h => {
        const label = h.formatName || h.languageName;
        html += `<th class="text-xs font-medium qty-header ${categoryColors[h.categoryId] || 'bg-gray-50'}" title="${h.categoryName} - ${h.languageName} - Qté">Qté</th>`;
        html += `<th class="text-xs font-medium price-header ${categoryColors[h.categoryId] || 'bg-gray-50'}" title="${h.categoryName} - ${h.languageName} - Prix">Prix</th>`;
        html += `<th class="text-xs font-medium total-header ${categoryColors[h.categoryId] || 'bg-gray-50'}" title="${h.categoryName} - ${h.languageName} - Total">Total</th>`;
    });
    html += '</tr>';

    elements.tableHeader.innerHTML = html;
}

function renderTableBody() {
    if (!elements.tableBody) return;

    const headers = getColumnHeaders();
    const searchTerm = appState.uiState.mainTableSearch;

    const filteredPeople = appState.data.people.filter(person =>
        person.name.toLowerCase().includes(searchTerm)
    );

    if (filteredPeople.length === 0) {
        elements.tableBody.innerHTML = `
            <tr>
                <td colspan="${(headers.length * 3) + 4}" class="py-12">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>${searchTerm ? 'Aucun résultat' : 'Aucune personne'}</h3>
                        <p>${searchTerm ? 'Essayez une autre recherche' : 'Cliquez sur "Ajouter Personne" pour commencer'}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    filteredPeople.forEach(person => {
        html += renderPersonRow(person, headers);
    });

    // Add totals row
    html += renderTotalsRow(headers);

    elements.tableBody.innerHTML = html;

    // Add event listeners for inputs
    elements.tableBody.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', handleQuantityChange);
        input.addEventListener('focus', (e) => e.target.select());
    });
}

function renderPersonRow(person, headers) {
    let total = 0;

    let html = `<tr data-person-id="${person.id}" class="person-row">`;
    html += `<td class="person-name-cell sticky left-0 bg-white z-10">${escapeHtml(person.name)}</td>`;
    html += `<td>
        <input type="checkbox" ${person.selected ? 'checked' : ''}
            onchange="togglePersonSelection('${person.id}')"
            class="cursor-pointer">
    </td>`;

    // For each item, create 3 columns: quantity, unit price, item total
    headers.forEach(h => {
        const qty = person.orders?.[h.key] || 0;
        const itemTotal = qty * h.price;
        total += itemTotal;

        // Quantity input
        html += `<td class="numeric-cell qty-cell">
            <input type="number" min="0" value="${qty}"
                data-person-id="${person.id}"
                data-key="${h.key}"
                data-price="${h.price}"
                class="quantity-input">
        </td>`;

        // Unit price (static display)
        html += `<td class="numeric-cell price-cell">${formatCurrency(h.price)}</td>`;

        // Item total (qty * price)
        html += `<td class="numeric-cell total-cell-display">${itemTotal > 0 ? formatCurrency(itemTotal) : ''}</td>`;
    });

    // Total
    html += `<td class="total-cell numeric-cell font-bold">${formatCurrency(total)}</td>`;

    // Actions
    html += `<td>
        <div class="flex justify-center gap-1">
            <button onclick="openOrderEntryForPerson('${person.id}')"
                class="btn btn-sm btn-primary" title="Modifier">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deletePerson('${person.id}')"
                class="btn btn-sm btn-danger" title="Supprimer">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </td>`;
    html += '</tr>';

    return html;
}

function renderTotalsRow(headers) {
    let grandTotal = 0;
    const columnTotals = {};

    headers.forEach(h => {
        columnTotals[h.key] = 0;
    });

    appState.data.people.forEach(person => {
        headers.forEach(h => {
            const qty = person.orders?.[h.key] || 0;
            columnTotals[h.key] += qty;
            grandTotal += qty * h.price;
        });
    });

    let html = '<tr class="bg-gray-100 font-bold">';
    html += '<td class="person-name-cell sticky left-0 bg-gray-100">TOTAL</td>';
    html += '<td></td>';

    headers.forEach(h => {
        const total = columnTotals[h.key];
        // Quantity total
        html += `<td class="numeric-cell qty-cell">${total > 0 ? total : ''}</td>`;
        // Unit price (static)
        html += `<td class="numeric-cell price-cell">${formatCurrency(h.price)}</td>`;
        // Item total (qty * price)
        html += `<td class="numeric-cell total-cell-display">${total > 0 ? formatCurrency(total * h.price) : ''}</td>`;
    });

    html += `<td class="total-cell numeric-cell">${formatCurrency(grandTotal)}</td>`;
    html += '<td></td>';
    html += '</tr>';

    return html;
}

function handleQuantityChange(e) {
    const input = e.target;
    const personId = input.dataset.personId;
    const key = input.dataset.key;
    const price = parseFloat(input.dataset.price);
    const value = parseInt(input.value) || 0;

    const person = appState.data.people.find(p => p.id === personId);
    if (person) {
        if (!person.orders) person.orders = {};
        person.orders[key] = value;

        // Update the item total in the corresponding cell (next cell after quantity)
        const inputCell = input.closest('td');
        const cells = Array.from(inputCell.parentElement.cells);
        const inputCellIndex = cells.indexOf(inputCell);

        // The item total is in the cell after the unit price (so +2 from qty cell)
        const itemTotalCell = cells[inputCellIndex + 2];
        if (itemTotalCell) {
            const itemTotal = value * price;
            itemTotalCell.textContent = itemTotal > 0 ? formatCurrency(itemTotal) : '';
        }

        // Update total for this row
        updateRowTotal(personId);

        // Update column totals
        renderTableBody();
    }
}

function updateRowTotal(personId) {
    const person = appState.data.people.find(p => p.id === personId);
    if (!person) return;

    const headers = getColumnHeaders();
    let total = 0;

    headers.forEach(h => {
        const qty = person.orders?.[h.key] || 0;
        total += qty * h.price;
    });

    const row = document.querySelector(`tr[data-person-id="${personId}"]`);
    if (row) {
        const totalCell = row.querySelector('.total-cell');
        if (totalCell) {
            totalCell.textContent = formatCurrency(total);
        }
    }
}

// ===================================
// MOBILE CARD VIEW
// ===================================
function renderMobileCards() {
    if (!elements.mobileCardView) return;

    const searchTerm = appState.uiState.mainTableSearch;
    const filteredPeople = appState.data.people.filter(person =>
        person.name.toLowerCase().includes(searchTerm)
    );

    if (filteredPeople.length === 0) {
        elements.mobileCardView.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>${searchTerm ? 'Aucun résultat' : 'Aucune personne'}</h3>
                <p>${searchTerm ? 'Essayez une autre recherche' : 'Cliquez sur "Ajouter" pour commencer'}</p>
            </div>
        `;
        return;
    }

    let html = '';
    filteredPeople.forEach(person => {
        html += renderPersonCard(person);
    });

    elements.mobileCardView.innerHTML = html;
}

function renderPersonCard(person) {
    const headers = getColumnHeaders();
    let total = 0;
    const ordersByCategory = {};

    headers.forEach(h => {
        const qty = person.orders?.[h.key] || 0;
        if (qty > 0) {
            total += qty * h.price;
            if (!ordersByCategory[h.categoryName]) {
                ordersByCategory[h.categoryName] = [];
            }
            ordersByCategory[h.categoryName].push({
                language: h.languageName,
                format: h.formatName,
                qty,
                price: h.price,
                total: qty * h.price  // Item total
            });
        }
    });

    let html = `
        <div class="person-card" data-person-id="${person.id}">
            <div class="person-card-header">
                <div class="person-card-name">
                    <input type="checkbox" ${person.selected ? 'checked' : ''}
                        onchange="togglePersonSelection('${person.id}')">
                    <span>${escapeHtml(person.name)}</span>
                </div>
                <div class="person-card-total">${formatCurrency(total)}</div>
            </div>
    `;

    if (Object.keys(ordersByCategory).length > 0) {
        html += '<div class="person-card-body">';
        Object.entries(ordersByCategory).forEach(([catName, items]) => {
            html += `
                <div class="order-category-section">
                    <div class="category-title">${catName}</div>
            `;
            items.forEach(item => {
                html += `
                    <div class="order-item">
                        <div class="order-item-details">
                            <div class="order-item-language">${item.language}</div>
                            ${item.format ? `<div class="order-item-format">${item.format}</div>` : ''}
                        </div>
                        <div class="order-item-info">
                            <div class="order-item-quantity">Qté: ${item.qty}</div>
                            <div class="order-item-price">Prix: ${formatCurrency(item.price)}</div>
                            <div class="order-item-total">Total: ${formatCurrency(item.total)}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        });
        html += '</div>';
    }

    html += `
            <div class="person-card-actions">
                <button onclick="openOrderEntryForPerson('${person.id}')" class="btn btn-primary btn-sm flex-1">
                    <i class="fas fa-edit"></i> Modifier
                </button>
                <button onclick="deletePerson('${person.id}')" class="btn btn-danger btn-sm">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    return html;
}

// ===================================
// ORDER ENTRY MODAL
// ===================================
function openOrderEntry() {
    // If no people exist, prompt to add one first
    if (appState.data.people.length === 0) {
        showToast('Ajoutez d\'abord une personne', 'warning');
        showModal(elements.personModal);
        return;
    }

    // Open for the first person or show a selection
    openOrderEntryForPerson(appState.data.people[0].id);
}

function openOrderEntryForPerson(personId) {
    const person = appState.data.people.find(p => p.id === personId);
    if (!person) return;

    orderEntryState.currentPersonId = personId;
    orderEntryState.tempOrders = { ...(person.orders || {}) };
    orderEntryState.originalOrders = { ...(person.orders || {}) };

    if (elements.orderPersonNameDisplay) {
        elements.orderPersonNameDisplay.innerHTML = `
            <i class="fas fa-shopping-cart text-green-600"></i>
            Commande pour: ${escapeHtml(person.name)}
        `;
    }
    if (elements.orderPersonIdDisplay) {
        elements.orderPersonIdDisplay.textContent = person.id;
    }

    renderCategoriesAccordion();
    updateOrderTotal();
    showModal(elements.orderEntryModal);

    // Reset search
    if (elements.orderEntrySearchInput) {
        elements.orderEntrySearchInput.value = '';
        appState.uiState.orderEntrySearch = '';
    }
}

function renderCategoriesAccordion() {
    if (!elements.categoriesAccordion) return;

    let html = '';
    appState.data.categories.forEach((category, index) => {
        const colorClass = categoryColors[category.id] || 'bg-gray-50';

        html += `
            <div class="accordion-item" data-category-id="${category.id}">
                <div class="accordion-header ${index === 0 ? 'active' : ''}" onclick="toggleAccordion(this)">
                    <div class="accordion-title">
                        <div class="accordion-icon ${colorClass.replace('bg-', 'bg-').replace('-50', '-500')}">
                            <i class="fas fa-book"></i>
                        </div>
                        <span>${category.name}</span>
                        <div class="category-summary-badge" data-category-id="${category.id}"></div>
                    </div>
                    <i class="fas fa-chevron-down accordion-chevron"></i>
                </div>
                <div class="accordion-content ${index === 0 ? 'open' : ''}">
                    <div class="accordion-body">
                        ${renderCategoryLanguages(category)}
                    </div>
                </div>
            </div>
        `;
    });

    elements.categoriesAccordion.innerHTML = html;

    // Add event listeners for quantity controls
    setupQuantityControls();

    // Update category summaries
    updateAllCategorySummaries();
}

function renderCategoryLanguages(category) {
    let html = '';

    category.languages.forEach(language => {
        html += `
            <div class="language-section" data-language-id="${language.id}">
                <div class="language-title">
                    <i class="fas fa-globe"></i>
                    ${language.name}
                </div>
        `;

        language.formats.forEach(format => {
            const formatId = format.id || 'std';
            const key = `${category.id}|${language.id}|${formatId}`;
            const qty = orderEntryState.tempOrders[key] || 0;
            const formatDisplay = format.name || language.name;

            html += `
                <div class="format-row" data-key="${key}" data-category-id="${category.id}">
                    <div class="format-info">
                        <div class="format-name">${formatDisplay}</div>
                        <div class="format-price">${formatCurrency(format.price)}</div>
                    </div>
                    <div class="quantity-control">
                        <button type="button" class="quantity-btn minus-btn" data-key="${key}" data-price="${format.price}">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" min="0" value="${qty}"
                            class="quantity-value"
                            data-key="${key}"
                            data-price="${format.price}">
                        <button type="button" class="quantity-btn plus-btn" data-key="${key}" data-price="${format.price}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    });

    return html;
}

function setupQuantityControls() {
    // Minus buttons
    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const key = this.dataset.key;
            const price = parseFloat(this.dataset.price);
            const input = document.querySelector(`.quantity-value[data-key="${key}"]`);
            if (!input) return;

            let value = parseInt(input.value) || 0;
            if (value > 0) {
                value--;
                input.value = value;
                orderEntryState.tempOrders[key] = value;
                updateOrderTotal();
                updateAllCategorySummaries();
            }
        });
    });

    // Plus buttons
    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const key = this.dataset.key;
            const price = parseFloat(this.dataset.price);
            const input = document.querySelector(`.quantity-value[data-key="${key}"]`);
            if (!input) return;

            let value = parseInt(input.value) || 0;
            value++;
            input.value = value;
            orderEntryState.tempOrders[key] = value;
            updateOrderTotal();
            updateAllCategorySummaries();
        });
    });

    // Input change
    document.querySelectorAll('.quantity-value').forEach(input => {
        input.addEventListener('change', function() {
            const key = this.dataset.key;
            let value = parseInt(this.value) || 0;
            if (value < 0) value = 0;
            this.value = value;
            orderEntryState.tempOrders[key] = value;
            updateOrderTotal();
            updateAllCategorySummaries();
        });

        input.addEventListener('focus', function() {
            this.select();
        });
    });
}

function updateAllCategorySummaries() {
    appState.data.categories.forEach(category => {
        const summaryBadge = document.querySelector(`.category-summary-badge[data-category-id="${category.id}"]`);
        if (!summaryBadge) return;

        const summaryParts = [];
        let totalItemsInCategory = 0;

        category.languages.forEach(language => {
            language.formats.forEach(format => {
                const formatId = format.id || 'std';
                const key = `${category.id}|${language.id}|${formatId}`;
                const quantity = orderEntryState.tempOrders[key] || 0;
                if (quantity > 0) {
                    totalItemsInCategory += quantity;
                    const formatName = format.name ? ` ${format.name}` : '';
                    summaryParts.push(`${language.name}${formatName}: ${quantity}`);
                }
            });
        });

        if (summaryParts.length > 0) {
            summaryBadge.innerHTML = `<span class="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full ml-2">${summaryParts.join(', ')} (${totalItemsInCategory})</span>`;
        } else {
            summaryBadge.innerHTML = '';
        }
    });
}

function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const isOpen = content.classList.contains('open');

    // Close all
    document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('open'));
    document.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('active'));

    // Open clicked if it was closed
    if (!isOpen) {
        content.classList.add('open');
        header.classList.add('active');
    }
}

function updateOrderTotal() {
    const headers = getColumnHeaders();
    let total = 0;

    headers.forEach(h => {
        const qty = orderEntryState.tempOrders[h.key] || 0;
        total += qty * h.price;
    });

    if (elements.orderTotalRecap) {
        elements.orderTotalRecap.textContent = formatCurrency(total);
    }
}

function filterOrderEntryItems() {
    const searchTerm = appState.uiState.orderEntrySearch;

    document.querySelectorAll('.accordion-item').forEach(item => {
        const categoryName = item.querySelector('.accordion-title span')?.textContent.toLowerCase() || '';
        let hasMatch = categoryName.includes(searchTerm);

        item.querySelectorAll('.language-section').forEach(langSection => {
            const langName = langSection.querySelector('.language-title')?.textContent.toLowerCase() || '';
            const langMatch = langName.includes(searchTerm);

            langSection.querySelectorAll('.format-row').forEach(formatRow => {
                const formatName = formatRow.querySelector('.format-name')?.textContent.toLowerCase() || '';
                const formatMatch = formatName.includes(searchTerm);

                if (searchTerm && !langMatch && !formatMatch && !hasMatch) {
                    formatRow.style.display = 'none';
                } else {
                    formatRow.style.display = '';
                    hasMatch = true;
                }
            });

            if (searchTerm && !langMatch && !hasMatch) {
                langSection.style.display = 'none';
            } else {
                langSection.style.display = '';
            }
        });

        if (searchTerm && !hasMatch) {
            item.style.display = 'none';
        } else {
            item.style.display = '';
        }
    });
}

function confirmOrderEntry() {
    const person = appState.data.people.find(p => p.id === orderEntryState.currentPersonId);
    if (!person) return;

    person.orders = { ...orderEntryState.tempOrders };
    saveData();
    renderTable();
    hideModal(elements.orderEntryModal);
    showToast('Commande enregistrée', 'success');
}

// ===================================
// SELECTED ORDERS DISPLAY
// ===================================
function displaySelectedOrders(resetSearch = true) {
    const selectedPeople = appState.data.people.filter(p => p.selected);

    if (selectedPeople.length === 0) {
        showToast('Aucune personne sélectionnée', 'warning');
        return;
    }

    if (resetSearch && elements.selectedOrdersSearchInput) {
        elements.selectedOrdersSearchInput.value = '';
        appState.uiState.selectedOrdersSearch = '';
    }

    const searchTerm = appState.uiState.selectedOrdersSearch;
    const headers = getColumnHeaders();

    // Filter by search
    const filteredPeople = selectedPeople.filter(p =>
        p.name.toLowerCase().includes(searchTerm)
    );

    let html = `
        <div class="overflow-x-auto">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="sticky left-0 bg-gray-100">Nom</th>
    `;

    // Get only columns with data
    const activeHeaders = headers.filter(h => {
        return selectedPeople.some(p => (p.orders?.[h.key] || 0) > 0);
    });

    activeHeaders.forEach(h => {
        html += `<th title="${h.categoryName} - ${h.languageName}">${h.categoryName}<br><small>${h.formatName || h.languageName}</small></th>`;
    });

    html += '<th>Total</th></tr></thead><tbody>';

    // Column totals
    const columnTotals = {};
    activeHeaders.forEach(h => columnTotals[h.key] = 0);
    let grandTotal = 0;

    filteredPeople.forEach(person => {
        let personTotal = 0;
        html += `<tr><td class="person-name-cell sticky left-0 bg-white">${escapeHtml(person.name)}</td>`;

        activeHeaders.forEach(h => {
            const qty = person.orders?.[h.key] || 0;
            columnTotals[h.key] += qty;
            personTotal += qty * h.price;
            html += `<td class="numeric-cell">${qty > 0 ? qty : ''}</td>`;
        });

        grandTotal += personTotal;
        html += `<td class="total-cell numeric-cell">${formatCurrency(personTotal)}</td></tr>`;
    });

    // Totals row
    html += '<tr class="bg-gray-100 font-bold"><td class="sticky left-0 bg-gray-100">TOTAL</td>';
    activeHeaders.forEach(h => {
        html += `<td class="numeric-cell">${columnTotals[h.key] > 0 ? columnTotals[h.key] : ''}</td>`;
    });
    html += `<td class="total-cell numeric-cell">${formatCurrency(grandTotal)}</td></tr>`;

    html += '</tbody></table></div>';

    if (elements.selectedOrdersContent) {
        elements.selectedOrdersContent.innerHTML = html;
    }

    showModal(elements.selectedOrdersDisplay);
}

// ===================================
// EXPORT FUNCTIONS
// ===================================
function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        showToast('Bibliothèque Excel non chargée', 'error');
        return;
    }

    showLoading();

    try {
        const headers = getColumnHeaders();
        const wsData = [];

        // Header row
        const headerRow = ['Nom'];
        headers.forEach(h => {
            headerRow.push(`${h.categoryName} - ${h.languageName} ${h.formatName}`);
        });
        headerRow.push('Total');
        wsData.push(headerRow);

        // Data rows
        appState.data.people.forEach(person => {
            const row = [person.name];
            let total = 0;

            headers.forEach(h => {
                const qty = person.orders?.[h.key] || 0;
                row.push(qty > 0 ? qty : '');
                total += qty * h.price;
            });

            row.push(total);
            wsData.push(row);
        });

        // Totals row
        const totalsRow = ['TOTAL'];
        let grandTotal = 0;
        headers.forEach(h => {
            let colTotal = 0;
            appState.data.people.forEach(p => {
                const qty = p.orders?.[h.key] || 0;
                colTotal += qty;
                grandTotal += qty * h.price;
            });
            totalsRow.push(colTotal > 0 ? colTotal : '');
        });
        totalsRow.push(grandTotal);
        wsData.push(totalsRow);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Commandes');

        XLSX.writeFile(wb, `commandes_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast('Excel exporté avec succès', 'success');
    } catch (error) {
        console.error('Erreur export Excel:', error);
        showToast('Erreur lors de l\'export Excel', 'error');
    }

    hideLoading();
}

function exportSelectedOrdersToPng() {
    if (typeof html2canvas === 'undefined') {
        showToast('Bibliothèque html2canvas non chargée', 'error');
        return;
    }

    const content = elements.selectedOrdersContent;
    if (!content) return;

    showLoading();

    html2canvas(content, {
        backgroundColor: '#ffffff',
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `commandes_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Image exportée avec succès', 'success');
        hideLoading();
    }).catch(error => {
        console.error('Erreur export PNG:', error);
        showToast('Erreur lors de l\'export PNG', 'error');
        hideLoading();
    });
}

// ===================================
// UTILITY FUNCTIONS
// ===================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available
window.togglePersonSelection = togglePersonSelection;
window.deletePerson = deletePerson;
window.openOrderEntryForPerson = openOrderEntryForPerson;
window.toggleAccordion = toggleAccordion;

