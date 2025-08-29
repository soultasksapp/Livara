-- Supabase Database Schema Migration
-- Based on existing SQLite schema from Flask app

-- Enable RLS (Row Level Security)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Teams table
CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

-- Conversations table
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL
);

-- Team widget keys table
CREATE TABLE team_widget_keys (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL UNIQUE,
    key_name TEXT DEFAULT 'Default Widget Key',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count BIGINT DEFAULT 0,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ngrok_url TEXT
);

-- Widget configurations table
CREATE TABLE widget_configs (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    widget_title VARCHAR(255) DEFAULT 'Chat with AI Agent',
    widget_subtitle VARCHAR(255) DEFAULT 'We are here to help',
    primary_color VARCHAR(7) DEFAULT '#007bff',
    secondary_color VARCHAR(7) DEFAULT '#6c757d',
    welcome_message TEXT DEFAULT 'Hello! How can I help?',
    input_placeholder VARCHAR(255) DEFAULT 'Send a message',
    widget_position VARCHAR(20) DEFAULT 'bottom-right' CHECK (widget_position IN ('bottom-right', 'bottom-left', 'top-right', 'top-left')),
    show_avatar BOOLEAN DEFAULT true,
    show_powered_by BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

-- Custom questions table
CREATE TABLE custom_questions (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

-- Contacts table
CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    message TEXT,
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed'))
);

-- Audit log table
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- LLM Settings table (encrypted API keys storage)
CREATE TABLE llm_settings (
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(50) DEFAULT 'ollama' CHECK (provider IN ('openai', 'ollama')),
    openai_api_key_encrypted TEXT,
    openai_model VARCHAR(100) DEFAULT 'gpt-4o-mini',
    ollama_url VARCHAR(255) DEFAULT 'http://localhost:11434',
    ollama_model VARCHAR(100) DEFAULT 'qwen2.5:14b-instruct-q4_K_M',
    max_tokens INTEGER DEFAULT 2048,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    custom_instructions TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL
);

-- File uploads table
CREATE TABLE file_uploads (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_processed BOOLEAN DEFAULT false,
    content_text TEXT
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_team_id ON conversations(team_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX idx_team_widget_keys_api_key ON team_widget_keys(api_key);
CREATE INDEX idx_team_widget_keys_team_id ON team_widget_keys(team_id);
CREATE INDEX idx_widget_configs_team_id ON widget_configs(team_id);
CREATE INDEX idx_custom_questions_team_id ON custom_questions(team_id);
CREATE INDEX idx_contacts_team_id ON contacts(team_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_file_uploads_team_id ON file_uploads(team_id);

-- Row Level Security Policies

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own record" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Teams table policies  
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view own team" ON teams FOR SELECT USING (
    id IN (SELECT team_id FROM users WHERE id::text = auth.uid()::text)
);
CREATE POLICY "Admins can view all teams" ON teams FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Conversations table policies
ALTER TABLE conversations ENABLE ROLS LEVEL SECURITY;
CREATE POLICY "Users can view team conversations" ON conversations FOR SELECT USING (
    team_id IN (SELECT team_id FROM users WHERE id::text = auth.uid()::text)
);
CREATE POLICY "Admins can view all conversations" ON conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Widget keys table policies
ALTER TABLE team_widget_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view team widget keys" ON team_widget_keys FOR SELECT USING (
    team_id IN (SELECT team_id FROM users WHERE id::text = auth.uid()::text)
);
CREATE POLICY "Admins can view all widget keys" ON team_widget_keys FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
);

-- Widget configs table policies
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members can view team widget config" ON widget_configs FOR SELECT USING (
    team_id IN (SELECT team_id FROM users WHERE id::text = auth.uid()::text)
);

-- Insert default admin user (you'll need to update the password)
INSERT INTO users (email, password_hash, name, role, is_active) 
VALUES ('admin@livara.com', '$2b$12$placeholder_hash_here', 'Administrator', 'admin', true);

-- Insert default LLM settings
INSERT INTO llm_settings (provider, ollama_url, ollama_model) 
VALUES ('ollama', 'http://localhost:11434', 'qwen2.5:14b-instruct-q4_K_M');