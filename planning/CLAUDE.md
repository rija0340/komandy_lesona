# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **religious role assignment planning application** written in French. It's a pure client-side web application for managing and generating balanced role assignments across multiple weeks for religious services.

### Key Files
- **index.html** (845 lines) - Main application interface with HTML structure
- **script.js** (2,427 lines) - Core application logic in vanilla JavaScript
- **new_section.html** (21 lines) - Additional section template

## Development Workflow

### Running the Application
Simply open `index.html` in a web browser. No build process or server required.

```bash
# Open in browser
open index.html
# or
firefox index.html
```

### No Build Process
This is a pure static web application. No package.json, no build tools, no dependencies to install.

### Third-Party Dependencies (CDNs)
- **TailwindCSS** (CDN) - Styling framework
- **Font Awesome 6.4.0** - Icons
- **SheetJS (xlsx@0.18.5)** - Excel export functionality

## Application Architecture

### Core Data Structures
- **jours** - Array of day names
- **roles** - Object mapping days to their roles: `{jour: [roles]}`
- **personnes** - Array of people with availability: `[{nom, disponibilites: [jours]}]`
- **planning** - Generated schedule: `[{semaine, jour, role, personne}]`

### Main Features

#### 1. Configuration Tab (Configurer)
- Add days with roles
- Add people with availability
- Modify day roles
- Modify person availability
- Import/Export configuration (JSON)

#### 2. Planning Tab (Planning)
- Generate balanced planning across weeks
- Real-time assistant with filters
- Export to Excel (.xlsx)
- Export/Import planning (JSON)
- Reinitialize planning

#### 3. Statistics Tab (Statistiques)
- Advanced filtering (people, weeks, roles)
- Assignment statistics and analytics
- Fairness distribution analysis

### Core Functions in script.js

#### Data Management
- `chargerDonnees()` - Load data from localStorage
- `sauvegarderDonnees()` - Save data to localStorage
- `exporterJSON()` - Export configuration
- `importerJSON()` - Import configuration
- `exporterExcel()` - Export planning to Excel
- `genererPlanning()` - Main planning generation algorithm

#### UI/UX
- `switchTab()` - Tab navigation (configurer/planning/statistiques)
- `toggleConfig()` - Expand/collapse configuration panel
- `afficherListes()` - Display configured items

#### Planning Algorithm
The `genererPlanning()` function implements a balanced assignment algorithm that:
- Distributes roles fairly across people
- Respects person availability
- Supports "absolute fairness" mode
- Can regenerate with retry logic

## Code Organization

### script.js Sections
1. **Application State** (lines 1-11) - Global variables
2. **Interface Management** (lines 13-52) - UI toggles and tabs
3. **Data Addition** (lines 54-100) - Add days, people, roles
4. **List Display** (various) - Show current configuration
5. **Planning Generation** (major section) - Core algorithm
6. **Statistics** (major section) - Analytics and filtering
7. **Export/Import** (major section) - Data exchange
8. **Real-time Assistant** (major section) - Live planning helper

### HTML Structure
- Uses TailwindCSS classes for styling
- Responsive design (mobile and desktop views)
- Three main tabs with content sections
- Modal-like panels for configuration
- Table-based planning display

## Mobile Responsiveness

The application has comprehensive mobile support:
- CSS media queries at 768px breakpoint
- Separate mobile and desktop table views
- Touch-friendly interface
- Collapsible sections
- Responsive grid layouts

## Local Storage

All application data is persisted in browser's localStorage:
- Configuration (days, roles, people)
- Generated planning
- User preferences (debug mode, etc.)

## Recent Development History

Based on git commits:
- Recent: Added sortable day feature
- Added Supabase integration (for note-taking feature)
- General improvements and feature additions
- Multiple iterations of planning functionality

## French Language

All UI text, comments, and documentation are in French. Key terms:
- **Planning** - Schedule/Planning
- **Rôles** - Roles
- **Personnes** - People
- **Jours** - Days
- **Semaines** - Weeks
- **Configurer** - Configure
- **Statistiques** - Statistics

## Important Implementation Notes

### Algorithm Considerations
- The planning generation uses an iterative approach
- May require multiple retries for complex assignments
- Mode "équité absolue" ensures perfect distribution
- Debug mode shows internal algorithm steps

### Excel Export
Uses SheetJS library to generate .xlsx files from planning data

### Real-time Assistant
Dynamic filtering system that:
- Highlights selected people/roles/weeks
- Shows assignment status
- Analyzes repetition patterns
- Provides visual summaries

## Testing Changes

Since there's no automated testing:
1. Test all three main tabs after changes
2. Verify planning generation with different configurations
3. Test import/export functionality
4. Check mobile responsiveness
5. Validate Excel export works correctly
6. Test localStorage persistence

## Browser Compatibility

Uses modern web APIs (localStorage, ES6+ JavaScript). Tested with:
- Modern browsers with ES6 support
- Mobile browsers (iOS Safari, Chrome Mobile)
