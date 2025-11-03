// Application State
class NotesApp {
    constructor() {
        this.currentTab = 'settings';
        this.currentStep = 1;
        this.meetings = JSON.parse(localStorage.getItem('meetings') || '[]');
        this.members = JSON.parse(localStorage.getItem('members') || '{}');
        this.ministries = JSON.parse(localStorage.getItem('ministries') || '[]');
        this.settings = JSON.parse(localStorage.getItem('settings') || '{}');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDefaultSettings();
        this.populateInitialData();
        this.showTab('settings');
        this.animateElements();

        // Initialize Select2 for the filter if it's loaded
        if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#filter-ministry').select2({
                placeholder: "Tous les ministères",
                allowClear: true,
                width: '100%'
            });
        }
    }

    setupEventListeners() {
        // Tab navigation - Desktop
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.id.replace('-tab', '');
                this.showTab(tab);
            });
        });

        // Tab navigation - Mobile dropdown
        const mobileTabSelect = document.getElementById('mobile-tab-select');
        if (mobileTabSelect) {
            mobileTabSelect.addEventListener('change', (e) => {
                this.showTab(e.target.value);
            });
        }

        // Settings functionality
        document.getElementById('add-member').addEventListener('click', () => this.addMember());
        document.getElementById('add-ministry').addEventListener('click', () => this.addMinistry());

        // Step navigation
        document.getElementById('next-step1').addEventListener('click', () => this.nextStep());
        document.getElementById('prev-step2').addEventListener('click', () => this.prevStep());
        document.getElementById('save-meeting').addEventListener('click', () => this.saveMeeting());

        // Topic management
        document.getElementById('add-topic').addEventListener('click', () => this.addTopic());

        // Filters
        document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());

        // Modal
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());

        // Year change for members
        document.getElementById('year-select').addEventListener('change', () => this.loadMembers());

        // Default settings change
        ['default-start-time', 'default-end-time', 'default-location'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.saveSettings());
        });
    }

    searchMeetings(query) {
        const results = [];
        query = query.toLowerCase().trim();
        
        this.meetings.forEach(meeting => {
            const matchingTopics = [];
            let meetingMatchFound = false;
            
            (meeting.topics || []).forEach(topic => {
                let matchFound = false;
                
                if (topic.title && topic.title.toLowerCase().includes(query)) {
                    matchFound = true;
                }
                if (topic.description && topic.description.toLowerCase().includes(query)) {
                    matchFound = true;
                }
                if (topic.decision && topic.decision.toLowerCase().includes(query)) {
                    matchFound = true;
                }
                if (topic.ministries && topic.ministries.some(ministry => 
                    ministry.toLowerCase().includes(query))) {
                    matchFound = true;
                }
                
                if (matchFound) {
                    matchingTopics.push(topic);
                    meetingMatchFound = true;
                }
            });
            
            // Check if meeting location matches
            if (meeting.location && meeting.location.toLowerCase().includes(query)) {
                meetingMatchFound = true;
                // Add all topics to matching topics if meeting location matches
                matchingTopics.push(...meeting.topics || []);
            }
            
            if (meetingMatchFound) {
                results.push({
                    ...meeting,
                    matchingTopics: matchingTopics.length > 0 ? matchingTopics : (meeting.topics || [])
                });
            }
        });
        
        return results;
    }
    
    showSearchResults(results) {
        const container = document.getElementById('meetings-list');
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="glass-effect rounded-xl p-8 text-center">
                    <svg class="w-16 h-16 mx-auto text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <p class="text-secondary text-lg">Aucun résultat trouvé</p>
                    <p class="text-secondary/70 mt-2">Essayez avec d'autres termes de recherche</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        // Sort results by date (newest first)
        results.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        results.forEach(meeting => {
            const meetingDiv = document.createElement('div');
            meetingDiv.className = 'glass-effect rounded-xl p-4 cursor-pointer';
            meetingDiv.onclick = () => this.showMeetingDetails(meeting);
            
            const date = new Date(meeting.date).toLocaleDateString('fr-FR');
            const decisionsCount = (meeting.topics || []).filter(t => t.decision).length;
            
            // Get all unique ministries from matching topics
            const ministries = [...new Set(
                meeting.matchingTopics.flatMap(topic => topic.ministries || [])
            )];
            
            // Create snippet for matching content
            const snippet = this.createSearchSnippet(meeting, query);
            
            meetingDiv.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="heading-font font-medium text-text mb-1">${date} - ${meeting.type === 'regular' ? 'Réunion régulière' : 'Réunion extraordinaire'}</h3>
                        <p class="text-secondary text-sm mb-2">${meeting.location} • ${meeting.startTime} - ${meeting.endTime}</p>
                        <p class="text-sm text-secondary">${snippet}</p>
                    </div>
                    <div class="text-right text-sm text-secondary">
                        <div class="font-medium">${decisionsCount} décisions</div>
                        <div>${meeting.presentMembers?.length || 0} présents</div>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                    ${ministries.map(ministry => `
                        <span class="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">${ministry}</span>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(meetingDiv);
        });
    }
    
    createSearchSnippet(meeting, query) {
        // Find relevant text around the search query
        for (const topic of meeting.matchingTopics || meeting.topics || []) {
            if (topic.title.toLowerCase().includes(query)) {
                return `Sujet: ${this.highlightMatch(topic.title, query)}`;
            }
            if (topic.description.toLowerCase().includes(query)) {
                return `Description: ${this.highlightMatch(topic.description, query)}`;
            }
            if (topic.decision && topic.decision.toLowerCase().includes(query)) {
                return `Décision: ${this.highlightMatch(topic.decision, query)}`;
            }
            if (topic.ministries && topic.ministries.some(ministry => ministry.toLowerCase().includes(query))) {
                const matchingMinistry = topic.ministries.find(ministry => ministry.toLowerCase().includes(query));
                return `Ministère: ${this.highlightMatch(matchingMinistry, query)}`;
            }
        }
        if (meeting.location.toLowerCase().includes(query)) {
            return `Lieu: ${this.highlightMatch(meeting.location, query)}`;
        }
        return 'Contenu trouvé dans cette réunion...';
    }
    
    highlightMatch(text, query) {
        if (!text || !query) return text;
        
        // Escape special regex characters
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        
        return text.replace(regex, '<span class="bg-amber-200 text-amber-800 px-1 rounded">$1</span>');
    }

    loadDefaultSettings() {
        if (this.settings.defaultStartTime) {
            document.getElementById('default-start-time').value = this.settings.defaultStartTime;
        }
        if (this.settings.defaultEndTime) {
            document.getElementById('default-end-time').value = this.settings.defaultEndTime;
        }
        if (this.settings.defaultLocation) {
            document.getElementById('default-location').value = this.settings.defaultLocation;
        }
    }

    saveSettings() {
        this.settings = {
            defaultStartTime: document.getElementById('default-start-time').value,
            defaultEndTime: document.getElementById('default-end-time').value,
            defaultLocation: document.getElementById('default-location').value
        };
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    populateInitialData() {
        // Add some sample ministries if none exist
        if (this.ministries.length === 0) {
            this.ministries = [
                'Finances et Budget',
                'Ressources Humaines',
                'Communication',
                'Projets Spéciaux',
                'Développement Durable'
            ];
            localStorage.setItem('ministries', JSON.stringify(this.ministries));
        }

        // Add sample members for current year if none exist
        const currentYear = new Date().getFullYear().toString();
        if (!this.members[currentYear] || this.members[currentYear].length === 0) {
            this.members[currentYear] = [
                'Marie Dubois', 'Jean Martin', 'Sophie Bernard', 'Pierre Durand',
                'Claire Laurent', 'Thomas Moreau', 'Anne Petit', 'Lucas Simon'
            ];
            localStorage.setItem('members', JSON.stringify(this.members));
        }

        this.loadMinistries();
        this.loadMembers();
    }

    showTab(tabName) {
        // Remember current scroll position to prevent jumping on mobile
        const currentScrollPosition = window.scrollY || window.pageYOffset;
        
        // Update tab buttons (desktop)
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        const tabButton = document.getElementById(`${tabName}-tab`);
        if (tabButton) {
            tabButton.classList.add('active');
        }

        // Update mobile dropdown
        const mobileTabSelect = document.getElementById('mobile-tab-select');
        if (mobileTabSelect) {
            mobileTabSelect.value = tabName;
        }

        // Show/hide sections
        document.querySelectorAll('.tab-content').forEach(section => {
            section.style.display = 'none';
        });
        const tabContent = document.getElementById(`tab-${tabName}`);
        if (tabContent) {
            tabContent.style.display = 'block';
        }

        this.currentTab = tabName;

        // Load content based on tab
        switch(tabName) {
            case 'settings':
                // Settings tab doesn't require special loading
                break;
            case 'meetings':
                this.loadMeetings();
                this.updateStatistics();
                break;
            case 'decisions':
                this.loadDecisionsByMinistry();
                break;
            case 'create':
                this.prepareCreateMeeting();
                break;
        }

        this.animateElements();
        
        // Restore scroll position after content changes to prevent mobile jumping
        if (window.scrollY !== currentScrollPosition) {
            window.scrollTo(0, currentScrollPosition);
        }
    }

    animateElements() {
        // Animate fade-in elements
        anime({
            targets: '.fade-in',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            delay: anime.stagger(100),
            easing: 'easeOutQuart'
        });

        // Animate slide elements
        anime({
            targets: '.slide-in-left',
            opacity: [0, 1],
            translateX: [-30, 0],
            duration: 800,
            delay: 200,
            easing: 'easeOutQuart'
        });

        anime({
            targets: '.slide-in-right',
            opacity: [0, 1],
            translateX: [30, 0],
            duration: 800,
            delay: 300,
            easing: 'easeOutQuart'
        });
    }

    // Members Management
    addMember() {
        const name = document.getElementById('member-name').value.trim();
        const year = document.getElementById('year-select').value;
        
        if (!name) return;

        if (!this.members[year]) {
            this.members[year] = [];
        }
        
        if (!this.members[year].includes(name)) {
            this.members[year].push(name);
            localStorage.setItem('members', JSON.stringify(this.members));
            this.loadMembers();
            document.getElementById('member-name').value = '';
        }
    }

    removeMember(name, year) {
        this.members[year] = this.members[year].filter(member => member !== name);
        localStorage.setItem('members', JSON.stringify(this.members));
        this.loadMembers();
    }

    loadMembers() {
        const year = document.getElementById('year-select').value;
        const container = document.getElementById('members-list');

        container.innerHTML = '';

        if (this.members[year]) {
            this.members[year].forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200';
                memberDiv.innerHTML = `
                    <span class="text-gray-800 text-xs sm:text-sm">${member}</span>
                    <button onclick="app.removeMember('${member}', '${year}')"
                            class="text-rose-500 hover:text-rose-700 p-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                `;
                container.appendChild(memberDiv);
            });
        }
    }

    // Ministries Management
    addMinistry() {
        const name = document.getElementById('ministry-name').value.trim();
        
        if (!name || this.ministries.includes(name)) return;

        this.ministries.push(name);
        localStorage.setItem('ministries', JSON.stringify(this.ministries));
        this.loadMinistries();
        document.getElementById('ministry-name').value = '';
    }

    removeMinistry(name) {
        this.ministries = this.ministries.filter(ministry => ministry !== name);
        localStorage.setItem('ministries', JSON.stringify(this.ministries));
        this.loadMinistries();
    }

    loadMinistries() {
        const container = document.getElementById('ministries-list');
        const filterSelect = document.getElementById('filter-ministry');

        // Clear containers
        container.innerHTML = '';
        filterSelect.innerHTML = '<option value="">Tous les ministères</option>';

        this.ministries.forEach(ministry => {
            // Add to ministries list
            const ministryDiv = document.createElement('div');
            ministryDiv.className = 'flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200';
            ministryDiv.innerHTML = `
                <span class="text-gray-800 text-xs sm:text-sm">${ministry}</span>
                <button onclick="app.removeMinistry('${ministry}')"
                        class="text-rose-500 hover:text-rose-700 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            `;
            container.appendChild(ministryDiv);

            // Add to filter select
            const option = document.createElement('option');
            option.value = ministry;
            option.textContent = ministry;
            filterSelect.appendChild(option);
        });

        // Initialize Select2 for the filter only if Select2 is loaded
        if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#filter-ministry').select2({
                placeholder: "Tous les ministères",
                allowClear: true,
                width: '100%'
            });
        }
    }

    // Meeting Creation
    prepareCreateMeeting() {
        // Set default date to today
        document.getElementById('meeting-date').value = new Date().toISOString().split('T')[0];
        
        // Set default times and location
        if (this.settings.defaultStartTime) {
            document.getElementById('meeting-start-time').value = this.settings.defaultStartTime;
        }
        if (this.settings.defaultEndTime) {
            document.getElementById('meeting-end-time').value = this.settings.defaultEndTime;
        }
        if (this.settings.defaultLocation) {
            document.getElementById('meeting-location').value = this.settings.defaultLocation;
        }
        
        this.loadParticipants();
    }

    loadParticipants() {
        const currentYear = new Date().getFullYear().toString();
        const members = this.members[currentYear] || [];
        
        const presentContainer = document.getElementById('present-members');
        const absentContainer = document.getElementById('absent-members');
        
        presentContainer.innerHTML = '';
        absentContainer.innerHTML = '';
        
        members.forEach(member => {
            // Present members
            const presentDiv = document.createElement('div');
            presentDiv.className = 'flex items-center';
            presentDiv.innerHTML = `
                <input type="checkbox" id="present-${member}" value="${member}" class="mr-3 h-4 w-4 text-primary rounded focus:ring-primary present-checkbox" onchange="app.toggleParticipant('${member}')">
                <label for="present-${member}" class="text-sm">${member}</label>
            `;
            presentContainer.appendChild(presentDiv);
            
            // Absent members
            const absentDiv = document.createElement('div');
            absentDiv.className = 'flex items-center';
            absentDiv.innerHTML = `
                <input type="checkbox" id="absent-${member}" value="${member}" class="mr-3 h-4 w-4 text-primary rounded focus:ring-primary absent-checkbox" onchange="app.toggleParticipant('${member}')">
                <label for="absent-${member}" class="text-sm">${member}</label>
            `;
            absentContainer.appendChild(absentDiv);
        });
    }
    
    toggleParticipant(member) {
        const presentCheckbox = document.getElementById(`present-${member}`);
        const absentCheckbox = document.getElementById(`absent-${member}`);
        
        // If present is checked, uncheck absent
        if (presentCheckbox.checked) {
            absentCheckbox.checked = false;
        }
        // If absent is checked, uncheck present
        else if (absentCheckbox.checked) {
            presentCheckbox.checked = false;
        }
    }

    nextStep() {
        if (this.currentStep === 1) {
            // Validate step 1
            const date = document.getElementById('meeting-date').value;
            const type = document.getElementById('meeting-type').value;
            
            if (!date || !type) {
                alert('Veuillez remplir tous les champs obligatoires.');
                return;
            }
            
            this.currentStep = 2;
            this.updateStepIndicators();
            document.getElementById('step1-content').classList.add('hidden');
            document.getElementById('step2-content').classList.remove('hidden');
        }
    }

    prevStep() {
        if (this.currentStep === 2) {
            this.currentStep = 1;
            this.updateStepIndicators();
            document.getElementById('step2-content').classList.add('hidden');
            document.getElementById('step1-content').classList.remove('hidden');
        }
    }

    updateStepIndicators() {
        const step1Indicator = document.getElementById('step1-indicator');
        const step2Indicator = document.getElementById('step2-indicator');
        
        if (this.currentStep === 1) {
            step1Indicator.querySelector('div').className = 'w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium';
            step1Indicator.querySelector('span').className = 'ml-2 text-primary text-xs';
            step2Indicator.querySelector('div').className = 'w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs font-medium';
            step2Indicator.querySelector('span').className = 'ml-2 text-gray-500 text-xs';
        } else {
            step1Indicator.querySelector('div').className = 'w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium';
            step1Indicator.querySelector('span').className = 'ml-2 text-green-500 text-xs';
            step2Indicator.querySelector('div').className = 'w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium';
            step2Indicator.querySelector('span').className = 'ml-2 text-primary text-xs';
        }
    }

    addTopic() {
        const container = document.getElementById('topics-container');
        const topicIndex = container.children.length;
        
        const topicDiv = document.createElement('div');
        topicDiv.className = 'glass-effect rounded-xl p-4 space-y-4 border border-border';
        topicDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex items-center">
                    <h5 class="heading-font font-semibold text-text mr-3">Sujet #${topicIndex + 1}</h5>
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 rounded-full bg-sage"></div>
                        <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                        <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-rose-500 hover:text-rose-700 touch-target">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div>
                <label class="block text-xs font-medium mb-1 text-secondary">Titre du sujet</label>
                <input type="text" class="topic-title w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="Titre du sujet">
            </div>
            <div>
                <label class="block text-xs font-medium mb-1 text-secondary">Ministères concernés</label>
                <select class="ministry-select w-full px-3 py-2 rounded-lg border border-border text-sm" multiple="multiple">
                    ${this.ministries.map(ministry => `<option value="${ministry}">${ministry}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block text-xs font-medium mb-1 text-secondary">Description</label>
                <textarea class="topic-description w-full px-3 py-2 rounded-lg border border-border text-sm" rows="3" placeholder="Description détaillée du sujet"></textarea>
            </div>
            <div>
                <label class="block text-xs font-medium mb-1 text-secondary">Décision prise (optionnel)</label>
                <textarea class="topic-decision w-full px-3 py-2 rounded-lg border border-border text-sm" rows="2" placeholder="Décision ou conclusion du sujet"></textarea>
            </div>
            <div class="border-t border-border pt-4">
                <h6 class="heading-font font-medium text-text mb-2 flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    Tâches à faire
                </h6>
                <div class="todo-container space-y-2 mb-2">
                    <!-- To-do items will be added here -->
                </div>
                <button onclick="app.addTodoItem(this)" class="btn-primary px-3 py-1 rounded text-sm font-medium flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Ajouter une tâche
                </button>
            </div>
        `;
        
        container.appendChild(topicDiv);
        
        // Initialize Select2 for the newly added topic after a small delay to ensure DOM is ready
        setTimeout(() => {
            if (typeof $ !== 'undefined' && $.fn.select2) {
                $(topicDiv).find('.ministry-select').select2({
                    placeholder: "Sélectionnez les ministères...",
                    allowClear: true,
                    width: '100%'
                });
            }
        }, 100);
    }

    addTodoItem(button) {
        const container = button.previousElementSibling;
        const todoIndex = container.children.length;
        
        const todoDiv = document.createElement('div');
        todoDiv.className = 'flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 p-3 bg-white rounded-lg border border-border';
        todoDiv.innerHTML = `
            <input type="text" class="todo-text flex-1 w-full sm:w-auto px-3 py-2 rounded-lg border border-border text-sm" placeholder="Description de la tâche">
            <input type="date" class="todo-date px-3 py-2 rounded-lg border border-border text-sm">
            <select class="todo-assignee px-3 py-2 rounded-lg border border-border text-sm">
                <option value="">Assigner à</option>
                ${this.getCurrentMembers().map(member => `<option value="${member}">${member}</option>`).join('')}
            </select>
            <button onclick="this.parentElement.remove()" class="text-rose-500 hover:text-rose-700 touch-target">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        `;
        
        container.appendChild(todoDiv);
    }

    getCurrentMembers() {
        const currentYear = new Date().getFullYear().toString();
        return this.members[currentYear] || [];
    }

    saveMeeting() {
        // Collect meeting data
        const meeting = {
            id: Date.now().toString(),
            date: document.getElementById('meeting-date').value,
            type: document.getElementById('meeting-type').value,
            location: document.getElementById('meeting-location').value,
            startTime: document.getElementById('meeting-start-time').value,
            endTime: document.getElementById('meeting-end-time').value,
            presentMembers: Array.from(document.querySelectorAll('#present-members input:checked')).map(cb => cb.value),
            absentMembers: Array.from(document.querySelectorAll('#absent-members input:checked')).map(cb => cb.value),
            topics: this.collectTopicsData(),
            createdAt: new Date().toISOString()
        };

        // Validate required fields
        if (!meeting.date || !meeting.location || meeting.topics.length === 0) {
            alert('Veuillez remplir tous les champs obligatoires et ajouter au moins un sujet.');
            return;
        }

        // Add decision numbers for topics with decisions
        meeting.topics.forEach(topic => {
            if (topic.decision) {
                topic.decisionNumber = this.generateDecisionNumber(meeting.date);
            }
        });

        // Save meeting
        this.meetings.push(meeting);
        localStorage.setItem('meetings', JSON.stringify(this.meetings));

        // Reset form
        this.resetCreateForm();
        
        // Show success message
        alert('Réunion enregistrée avec succès !');
        
        // Switch to meetings tab
        this.showTab('meetings');
    }

    collectTopicsData() {
        const topics = [];
        const topicElements = document.querySelectorAll('#topics-container > div');
        
        topicElements.forEach(element => {
            // Get selected ministries from Select2
            const ministrySelect = element.querySelector('.ministry-select');
            const selectedMinistries = $(ministrySelect).val() || [];
            
            const topic = {
                title: element.querySelector('.topic-title').value,
                ministries: selectedMinistries, // Changed from single ministry to array of ministries
                description: element.querySelector('.topic-description').value,
                decision: element.querySelector('.topic-decision').value,
                todos: []
            };
            
            // Collect todos
            const todoElements = element.querySelectorAll('.todo-container > div');
            todoElements.forEach(todoEl => {
                const todo = {
                    text: todoEl.querySelector('.todo-text').value,
                    dueDate: todoEl.querySelector('.todo-date').value,
                    assignee: todoEl.querySelector('.todo-assignee').value
                };
                if (todo.text) {
                    topic.todos.push(todo);
                }
            });
            
            if (topic.title) {
                topics.push(topic);
            }
        });
        
        return topics;
    }

    generateDecisionNumber(date) {
        const year = date.split('-')[0];
        const month = date.split('-')[1];
        const prefix = `${year}-${month}`;
        
        // Count existing decisions for this month
        const existingDecisions = this.meetings.reduce((count, meeting) => {
            return count + (meeting.topics || []).filter(topic => 
                topic.decisionNumber && topic.decisionNumber.startsWith(prefix)
            ).length;
        }, 0);
        
        const sequence = (existingDecisions + 1).toString().padStart(3, '0');
        return `${prefix}-${sequence}`;
    }

    resetCreateForm() {
        this.currentStep = 1;
        this.updateStepIndicators();
        document.getElementById('step1-content').classList.remove('hidden');
        document.getElementById('step2-content').classList.add('hidden');
        
        // Clear form fields
        document.getElementById('meeting-location').value = '';
        document.getElementById('meeting-start-time').value = '';
        document.getElementById('meeting-end-time').value = '';
        document.getElementById('topics-container').innerHTML = '';
        
        // Clear checkboxes
        document.querySelectorAll('#present-members input, #absent-members input').forEach(cb => {
            cb.checked = false;
        });
    }

    // Meetings List
    loadMeetings(filteredMeetings = null) {
        const meetings = filteredMeetings || this.meetings;
        const container = document.getElementById('meetings-list');
        
        container.innerHTML = '';
        
        if (meetings.length === 0) {
            container.innerHTML = `
                <div class="bg-white rounded-lg sm:rounded-xl p-6 sm:p-8 text-center shadow-lg">
                    <p class="text-gray-600 text-sm sm:text-base">Aucune réunion trouvée.</p>
                </div>
            `;
            return;
        }

        // Sort meetings by date (newest first)
        meetings.sort((a, b) => new Date(b.date) - new Date(a.date));

        meetings.forEach(meeting => {
            const meetingDiv = document.createElement('div');
            meetingDiv.className = 'bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg card-hover cursor-pointer';
            meetingDiv.onclick = () => this.showMeetingDetails(meeting);

            const date = new Date(meeting.date).toLocaleDateString('fr-FR');
            const decisionsCount = (meeting.topics || []).filter(t => t.decision).length;
            // Get all unique ministries from all topics in the meeting
            const ministries = [...new Set(
                (meeting.topics || [])
                    .flatMap(topic => topic.ministries || []) // flatten all ministry arrays from topics
            )];

            meetingDiv.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4 gap-2">
                    <div class="flex-1">
                        <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">${date}</h3>
                        <p class="text-xs sm:text-sm text-gray-600 mb-1">${meeting.type === 'regular' ? 'Réunion régulière' : 'Réunion extraordinaire'}</p>
                        <p class="text-xs sm:text-sm text-gray-600">${meeting.location} • ${meeting.startTime} - ${meeting.endTime}</p>
                    </div>
                    <div class="flex sm:flex-col gap-3 sm:gap-1 text-xs sm:text-sm text-gray-600 sm:text-right">
                        <div><span class="font-semibold">${meeting.presentMembers?.length || 0}</span> présents</div>
                        <div><span class="font-semibold">${decisionsCount}</span> décisions</div>
                    </div>
                </div>
                ${ministries.length > 0 ? `
                    <div class="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                        ${ministries.map(ministry => `
                            <span class="px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded-full text-xs">${ministry}</span>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="text-xs sm:text-sm text-gray-500">
                    ${(meeting.topics || []).length} sujet(s) traité(s)
                </div>
            `;

            container.appendChild(meetingDiv);
        });
    }

    showMeetingDetails(meeting) {
        const modal = document.getElementById('meeting-modal');
        const content = document.getElementById('modal-content');
        
        const date = new Date(meeting.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        content.innerHTML = `
            <div class="space-y-4 sm:space-y-6">
                <div class="border-b pb-3 sm:pb-4">
                    <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-2">${date}</h3>
                    <p class="text-gray-600 text-xs sm:text-sm">${meeting.type === 'regular' ? 'Réunion régulière' : 'Réunion extraordinaire'}</p>
                    <p class="text-gray-600 text-xs sm:text-sm">${meeting.location} • ${meeting.startTime} - ${meeting.endTime}</p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <h4 class="font-semibold mb-2 sm:mb-3 text-gray-800 text-sm sm:text-base">Participants présents</h4>
                        <ul class="space-y-1">
                            ${(meeting.presentMembers || []).map(member => `<li class="text-gray-600 text-xs sm:text-sm">• ${member}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2 sm:mb-3 text-gray-800 text-sm sm:text-base">Participants absents</h4>
                        <ul class="space-y-1">
                            ${(meeting.absentMembers || []).map(member => `<li class="text-gray-600 text-xs sm:text-sm">• ${member}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-3 sm:mb-4 text-gray-800 text-sm sm:text-base">Sujets traités</h4>
                    <div class="space-y-3 sm:space-y-4">
                        ${(meeting.topics || []).map((topic, index) => `
                            <div class="border-l-4 border-gray-900 pl-3 sm:pl-4">
                                <h5 class="font-semibold text-gray-900 mb-2 text-sm sm:text-base">${index + 1}. ${topic.title}</h5>
                                ${(topic.ministries && topic.ministries.length > 0) ? `
                                    <div class="flex flex-wrap gap-1 sm:gap-2 mb-2">
                                        ${topic.ministries.map(ministry => `
                                            <span class="px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded-full text-xs">${ministry}</span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                                <p class="text-gray-600 text-xs sm:text-sm mb-2">${topic.description}</p>
                                ${topic.decision ? `
                                    <div class="bg-gray-100 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3">
                                        <p class="text-xs sm:text-sm font-semibold text-gray-900">Décision ${topic.decisionNumber || ''}:</p>
                                        <p class="text-gray-700 text-xs sm:text-sm mt-1">${topic.decision}</p>
                                    </div>
                                ` : ''}
                                ${topic.todos && topic.todos.length > 0 ? `
                                    <div class="mt-2 sm:mt-3">
                                        <p class="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Tâches à faire:</p>
                                        <ul class="space-y-1">
                                            ${topic.todos.map(todo => `
                                                <li class="text-xs sm:text-sm text-gray-600 flex items-start">
                                                    <input type="checkbox" class="mr-2 mt-0.5 h-3 w-3 sm:h-4 sm:w-4" ${todo.completed ? 'checked' : ''}>
                                                    <span>${todo.text} ${todo.dueDate ? `(échéance: ${new Date(todo.dueDate).toLocaleDateString('fr-FR')})` : ''} ${todo.assignee ? `- ${todo.assignee}` : ''}</span>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('meeting-modal').classList.add('hidden');
    }

    // Filters
    applyFilters() {
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;
        const type = document.getElementById('filter-type').value;
        const selectedMinistries = $('#filter-ministry').val() || []; // Get array of selected ministries
        
        let filteredMeetings = this.meetings.filter(meeting => {
            if (startDate && meeting.date < startDate) return false;
            if (endDate && meeting.date > endDate) return false;
            if (type && meeting.type !== type) return false;
            
            // Check if any of the selected ministries match topics in the meeting
            if (selectedMinistries && selectedMinistries.length > 0) {
                const hasMatchingMinistry = (meeting.topics || []).some(topic => 
                    topic.ministries && 
                    topic.ministries.some(ministry => selectedMinistries.includes(ministry))
                );
                
                if (!hasMatchingMinistry) return false;
            }
            
            return true;
        });
        
        this.loadMeetings(filteredMeetings);
        this.updateStatistics(filteredMeetings);
    }

    clearFilters() {
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        document.getElementById('filter-type').value = '';
        
        // Clear the Select2 component
        if (typeof $ !== 'undefined' && $.fn.select2) {
            $('#filter-ministry').val(null).trigger('change');
        } else {
            document.getElementById('filter-ministry').value = '';
        }
        
        this.loadMeetings();
        this.updateStatistics();
    }

    updateStatistics(meetings = null) {
        const data = meetings || this.meetings;
        
        const totalMeetings = data.length;
        const totalDecisions = data.reduce((count, meeting) => 
            count + (meeting.topics || []).filter(topic => topic.decision).length, 0
        );
        
        const avgParticipation = data.length > 0 ? 
            Math.round(data.reduce((sum, meeting) => 
                sum + (meeting.presentMembers?.length || 0), 0) / data.length * 100 / 
                ((meeting) => this.getCurrentMembers().length)()) : 0;
        
        document.getElementById('total-meetings').textContent = totalMeetings;
        document.getElementById('total-decisions').textContent = totalDecisions;
        document.getElementById('avg-participation').textContent = avgParticipation + '%';
        
        // Update charts
        this.renderMeetingsChart(data);
        this.renderDecisionsChart(data);
    }
    
    renderMeetingsChart(meetings) {
        const chartDom = document.getElementById('meetings-chart');
        if (!chartDom) return;
        
        const chart = echarts.init(chartDom);
        
        // Group meetings by month
        const monthlyData = {};
        meetings.forEach(meeting => {
            const date = new Date(meeting.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey]++;
        });
        
        // Prepare data for chart
        const months = Object.keys(monthlyData).sort();
        const counts = months.map(month => monthlyData[month]);
        
        const option = {
            tooltip: {
                trigger: 'axis',
                formatter: '{b}: {c} réunions'
            },
            xAxis: {
                type: 'category',
                data: months,
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: {
                type: 'value',
                name: 'Nombre de réunions'
            },
            series: [{
                data: counts,
                type: 'bar',
                itemStyle: {
                    color: '#4a6fa5'
                }
            }]
        };
        
        chart.setOption(option);
        
        // Make chart responsive
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }
    
    renderDecisionsChart(meetings) {
        const chartDom = document.getElementById('decisions-chart');
        if (!chartDom) return;
        
        const chart = echarts.init(chartDom);
        
        // Count decisions by ministry
        const ministryDecisions = {};
        
        meetings.forEach(meeting => {
            (meeting.topics || []).forEach(topic => {
                if (topic.decision) {
                    if (topic.ministries && topic.ministries.length > 0) {
                        topic.ministries.forEach(ministry => {
                            if (!ministryDecisions[ministry]) {
                                ministryDecisions[ministry] = 0;
                            }
                            ministryDecisions[ministry]++;
                        });
                    } else {
                        const noMinistryKey = 'Sans ministère';
                        if (!ministryDecisions[noMinistryKey]) {
                            ministryDecisions[noMinistryKey] = 0;
                        }
                        ministryDecisions[noMinistryKey]++;
                    }
                }
            });
        });
        
        // Prepare data for chart (limit to top 10 ministries)
        const sortedMinistries = Object.entries(ministryDecisions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        const ministries = sortedMinistries.map(item => item[0]);
        const counts = sortedMinistries.map(item => item[1]);
        
        const option = {
            tooltip: {
                trigger: 'axis',
                formatter: '{b}: {c} décisions'
            },
            xAxis: {
                type: 'value',
                name: 'Nombre de décisions'
            },
            yAxis: {
                type: 'category',
                data: ministries,
                axisLabel: {
                    rotate: -10
                }
            },
            series: [{
                data: counts,
                type: 'bar',
                itemStyle: {
                    color: '#3b82f6'
                }
            }]
        };
        
        chart.setOption(option);
        
        // Make chart responsive
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    // Decisions by Ministry
    loadDecisionsByMinistry() {
        const container = document.getElementById('decisions-by-ministry');
        container.innerHTML = '';
        
        // Group decisions by ministry - now handle multiple ministries per topic
        const decisionsByMinistry = {};
        
        this.meetings.forEach(meeting => {
            (meeting.topics || []).forEach(topic => {
                if (topic.decision) {
                    // Handle multiple ministries for each topic
                    if (topic.ministries && topic.ministries.length > 0) {
                        topic.ministries.forEach(ministry => {
                            if (!decisionsByMinistry[ministry]) {
                                decisionsByMinistry[ministry] = [];
                            }
                            decisionsByMinistry[ministry].push({
                                ...topic,
                                meetingDate: meeting.date,
                                meetingLocation: meeting.location,
                                meetingType: meeting.type
                            });
                        });
                    } else {
                        // Handle topics without ministries
                        const noMinistryKey = 'Sans ministère';
                        if (!decisionsByMinistry[noMinistryKey]) {
                            decisionsByMinistry[noMinistryKey] = [];
                        }
                        decisionsByMinistry[noMinistryKey].push({
                            ...topic,
                            meetingDate: meeting.date,
                            meetingLocation: meeting.location,
                            meetingType: meeting.type
                        });
                    }
                }
            });
        });
        
        // Sort ministries and decisions
        Object.keys(decisionsByMinistry).sort().forEach(ministry => {
            const decisions = decisionsByMinistry[ministry].sort((a, b) => 
                new Date(b.meetingDate) - new Date(a.meetingDate)
            );
            
            const ministryDiv = document.createElement('div');
            ministryDiv.className = 'glass-effect rounded-xl p-4 sm:p-6 mb-4';
            ministryDiv.innerHTML = `
                <div class="flex items-center mb-4 sm:mb-6">
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <h3 class="heading-font text-lg sm:text-xl font-semibold text-text">${ministry}</h3>
                    <span class="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">${decisions.length}</span>
                </div>
                <div class="relative pl-8 border-l-2 border-border">
                    ${decisions.map((decision, index) => `
                        <div class="relative mb-6 last:mb-0">
                            <div class="absolute -left-10 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <div class="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                            <div class="glass-effect rounded-lg p-4">
                                <div class="flex flex-wrap justify-between items-start mb-2">
                                    <h4 class="heading-font font-medium text-text">${decision.title}</h4>
                                    <span class="text-xs sm:text-sm text-primary font-medium bg-primary/10 px-2 py-1 rounded">${decision.decisionNumber || ''}</span>
                                </div>
                                <p class="text-secondary text-sm sm:text-base mb-3">${decision.decision}</p>
                                <div class="flex flex-wrap text-xs sm:text-sm text-secondary">
                                    <span class="mr-3 mb-1">${new Date(decision.meetingDate).toLocaleDateString('fr-FR')} •</span>
                                    <span class="mr-3 mb-1">${decision.meetingLocation} •</span>
                                    <span>${decision.meetingType === 'regular' ? 'Réunion régulière' : 'Réunion extraordinaire'}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(ministryDiv);
        });
        
        if (Object.keys(decisionsByMinistry).length === 0) {
            container.innerHTML = `
                <div class="glass-effect rounded-xl p-6 sm:p-8 text-center">
                    <svg class="w-16 h-16 mx-auto text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-secondary text-base sm:text-lg">Aucune décision trouvée.</p>
                    <p class="text-secondary/70 text-sm mt-2">Commencez par créer une réunion dans l'onglet 'Créer'.</p>
                </div>
            `;
        }
    }
    
    // Initialize all Select2 elements in the application
    initializeSelect2() {
        // Initialize the ministry filter if not already done
        if (typeof $ !== 'undefined' && $.fn.select2 && $('#filter-ministry').length && !$('#filter-ministry').hasClass('select2-hidden-accessible')) {
            $('#filter-ministry').select2({
                placeholder: "Tous les ministères",
                allowClear: true,
                width: '100%'
            });
        }
        
        // Initialize any existing ministry selects in topic forms
        $('.ministry-select').each(function() {
            if (!$(this).hasClass('select2-hidden-accessible')) {
                $(this).select2({
                    placeholder: "Sélectionnez les ministères...",
                    allowClear: true,
                    width: '100%'
                });
            }
        });
    }
}

// Initialize the application
const app = new NotesApp();

// Global function for tab switching (called from HTML onclick)
function switchTab(tabName) {
    if (app) {
        app.showTab(tabName);
    }
}