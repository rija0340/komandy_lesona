// Application State
class NotesApp {
    constructor() {
        this.currentTab = 'settings';
        this.currentStep = 1;
        this.meetings = [];
        this.members = {};
        this.ministries = [];
        this.settings = {};
        this.currentUser = null;
        this.loadingStates = {
            members: false,
            ministries: false,
            meetings: false,
            savingMeeting: false,
            addingMember: false,
            removingMember: false,
            addingMinistry: false,
            removingMinistry: false
        };
        
        this.init();
    }

    async init() {
        // Check authentication state first
        await this.checkAuthState();
        
        // Load data from Supabase
        await this.loadFromSupabase();
        this.setupEventListeners();
        this.loadDefaultSettings();
        this.populateInitialData();
        
        // Show the settings tab by default after authentication check
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
    
    async checkAuthState() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('app-content').style.display = 'block';
        } else {
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('app-content').style.display = 'none';
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
        
        // Authentication listeners
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('signup-btn').addEventListener('click', () => this.signup());
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    }
    
    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            alert('Login failed: ' + error.message);
        } else {
            this.currentUser = data.user;
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('app-content').style.display = 'block';
            document.getElementById('user-email').textContent = this.currentUser.email;
            await this.loadFromSupabase();
        }
    }
    
    async signup() {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) {
            alert('Signup failed: ' + error.message);
        } else {
            alert('Signup successful! Please check your email to confirm your account.');
        }
    }
    
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Logout failed: ' + error.message);
        } else {
            this.currentUser = null;
            // Clear data to reset application state
            this.meetings = [];
            this.members = {};
            this.ministries = [];
            this.settings = {};
            
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('app-content').style.display = 'none';
        }
    }

    async loadFromSupabase() {
        // Set loading state for meetings
        this.setLoadingState('meetings', true);
        
        try {
            // Load meetings
            const { data: meetingsData, error: meetingsError } = await supabase
                .from('meetings')
                .select(`
                    *,
                    meeting_participants(
                        member_id,
                        attendance_status,
                        members(name)
                    ),
                    topics(
                        *,
                        topic_ministries(
                            ministry_id,
                            ministries(name)
                        ),
                        decisions(*),
                        tasks(*)
                    )
                `)
                .order('date', { ascending: false });
                
            if (meetingsError) {
                console.error('Error loading meetings:', meetingsError);
            } else {
                this.meetings = await this.processMeetingsData(meetingsData);
            }
            
            // Load members
            const { data: membersData, error: membersError } = await supabase
                .from('members')
                .select('*');
                
            if (membersError) {
                console.error('Error loading members:', membersError);
            } else {
                // Group members by year
                const membersByYear = {};
                membersData.forEach(member => {
                    // For now, add to current year, but in a real implementation you'd track by year
                    const year = new Date().getFullYear().toString();
                    if (!membersByYear[year]) {
                        membersByYear[year] = [];
                    }
                    // Store both ID and name for each member
                    membersByYear[year].push({ id: member.id, name: member.name });
                });
                this.members = membersByYear;
            }
            
            // Load ministries
            const { data: ministriesData, error: ministriesError } = await supabase
                .from('ministries')
                .select('name');
                
            if (ministriesError) {
                console.error('Error loading ministries:', ministriesError);
            } else {
                this.ministries = ministriesData.map(m => m.name);
            }
            
            // Load default settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('default_settings')
                .select('key_name, value');
                
            if (settingsError) {
                console.error('Error loading settings:', settingsError);
            } else {
                this.settings = {};
                settingsData.forEach(setting => {
                    this.settings[setting.key_name] = setting.value;
                });
            }
            
            // Update the UI to reflect the loaded data
            this.loadMembers();
            this.loadMinistries();
        } catch (error) {
            console.error('Error loading data from Supabase:', error);
            alert('Error loading data: ' + error.message);
        } finally {
            // Reset loading state
            this.setLoadingState('meetings', false);
        }
    }
    
    async processMeetingsData(meetingsData) {
        const processedMeetings = [];

        for (const meeting of meetingsData) {
            // Process participants (now includes member names from query)
            let presentMembers = [];
            let absentMembers = [];

            if (meeting.meeting_participants) {
                presentMembers = meeting.meeting_participants
                    .filter(p => p.attendance_status === 'present')
                    .map(p => p.members?.name)
                    .filter(Boolean);
                absentMembers = meeting.meeting_participants
                    .filter(p => p.attendance_status === 'absent')
                    .map(p => p.members?.name)
                    .filter(Boolean);
            }

            // Process topics
            const topics = [];
            if (meeting.topics) {
                for (const topic of meeting.topics) {
                    // Get ministries for this topic (now includes ministry names from query)
                    let topicMinistries = [];
                    if (topic.topic_ministries) {
                        topicMinistries = topic.topic_ministries
                            .map(tm => tm.ministries?.name)
                            .filter(Boolean);
                    }

                    // Get decisions for this topic
                    let decision = null;
                    let decisionNumber = null;
                    if (topic.decisions && topic.decisions.length > 0) {
                        const decisionData = topic.decisions[0];
                        decision = decisionData.content;
                        decisionNumber = decisionData.decision_number;
                    }

                    // Get tasks for this topic
                    let todos = [];
                    if (topic.tasks) {
                        todos = topic.tasks.map(task => ({
                            text: task.description,
                            dueDate: task.due_date,
                            assignee: task.assignee_id ? 'Assigned' : '',
                            completed: task.status === 'completed'
                        }));
                    }

                    topics.push({
                        title: topic.title,
                        ministries: topicMinistries,
                        description: topic.description,
                        decision: decision,
                        decisionNumber: decisionNumber,
                        todos: todos
                    });
                }
            }

            processedMeetings.push({
                id: meeting.id,
                date: meeting.date,
                type: meeting.type,
                location: meeting.location,
                startTime: meeting.start_time,
                endTime: meeting.end_time,
                year: meeting.year,
                presentMembers: presentMembers,
                absentMembers: absentMembers,
                topics: topics,
                createdAt: meeting.created_at
            });
        }

        return processedMeetings;
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

    async saveSettings() {
        this.settings = {
            defaultStartTime: document.getElementById('default-start-time').value,
            defaultEndTime: document.getElementById('default-end-time').value,
            defaultLocation: document.getElementById('default-location').value
        };
        
        // Save to Supabase
        await Promise.all([
            this.upsertSetting('default_start_time', this.settings.defaultStartTime, 'Default meeting start time'),
            this.upsertSetting('default_end_time', this.settings.defaultEndTime, 'Default meeting end time'),
            this.upsertSetting('default_location', this.settings.defaultLocation, 'Default meeting location')
        ]);
    }
    
    async upsertSetting(keyName, value, description) {
        // First try to update
        const { error: updateError } = await supabase
            .from('default_settings')
            .update({ value, description })
            .eq('key_name', keyName);
            
        if (updateError) {
            // If update failed, try to insert (in case the setting doesn't exist)
            const { error: insertError } = await supabase
                .from('default_settings')
                .insert({ key_name: keyName, value, description });
                
            if (insertError) {
                console.error('Error saving setting:', insertError);
            }
        }
    }

    populateInitialData() {
        // Only load existing data from UI, no default data creation
        this.loadMinistries();
        this.loadMembers();
    }
    
    async createMinistry(name) {
        const { data, error } = await supabase
            .from('ministries')
            .insert({ name })
            .select()
            .single();
            
        if (error) {
            console.error('Error creating ministry:', error);
        } else {
            this.ministries.push(name);
        }
    }
    
    async createMember(name, year) {
        const { data, error } = await supabase
            .from('members')
            .insert({ 
                name, 
                email: `${name.toLowerCase().replace(' ', '_')}@example.com`,
                role: 'Member'
            })
            .select()
            .single();
            
        if (error) {
            console.error('Error creating member:', error);
        } else {
            if (!this.members[year]) {
                this.members[year] = [];
            }
            this.members[year].push({ id: data.id, name: data.name });
        }
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
    async addMember() {
        const name = document.getElementById('member-name').value.trim();
        const year = document.getElementById('year-select').value;
        
        if (!name) return;

        // Set loading state
        this.setLoadingState('addingMember', true);
        
        if (!this.members[year]) {
            this.members[year] = [];
        }
        
        // Check if member with same name already exists
        const memberExists = this.members[year].some(member => member.name === name);
        if (!memberExists) {
            try {
                // Add member to Supabase
                const { data, error } = await supabase
                    .from('members')
                    .insert({ 
                        name, 
                        email: `${name.toLowerCase().replace(' ', '_')}@example.com`,
                        role: 'Member'
                    })
                    .select()
                    .single();
                    
                if (error) {
                    console.error('Error adding member:', error);
                    alert('Error adding member: ' + error.message);
                } else {
                    // Push the member object with both ID and name
                    this.members[year].push({ id: data.id, name: data.name });
                    this.loadMembers();
                    document.getElementById('member-name').value = '';
                }
            } catch (error) {
                console.error('Error adding member:', error);
                alert('Error adding member: ' + error.message);
            }
        }
        
        // Reset loading state
        this.setLoadingState('addingMember', false);
    }

    async removeMember(id, year) {
        // Set loading state for member removal
        this.setLoadingState('removingMember', true);
        
        try {
            // Delete from Supabase using ID directly
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', id);
                
            if (error) {
                console.error('Error removing member:', error);
                alert('Error removing member: ' + error.message);
            } else {
                this.members[year] = this.members[year].filter(member => member.id !== id);
                this.loadMembers();
            }
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Error removing member: ' + error.message);
        }
        
        // Reset loading state
        this.setLoadingState('removingMember', false);
    }

    loadMembers() {
        const year = document.getElementById('year-select').value;
        const container = document.getElementById('members-list');

        container.innerHTML = '';

        if (this.members[year]) {
            this.members[year].forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200';

                // Create member name span
                const nameSpan = document.createElement('span');
                nameSpan.className = 'text-gray-800 text-xs sm:text-sm';
                nameSpan.textContent = member.name;

                // Create delete button with event listener instead of inline onclick
                const deleteButton = document.createElement('button');
                deleteButton.className = 'text-rose-500 hover:text-rose-700 p-1';
                deleteButton.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                `;
                deleteButton.addEventListener('click', () => this.removeMember(member.id, year));

                memberDiv.appendChild(nameSpan);
                memberDiv.appendChild(deleteButton);
                container.appendChild(memberDiv);
            });
        } else {
            container.innerHTML = '<p class="text-gray-500 text-sm p-2">Aucun membre trouvé</p>';
        }
    }

    // Ministries Management
    async addMinistry() {
        const name = document.getElementById('ministry-name').value.trim();
        
        if (!name || this.ministries.includes(name)) return;

        // Set loading state
        this.setLoadingState('addingMinistry', true);
        
        try {
            const { data, error } = await supabase
                .from('ministries')
                .insert({ name })
                .select()
                .single();
                
            if (error) {
                console.error('Error adding ministry:', error);
                alert('Error adding ministry: ' + error.message);
            } else {
                this.ministries.push(name);
                this.loadMinistries();
                document.getElementById('ministry-name').value = '';
            }
        } catch (error) {
            console.error('Error adding ministry:', error);
            alert('Error adding ministry: ' + error.message);
        }
        
        // Reset loading state
        this.setLoadingState('addingMinistry', false);
    }

    async removeMinistry(name) {
        try {
            // Find ministry ID to delete from Supabase
            const { data: ministryData, error: ministryError } = await supabase
                .from('ministries')
                .select('id')
                .eq('name', name)
                .single();
                
            if (ministryError) {
                console.error('Error finding ministry to remove:', ministryError);
                alert('Error finding ministry: ' + ministryError.message);
                return;
            }
            
            // Delete from Supabase
            const { error } = await supabase
                .from('ministries')
                .delete()
                .eq('id', ministryData.id);
                
            if (error) {
                console.error('Error removing ministry:', error);
                alert('Error removing ministry: ' + error.message);
            } else {
                this.ministries = this.ministries.filter(ministry => ministry !== name);
                this.loadMinistries();
            }
        } catch (error) {
            console.error('Error removing ministry:', error);
            alert('Error removing ministry: ' + error.message);
        }
    }

    loadMinistries() {
        const container = document.getElementById('ministries-list');
        const filterSelect = document.getElementById('filter-ministry');

        // Clear containers
        container.innerHTML = '';
        filterSelect.innerHTML = '<option value="">Tous les ministères</option>';

        if (this.ministries.length > 0) {
            this.ministries.forEach(ministry => {
                // Add to ministries list
                const ministryDiv = document.createElement('div');
                ministryDiv.className = 'flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200';

                // Create ministry name span
                const nameSpan = document.createElement('span');
                nameSpan.className = 'text-gray-800 text-xs sm:text-sm';
                nameSpan.textContent = ministry;

                // Create delete button with event listener instead of inline onclick
                const deleteButton = document.createElement('button');
                deleteButton.className = 'text-rose-500 hover:text-rose-700 p-1';
                deleteButton.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                `;
                deleteButton.addEventListener('click', () => this.removeMinistry(ministry));

                ministryDiv.appendChild(nameSpan);
                ministryDiv.appendChild(deleteButton);
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
        } else {
            container.innerHTML = '<p class="text-gray-500 text-sm p-2">Aucun ministère trouvé</p>';
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
                <input type="checkbox" id="present-${member.name}" value="${member.name}" class="mr-3 h-4 w-4 text-primary rounded focus:ring-primary present-checkbox" onchange="app.toggleParticipant('${member.name}')">
                <label for="present-${member.name}" class="text-sm">${member.name}</label>
            `;
            presentContainer.appendChild(presentDiv);
            
            // Absent members
            const absentDiv = document.createElement('div');
            absentDiv.className = 'flex items-center';
            absentDiv.innerHTML = `
                <input type="checkbox" id="absent-${member.name}" value="${member.name}" class="mr-3 h-4 w-4 text-primary rounded focus:ring-primary absent-checkbox" onchange="app.toggleParticipant('${member.name}')">
                <label for="absent-${member.name}" class="text-sm">${member.name}</label>
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
        const members = this.members[currentYear] || [];
        // Return just the names to maintain compatibility with existing usage
        return members.map(member => member.name);
    }

    async saveMeeting() {
        // Validate required fields
        const meetingDate = document.getElementById('meeting-date').value;
        const meetingLocation = document.getElementById('meeting-location').value;
        if (!meetingDate || !meetingLocation) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        // Set loading state
        this.setLoadingState('savingMeeting', true);

        try {
            // Collect meeting data
            const meeting = {
                date: meetingDate,
                type: document.getElementById('meeting-type').value,
                location: meetingLocation,
                start_time: document.getElementById('meeting-start-time').value,
                end_time: document.getElementById('meeting-end-time').value,
                year: new Date().getFullYear() // Use current year
            };

            let meetingData;
            let meetingError;

            if (this.editingMeetingId) {
                // Update existing meeting
                const { data, error } = await supabase
                    .from('meetings')
                    .update(meeting)
                    .eq('id', this.editingMeetingId)
                    .select()
                    .single();
                
                meetingData = data;
                meetingError = error;
            } else {
                // Insert new meeting
                meeting.created_at = new Date().toISOString();
                const { data, error } = await supabase
                    .from('meetings')
                    .insert(meeting)
                    .select()
                    .single();
                
                meetingData = data;
                meetingError = error;
            }

            if (meetingError) {
                throw new Error('Error saving meeting: ' + meetingError.message);
            }

            // Process participants
            const presentMembers = Array.from(document.querySelectorAll('#present-members input:checked')).map(cb => cb.value);
            const absentMembers = Array.from(document.querySelectorAll('#absent-members input:checked')).map(cb => cb.value);
            
            // If updating an existing meeting, clear existing participants first
            if (this.editingMeetingId) {
                const { error: deleteParticipantsError } = await supabase
                    .from('meeting_participants')
                    .delete()
                    .eq('meeting_id', this.editingMeetingId);
                
                if (deleteParticipantsError) {
                    console.error('Error deleting existing participants:', deleteParticipantsError);
                }
            }
            
            for (const member of presentMembers) {
                await this.addMeetingParticipant(meetingData.id, member, 'present');
            }
            
            for (const member of absentMembers) {
                await this.addMeetingParticipant(meetingData.id, member, 'absent');
            }

            // Process topics
            const topics = this.collectTopicsData();
            
            // If editing an existing meeting, delete existing topics first
            if (this.editingMeetingId) {
                const { error: deleteTopicsError } = await supabase
                    .from('topics')
                    .delete()
                    .eq('meeting_id', this.editingMeetingId);
                
                if (deleteTopicsError) {
                    console.error('Error deleting existing topics:', deleteTopicsError);
                }
            }
            
            for (const topic of topics) {
                // Insert topic into Supabase
                const { data: topicData, error: topicError } = await supabase
                    .from('topics')
                    .insert({
                        meeting_id: meetingData.id,
                        title: topic.title,
                        description: topic.description,
                        sort_order: 0 // Default order
                    })
                    .select()
                    .single();

                if (topicError) {
                    console.error('Error saving topic:', topicError);
                    continue;
                }

                // Process ministries for this topic
                for (const ministryName of (topic.ministries || [])) {
                    await this.linkTopicToMinistry(topicData.id, ministryName);
                }

                // Process decision for this topic
                if (topic.decision) {
                    const decisionNumber = this.generateDecisionNumber(meeting.date);
                    await this.createDecision(topicData.id, topic.decision, decisionNumber);
                }

                // Process todos for this topic
                for (const todo of (topic.todos || [])) {
                    await this.createTask(topicData.id, todo.text, todo.dueDate, todo.assignee);
                }
            }

            // Reset form
            this.resetCreateForm();
            
            // Refresh data to include the new meeting
            await this.loadFromSupabase();
            
            // Show success message
            if (this.editingMeetingId) {
                alert('Réunion mise à jour avec succès !');
                // Clear editing state
                delete this.editingMeetingId;
                
                // Restore save button text
                const saveButton = document.getElementById('save-meeting');
                if (saveButton) {
                    saveButton.innerHTML = `
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                        </svg>
                        Enregistrer
                    `;
                }
            } else {
                alert('Réunion enregistrée avec succès !');
            }
            
            // Switch to meetings tab to show the new meeting
            this.showTab('meetings');
            // Reload meetings to show the newly created one
            this.loadMeetings();
        } catch (error) {
            console.error('Error saving meeting:', error);
            alert('Error saving meeting: ' + error.message);
        } finally {
            // Reset loading state
            this.setLoadingState('savingMeeting', false);
        }
    }
    
    async addMeetingParticipant(meetingId, memberName, status) {
        // First get member ID
        const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('id')
            .eq('name', memberName)
            .single();
            
        if (memberError) {
            console.error('Error finding member for participant:', memberError);
            return;
        }
        
        // Add participant to meeting
        const { error } = await supabase
            .from('meeting_participants')
            .insert({
                meeting_id: meetingId,
                member_id: memberData.id,
                attendance_status: status
            });
            
        if (error) {
            console.error('Error adding meeting participant:', error);
        }
    }
    
    async linkTopicToMinistry(topicId, ministryName) {
        // First get ministry ID
        const { data: ministryData, error: ministryError } = await supabase
            .from('ministries')
            .select('id')
            .eq('name', ministryName)
            .single();
            
        if (ministryError) {
            console.error('Error finding ministry:', ministryError);
            return;
        }
        
        // Link topic to ministry
        const { error } = await supabase
            .from('topic_ministries')
            .insert({
                topic_id: topicId,
                ministry_id: ministryData.id
            });
            
        if (error) {
            console.error('Error linking topic to ministry:', error);
        }
    }
    
    async createDecision(topicId, content, decisionNumber) {
        const { error } = await supabase
            .from('decisions')
            .insert({
                topic_id: topicId,
                content: content,
                decision_number: decisionNumber,
                status: 'pending'
            });
            
        if (error) {
            console.error('Error creating decision:', error);
        }
    }
    
    async createTask(topicId, description, dueDate, assignee) {
        // Get assignee member ID if assignee is specified
        let assigneeId = null;
        if (assignee) {
            const { data: assigneeData, error: assigneeError } = await supabase
                .from('members')
                .select('id')
                .eq('name', assignee)
                .single();
                
            if (!assigneeError && assigneeData) {
                assigneeId = assigneeData.id;
            }
        }
        
        const { error } = await supabase
            .from('tasks')
            .insert({
                topic_id: topicId,
                description: description,
                due_date: dueDate || null,
                assignee_id: assigneeId,
                status: 'pending',
                priority: 'medium'
            });
            
        if (error) {
            console.error('Error creating task:', error);
        }
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
        
        // For Supabase implementation, we'll use a simpler approach
        // In a real implementation, we'd query the database for existing decisions in this month
        const sequence = (Math.floor(Math.random() * 1000) + 1).toString().padStart(3, '0');
        return `${prefix}-${sequence}`;
    }

    resetCreateForm() {
        this.currentStep = 1;
        this.updateStepIndicators();
        document.getElementById('step1-content').classList.remove('hidden');
        document.getElementById('step2-content').classList.add('hidden');
        
        // Clear form fields
        document.getElementById('meeting-date').value = '';
        document.getElementById('meeting-type').value = '';
        document.getElementById('meeting-location').value = '';
        document.getElementById('meeting-start-time').value = '';
        document.getElementById('meeting-end-time').value = '';
        document.getElementById('topics-container').innerHTML = '';
        
        // Clear checkboxes
        document.querySelectorAll('#present-members input, #absent-members input').forEach(cb => {
            cb.checked = false;
        });
        
        // Clear editing state
        delete this.editingMeetingId;
        
        // Restore save button text to original
        const saveButton = document.getElementById('save-meeting');
        if (saveButton) {
            saveButton.innerHTML = `
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                </svg>
                Enregistrer
            `;
        }
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
                <div class="flex justify-between items-start border-b pb-3 sm:pb-4">
                    <div>
                        <h3 class="text-base sm:text-lg font-bold text-gray-900 mb-2">${date}</h3>
                        <p class="text-gray-600 text-xs sm:text-sm">${meeting.type === 'regular' ? 'Réunion régulière' : 'Réunion extraordinaire'}</p>
                        <p class="text-gray-600 text-xs sm:text-sm">${meeting.location} • ${meeting.startTime} - ${meeting.endTime}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="app.editMeeting(${meeting.id})" class="text-blue-500 hover:text-blue-700 p-1" title="Modifier">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="app.deleteMeeting(${meeting.id})" class="text-rose-500 hover:text-rose-700 p-1" title="Supprimer">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
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

    async deleteMeeting(meetingId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette réunion ? Cette action est irréversible.')) {
            return;
        }

        try {
            // Delete related data first (due to foreign key constraints)
            // Delete meeting_participants
            const { error: participantError } = await supabase
                .from('meeting_participants')
                .delete()
                .eq('meeting_id', meetingId);
            
            if (participantError) {
                console.error('Error deleting meeting participants:', participantError);
                alert('Error deleting meeting: ' + participantError.message);
                return;
            }

            // Delete topics and their related data
            const { data: topicsData, error: topicsError } = await supabase
                .from('topics')
                .select('id')
                .eq('meeting_id', meetingId);
            
            if (topicsError) {
                console.error('Error fetching topics:', topicsError);
                alert('Error deleting meeting: ' + topicsError.message);
                return;
            }

            // Delete related decisions, tasks, and topic_ministries for each topic
            if (topicsData && topicsData.length > 0) {
                const topicIds = topicsData.map(topic => topic.id);

                // Delete decisions
                const { error: decisionsError } = await supabase
                    .from('decisions')
                    .delete()
                    .in('topic_id', topicIds);
                
                if (decisionsError) {
                    console.error('Error deleting decisions:', decisionsError);
                }

                // Delete tasks
                const { error: tasksError } = await supabase
                    .from('tasks')
                    .delete()
                    .in('topic_id', topicIds);
                
                if (tasksError) {
                    console.error('Error deleting tasks:', tasksError);
                }

                // Delete topic_ministries
                const { error: topicMinistriesError } = await supabase
                    .from('topic_ministries')
                    .delete()
                    .in('topic_id', topicIds);
                
                if (topicMinistriesError) {
                    console.error('Error deleting topic ministries:', topicMinistriesError);
                }

                // Delete topics
                const { error: topicsDeleteError } = await supabase
                    .from('topics')
                    .delete()
                    .eq('meeting_id', meetingId);
                
                if (topicsDeleteError) {
                    console.error('Error deleting topics:', topicsDeleteError);
                    alert('Error deleting meeting: ' + topicsDeleteError.message);
                    return;
                }
            }

            // Finally delete the meeting
            const { error: meetingError } = await supabase
                .from('meetings')
                .delete()
                .eq('id', meetingId);
            
            if (meetingError) {
                console.error('Error deleting meeting:', meetingError);
                alert('Error deleting meeting: ' + meetingError.message);
                return;
            }

            // Update the local state
            this.meetings = this.meetings.filter(meeting => meeting.id !== meetingId);
            
            // Close modal and reload meetings list
            this.closeModal();
            this.loadMeetings();
            
            // Show success message
            alert('Réunion supprimée avec succès !');
        } catch (error) {
            console.error('Error deleting meeting:', error);
            alert('Error deleting meeting: ' + error.message);
        }
    }

    async editMeeting(meetingId) {
        try {
            // Fetch the meeting data to edit
            const { data: meetingData, error: meetingError } = await supabase
                .from('meetings')
                .select(`
                    *,
                    meeting_participants(
                        member_id,
                        attendance_status,
                        members(name)
                    ),
                    topics(
                        *,
                        topic_ministries(
                            ministry_id,
                            ministries(name)
                        ),
                        decisions(*),
                        tasks(*)
                    )
                `)
                .eq('id', meetingId)
                .single();
            
            if (meetingError) {
                console.error('Error fetching meeting to edit:', meetingError);
                alert('Error fetching meeting: ' + meetingError.message);
                return;
            }

            // Process the meeting data to match the form structure
            const processedMeeting = await this.processMeetingsData([meetingData]);
            const meeting = processedMeeting[0];

            // Switch to the create tab to show the edit form
            this.showTab('create');
            
            // Populate the form fields with the meeting data
            document.getElementById('meeting-date').value = meeting.date;
            document.getElementById('meeting-type').value = meeting.type;
            document.getElementById('meeting-location').value = meeting.location;
            document.getElementById('meeting-start-time').value = meeting.startTime;
            document.getElementById('meeting-end-time').value = meeting.endTime;
            
            // Set the current step to step 2 to show the topics form
            this.currentStep = 2;
            this.updateStepIndicators();
            document.getElementById('step1-content').classList.add('hidden');
            document.getElementById('step2-content').classList.remove('hidden');

            // Set a flag to indicate we're editing
            this.editingMeetingId = meetingId;

            // Update the save button text to "Update"
            const saveButton = document.getElementById('save-meeting');
            if (saveButton) {
                saveButton.innerHTML = `
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                    </svg>
                    Mettre à jour
                `;
            }

            // Load participants and set their attendance status
            this.loadParticipants();
            
            // Set checkboxes based on the meeting's attendance data
            meeting.presentMembers.forEach(member => {
                const checkbox = document.getElementById(`present-${member}`);
                if (checkbox) checkbox.checked = true;
            });
            
            meeting.absentMembers.forEach(member => {
                const checkbox = document.getElementById(`absent-${member}`);
                if (checkbox) checkbox.checked = true;
            });
            
            // Clear and populate topics container with existing topics
            const topicsContainer = document.getElementById('topics-container');
            topicsContainer.innerHTML = '';
            
            meeting.topics.forEach((topic, index) => {
                const topicDiv = document.createElement('div');
                topicDiv.className = 'glass-effect rounded-xl p-4 space-y-4 border border-border';
                topicDiv.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div class="flex items-center">
                            <h5 class="heading-font font-semibold text-text mr-3">Sujet #${index + 1}</h5>
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
                        <input type="text" class="topic-title w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="Titre du sujet" value="${topic.title}">
                    </div>
                    <div>
                        <label class="block text-xs font-medium mb-1 text-secondary">Ministères concernés</label>
                        <select class="ministry-select w-full px-3 py-2 rounded-lg border border-border text-sm" multiple="multiple">
                            ${this.ministries.map(ministry => `<option value="${ministry}" ${topic.ministries && topic.ministries.includes(ministry) ? 'selected' : ''}>${ministry}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium mb-1 text-secondary">Description</label>
                        <textarea class="topic-description w-full px-3 py-2 rounded-lg border border-border text-sm" rows="3" placeholder="Description détaillée du sujet">${topic.description || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-medium mb-1 text-secondary">Décision prise (optionnel)</label>
                        <textarea class="topic-decision w-full px-3 py-2 rounded-lg border border-border text-sm" rows="2" placeholder="Décision ou conclusion du sujet">${topic.decision || ''}</textarea>
                    </div>
                    <div class="border-t border-border pt-4">
                        <h6 class="heading-font font-medium text-text mb-2 flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            Tâches à faire
                        </h6>
                        <div class="todo-container space-y-2 mb-2">
                            ${(topic.todos || []).map((todo, todoIndex) => `
                                <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 p-3 bg-white rounded-lg border border-border">
                                    <input type="text" class="todo-text flex-1 w-full sm:w-auto px-3 py-2 rounded-lg border border-border text-sm" placeholder="Description de la tâche" value="${todo.text || ''}">
                                    <input type="date" class="todo-date px-3 py-2 rounded-lg border border-border text-sm" value="${todo.dueDate || ''}">
                                    <select class="todo-assignee px-3 py-2 rounded-lg border border-border text-sm">
                                        <option value="">Assigner à</option>
                                        ${this.getCurrentMembers().map(member => `<option value="${member}" ${todo.assignee === member ? 'selected' : ''}>${member}</option>`).join('')}
                                    </select>
                                    <button onclick="this.parentElement.remove()" class="text-rose-500 hover:text-rose-700 touch-target">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button onclick="app.addTodoItem(this)" class="btn-primary px-3 py-1 rounded text-sm font-medium flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Ajouter une tâche
                        </button>
                    </div>
                `;
                
                topicsContainer.appendChild(topicDiv);
                
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
            });

            // Scroll to the form
            document.getElementById('create-meeting-section').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error in editMeeting:', error);
            alert('Error loading meeting for editing: ' + error.message);
        }
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
        
        const avgParticipation = data.length > 0 && this.getCurrentMembers().length > 0 ?
            Math.round(
                data.reduce((sum, meeting) =>
                    sum + (meeting.presentMembers?.length || 0), 0
                ) / data.length / this.getCurrentMembers().length * 100
            ) : 0;
        
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
    
    // Helper methods for loading states
    setLoadingState(stateKey, isLoading) {
        if (this.loadingStates.hasOwnProperty(stateKey)) {
            this.loadingStates[stateKey] = isLoading;
            this.updateLoadingUI(stateKey, isLoading);
        }
    }
    
    updateLoadingUI(stateKey, isLoading) {
        // Update UI elements based on loading state
        switch(stateKey) {
            case 'addingMember':
                const addMemberBtn = document.getElementById('add-member');
                if (addMemberBtn) {
                    addMemberBtn.disabled = isLoading;
                    if (isLoading) {
                        addMemberBtn.innerHTML = `
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Ajout...
                        `;
                    } else {
                        addMemberBtn.innerHTML = `
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Ajouter
                        `;
                    }
                }
                break;
                
            case 'removingMember':
                // We'll handle member removal loading in the UI separately
                break;
                
            case 'addingMinistry':
                const addMinistryBtn = document.getElementById('add-ministry');
                if (addMinistryBtn) {
                    addMinistryBtn.disabled = isLoading;
                    if (isLoading) {
                        addMinistryBtn.innerHTML = `
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Ajout...
                        `;
                    } else {
                        addMinistryBtn.innerHTML = `
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Ajouter
                        `;
                    }
                }
                break;
                
            case 'removingMinistry':
                // We'll handle ministry removal loading in the UI separately
                break;
                
            case 'savingMeeting':
                const saveMeetingBtn = document.getElementById('save-meeting');
                if (saveMeetingBtn) {
                    saveMeetingBtn.disabled = isLoading;
                    if (isLoading) {
                        saveMeetingBtn.innerHTML = `
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enregistrement...
                        `;
                    } else {
                        saveMeetingBtn.innerHTML = `
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                            </svg>
                            Enregistrer
                        `;
                    }
                }
                break;
                
            case 'meetings':
                // Handle loading for meetings list
                const meetingsList = document.getElementById('meetings-list');
                if (meetingsList && isLoading) {
                    meetingsList.innerHTML = `
                        <div class="flex justify-center items-center h-40">
                            <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    `;
                }
                break;
        }
    }
    
    // Show loading animation on a specific button or element
    showElementLoading(elementId, loadingText = "Chargement...") {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = true;
            const originalContent = element.innerHTML;
            element.originalContent = originalContent; // Store original content for later restoration
            element.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ${loadingText}
            `;
        }
    }
    
    // Restore original content for a button or element
    restoreElementContent(elementId) {
        const element = document.getElementById(elementId);
        if (element && element.originalContent) {
            element.innerHTML = element.originalContent;
            element.disabled = false;
            delete element.originalContent; // Remove the stored content
        }
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