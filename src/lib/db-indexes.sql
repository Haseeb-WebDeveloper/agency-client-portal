-- Database indexes for performance optimization
-- Run these in your database to improve query performance

-- News table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_deleted_at_created_at 
ON news (deleted_at, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_created_at_desc 
ON news (created_at DESC) 
WHERE deleted_at IS NULL;

-- Offers table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_deleted_at_updated_at 
ON offers (deleted_at, updated_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_client_id_deleted_at 
ON offers (client_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_status_deleted_at 
ON offers (status, deleted_at) 
WHERE deleted_at IS NULL;

-- Contracts table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_deleted_at_updated_at 
ON contracts (deleted_at, updated_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_client_id_deleted_at 
ON contracts (client_id, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_status_deleted_at 
ON contracts (status, deleted_at) 
WHERE deleted_at IS NULL;

-- Messages table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_deleted_at_created_at 
ON messages (deleted_at, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_room_id_deleted_at_created_at 
ON messages (room_id, deleted_at, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_contract_id_deleted_at 
ON messages (contract_id, deleted_at) 
WHERE deleted_at IS NULL AND contract_id IS NOT NULL;

-- Client memberships indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_memberships_user_id_active_deleted 
ON client_memberships (user_id, is_active, deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_memberships_client_id_active_deleted 
ON client_memberships (client_id, is_active, deleted_at) 
WHERE deleted_at IS NULL;

-- Clients table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_deleted_at_updated_at 
ON clients (deleted_at, updated_at DESC) 
WHERE deleted_at IS NULL;

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_active 
ON users (role, is_active) 
WHERE is_active = true;

-- Message attachments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_attachments_message_id 
ON message_attachments (message_id);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_search 
ON offers USING gin (to_tsvector('english', title || ' ' || COALESCE(description, ''))) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_search 
ON news USING gin (to_tsvector('english', title || ' ' || COALESCE(description, ''))) 
WHERE deleted_at IS NULL;

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_active 
ON contracts (client_id, updated_at DESC) 
WHERE deleted_at IS NULL AND status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_draft 
ON contracts (client_id, updated_at DESC) 
WHERE deleted_at IS NULL AND status = 'DRAFT';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_sent 
ON offers (client_id, updated_at DESC) 
WHERE deleted_at IS NULL AND status = 'SENT';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_draft 
ON offers (client_id, updated_at DESC) 
WHERE deleted_at IS NULL AND status = 'DRAFT';
