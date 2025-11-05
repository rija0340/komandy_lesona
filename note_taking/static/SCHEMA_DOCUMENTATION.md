# PostgreSQL Schema Documentation for Notes Taking Application

## Overview

This schema supports a comprehensive meeting notes and decision tracking system. It captures all the functionality from the existing JavaScript application and extends it with database-level constraints, relationships, and optimizations.

## Entity Relationship Diagram (ERD)

```
meetings
├── meeting_participants ─── members
├── topics
│   ├── topic_ministries ─── ministries
│   ├── decisions
│   └── tasks ─── (assignee) members
└── default_settings
```

## Table Details

### 1. members
Stores information about committee members.

#### Columns:
- `id`: UUID primary key
- `name`: Member's full name (required)
- `email`: Contact email
- `phone`: Contact phone number
- `role`: Position or role in the organization
- `is_active`: Boolean indicating active status (default: true)
- `created_at`, `updated_at`: Timestamps for record management

#### Notes:
- Used for meeting participants and task assignees
- Supports member management from the settings tab

### 2. ministries
Stores information about departments or ministries involved in meetings.

#### Columns:
- `id`: UUID primary key
- `name`: Ministry name (required, unique)
- `description`: Optional description of the ministry
- `is_active`: Boolean indicating active status (default: true)
- `created_at`, `updated_at`: Timestamps for record management

#### Notes:
- Used to associate topics with relevant ministries
- Supports ministry management from the settings tab

### 3. meetings
Main table for storing meeting events.

#### Columns:
- `id`: UUID primary key
- `date`: Date of the meeting (required)
- `type`: Meeting type ('regular' or 'extraordinary') (required)
- `location`: Location of the meeting
- `start_time`: Meeting start time (required)
- `end_time`: Meeting end time (required)
- `year`: Year for grouping members (required)
- `created_at`, `updated_at`: Timestamps for record management

#### Notes:
- Core entity corresponding to meeting creation and display
- Supports filtering by date range and type

### 4. meeting_participants
Join table for the many-to-many relationship between meetings and members.

#### Columns:
- `meeting_id`: Reference to meetings table (foreign key, cascade delete)
- `member_id`: Reference to members table (foreign key, cascade delete)
- `attendance_status`: 'present' or 'absent' (required)
- `created_at`: Timestamp for record management

#### Notes:
- Tracks who attended each meeting and their status
- Supports the participants section in meeting details

### 5. topics
Stores topics discussed during meetings.

#### Columns:
- `id`: UUID primary key
- `meeting_id`: Reference to meetings table (required, cascade delete)
- `title`: Topic title (required)
- `description`: Detailed description of the topic
- `sort_order`: Order of topics in the meeting agenda
- `created_at`, `updated_at`: Timestamps for record management

#### Notes:
- Represents items from the "Sujets traités" section
- Links to a specific meeting

### 6. topic_ministries
Join table for the many-to-many relationship between topics and ministries.

#### Columns:
- `topic_id`: Reference to topics table (foreign key, cascade delete)
- `ministry_id`: Reference to ministries table (foreign key, cascade delete)
- `created_at`: Timestamp for record management

#### Notes:
- Allows associating multiple ministries with each topic
- Supports filtering meetings by ministry

### 7. decisions
Stores decisions made about specific topics.

#### Columns:
- `id`: UUID primary key
- `topic_id`: Reference to topics table (required, cascade delete)
- `decision_number`: Unique identifier in format "YYYY-MM-NNN"
- `content`: Text of the decision (required)
- `status`: Decision status ('pending', 'approved', 'implemented', 'archived')
- `created_at`, `updated_at`: Timestamps for record management

#### Notes:
- Each topic can have zero or one decision
- Decision numbers follow the pattern from the original app
- Supports the "Décisions" tab functionality

### 8. tasks
Stores action items (to-dos) generated from meeting topics.

#### Columns:
- `id`: UUID primary key
- `topic_id`: Reference to topics table (required, cascade delete)
- `description`: Task description (required)
- `assignee_id`: Reference to members table (nullable)
- `due_date`: Date when task is due (nullable)
- `status`: Task status ('pending', 'in_progress', 'completed', 'cancelled')
- `priority`: Task priority ('low', 'medium', 'high', 'critical')
- `completed_at`: Timestamp when task was completed
- `created_at`, `updated_at`: Timestamp for record management

#### Notes:
- Represents "Tâches à faire" from the application
- Supports assignment to members and due dates
- Tracks status and priority of action items

### 9. default_settings
Stores default configuration values for the application.

#### Columns:
- `id`: UUID primary key
- `key_name`: Unique setting identifier (e.g., 'default_start_time')
- `value`: Setting value
- `description`: Explanation of the setting
- `created_at`, `updated_at`: Timestamp for record management

#### Notes:
- Stores default values for meeting times and location
- Supports the settings tab default values functionality

## Key Features Implemented

1. **Meeting Lifecycle**: Full support for meeting creation, participants, topics, decisions, and tasks
2. **Member Management**: Support for committee members with roles and contact information
3. **Ministry Tracking**: Ability to link topics and decisions to specific ministries
4. **Decision Tracking**: Unique decision numbering system and status tracking
5. **Task Management**: Action items with assignments, due dates, and status
6. **Filtering and Search**: Comprehensive indexing for efficient filtering by date, type, ministry, etc.
7. **Data Integrity**: Foreign key constraints and check constraints ensure data quality
8. **Full-text Search**: Support for searching in French across multiple fields

## Migration Considerations

When migrating from localStorage to PostgreSQL:

1. Use the `decision_number` field to maintain the same decision numbering format
2. Convert member/year data to the members table with `is_active` status
3. The `year` field in meetings corresponds to the year selection in the UI
4. Use the many-to-many relationships to preserve associations between topics and ministries
5. Map attendance status ('present'/'absent') to the meeting_participants table

## Performance Considerations

The schema includes comprehensive indexing for:
- Meeting filtering by date, type, and year
- Member and ministry lookups
- Decision and task status queries
- Full-text search capabilities for French content
- Common query patterns for meeting notes and decisions

## Extensions

This schema can be extended with:
- User authentication tables if needed
- Audit logging for tracking changes
- File attachments for meeting documents
- Meeting minutes in rich text format
- Custom fields for organization-specific requirements