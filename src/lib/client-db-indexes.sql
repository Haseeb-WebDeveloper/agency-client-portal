-- Database indexes for blazing fast client pages
-- These indexes are specifically optimized for client queries

-- Client membership lookup (most frequent query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_membership_user_active 
ON client_memberships (user_id, is_active, deleted_at) 
WHERE deleted_at IS NULL;

-- Contracts by client with status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_client_status_updated 
ON contracts (client_id, status, updated_at DESC, deleted_at) 
WHERE deleted_at IS NULL;

-- Contracts search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_client_title_search 
ON contracts USING gin (to_tsvector('english', title || ' ' || COALESCE(description, ''))) 
WHERE deleted_at IS NULL;

-- Offers by client with status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_client_status_updated 
ON offers (client_id, status, updated_at DESC, deleted_at) 
WHERE deleted_at IS NULL;

-- Offers search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_client_title_search 
ON offers USING gin (to_tsvector('english', title || ' ' || COALESCE(description, ''))) 
WHERE deleted_at IS NULL;

-- Tasks by contract for progress calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_contract_status 
ON tasks (contract_id, status, deleted_at) 
WHERE deleted_at IS NULL;

-- Messages for recent messages query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recent_created 
ON messages (created_at DESC, deleted_at) 
WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7 days';

-- News optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_created_desc 
ON news (created_at DESC, deleted_at) 
WHERE deleted_at IS NULL;

-- Message attachments for media count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_attachments_message 
ON message_attachments (message_id, deleted_at) 
WHERE deleted_at IS NULL;

-- Composite index for dashboard stats query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_client_status_count 
ON contracts (client_id, status) 
WHERE deleted_at IS NULL;

-- Composite index for offers stats query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_client_review_status 
ON offers (client_id, status, has_reviewed) 
WHERE deleted_at IS NULL;

-- Partial index for active client memberships only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_memberships_active_only 
ON client_memberships (user_id, client_id) 
WHERE is_active = true AND deleted_at IS NULL;
