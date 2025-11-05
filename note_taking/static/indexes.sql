-- PostgreSQL indexes for Notes Taking Application

-- Indexes for meetings table
CREATE INDEX idx_meetings_date ON meetings(date);
CREATE INDEX idx_meetings_type ON meetings(type);
CREATE INDEX idx_meetings_year ON meetings(year);
CREATE INDEX idx_meetings_date_type ON meetings(date, type);

-- Indexes for members table
CREATE INDEX idx_members_name ON members(name);
CREATE INDEX idx_members_active ON members(is_active);
CREATE INDEX idx_members_email ON members(email);

-- Indexes for ministries table
CREATE INDEX idx_ministries_name ON ministries(name);
CREATE INDEX idx_ministries_active ON ministries(is_active);

-- Indexes for topics table
CREATE INDEX idx_topics_meeting_id ON topics(meeting_id);
CREATE INDEX idx_topics_sort_order ON topics(sort_order);

-- Indexes for decisions table
CREATE INDEX idx_decisions_topic_id ON decisions(topic_id);
CREATE INDEX idx_decisions_number ON decisions(decision_number);
CREATE INDEX idx_decisions_status ON decisions(status);

-- Indexes for tasks table
CREATE INDEX idx_tasks_topic_id ON tasks(topic_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Indexes for join tables
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_member ON meeting_participants(member_id);
CREATE INDEX idx_meeting_participants_status ON meeting_participants(attendance_status);

CREATE INDEX idx_topic_ministries_topic ON topic_ministries(topic_id);
CREATE INDEX idx_topic_ministries_ministry ON topic_ministries(ministry_id);

-- Composite indexes for common queries
CREATE INDEX idx_meetings_date_year_type ON meetings(date, year, type);
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_due_date_status ON tasks(due_date, status);
CREATE INDEX idx_decisions_status_created ON decisions(status, created_at);

-- Full-text search indexes (for search functionality)
CREATE INDEX idx_topics_title_trgm ON topics USING gin(to_tsvector('french', title));
CREATE INDEX idx_topics_description_trgm ON topics USING gin(to_tsvector('french', description));
CREATE INDEX idx_decisions_content_trgm ON decisions USING gin(to_tsvector('french', content));
CREATE INDEX idx_meetings_location_trgm ON meetings USING gin(to_tsvector('french', location));

-- Function-based index for decision number generation
CREATE INDEX idx_decisions_number_prefix ON decisions(LEFT(decision_number, 7)); -- For "YYYY-MM" part