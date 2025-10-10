-- Performance Optimization Indexes
-- Thêm các indexes để tối ưu query performance

-- InternalCase indexes
CREATE INDEX IF NOT EXISTS "InternalCase_status_idx" ON "InternalCase"("status");
CREATE INDEX IF NOT EXISTS "InternalCase_createdAt_idx" ON "InternalCase"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "InternalCase_handlerId_idx" ON "InternalCase"("handlerId");
CREATE INDEX IF NOT EXISTS "InternalCase_reporterId_idx" ON "InternalCase"("reporterId");
CREATE INDEX IF NOT EXISTS "InternalCase_status_createdAt_idx" ON "InternalCase"("status", "createdAt" DESC);

-- DeploymentCase indexes
CREATE INDEX IF NOT EXISTS "DeploymentCase_status_idx" ON "DeploymentCase"("status");
CREATE INDEX IF NOT EXISTS "DeploymentCase_createdAt_idx" ON "DeploymentCase"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "DeploymentCase_handlerId_idx" ON "DeploymentCase"("handlerId");
CREATE INDEX IF NOT EXISTS "DeploymentCase_reporterId_idx" ON "DeploymentCase"("reporterId");
CREATE INDEX IF NOT EXISTS "DeploymentCase_status_createdAt_idx" ON "DeploymentCase"("status", "createdAt" DESC);

-- MaintenanceCase indexes
CREATE INDEX IF NOT EXISTS "MaintenanceCase_status_idx" ON "MaintenanceCase"("status");
CREATE INDEX IF NOT EXISTS "MaintenanceCase_createdAt_idx" ON "MaintenanceCase"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "MaintenanceCase_handlerId_idx" ON "MaintenanceCase"("handlerId");
CREATE INDEX IF NOT EXISTS "MaintenanceCase_reporterId_idx" ON "MaintenanceCase"("reporterId");
CREATE INDEX IF NOT EXISTS "MaintenanceCase_status_createdAt_idx" ON "MaintenanceCase"("status", "createdAt" DESC);

-- Incident indexes
CREATE INDEX IF NOT EXISTS "Incident_status_idx" ON "Incident"("status");
CREATE INDEX IF NOT EXISTS "Incident_createdAt_idx" ON "Incident"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Incident_handlerId_idx" ON "Incident"("handlerId");
CREATE INDEX IF NOT EXISTS "Incident_reporterId_idx" ON "Incident"("reporterId");
CREATE INDEX IF NOT EXISTS "Incident_status_createdAt_idx" ON "Incident"("status", "createdAt" DESC);

-- Warranty indexes
CREATE INDEX IF NOT EXISTS "Warranty_status_idx" ON "Warranty"("status");
CREATE INDEX IF NOT EXISTS "Warranty_createdAt_idx" ON "Warranty"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Warranty_handlerId_idx" ON "Warranty"("handlerId");
CREATE INDEX IF NOT EXISTS "Warranty_reporterId_idx" ON "Warranty"("reporterId");
CREATE INDEX IF NOT EXISTS "Warranty_status_createdAt_idx" ON "Warranty"("status", "createdAt" DESC);

-- ReceivingCase indexes
CREATE INDEX IF NOT EXISTS "ReceivingCase_status_idx" ON "ReceivingCase"("status");
CREATE INDEX IF NOT EXISTS "ReceivingCase_createdAt_idx" ON "ReceivingCase"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ReceivingCase_requesterId_idx" ON "ReceivingCase"("requesterId");
CREATE INDEX IF NOT EXISTS "ReceivingCase_status_createdAt_idx" ON "ReceivingCase"("status", "createdAt" DESC);

-- DeliveryCase indexes
CREATE INDEX IF NOT EXISTS "DeliveryCase_status_idx" ON "DeliveryCase"("status");
CREATE INDEX IF NOT EXISTS "DeliveryCase_createdAt_idx" ON "DeliveryCase"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "DeliveryCase_requesterId_idx" ON "DeliveryCase"("requesterId");
CREATE INDEX IF NOT EXISTS "DeliveryCase_status_createdAt_idx" ON "DeliveryCase"("status", "createdAt" DESC);

-- Employee indexes
CREATE INDEX IF NOT EXISTS "Employee_status_idx" ON "Employee"("status");
CREATE INDEX IF NOT EXISTS "Employee_fullName_idx" ON "Employee"("fullName");
CREATE INDEX IF NOT EXISTS "Employee_department_idx" ON "Employee"("department");

-- User indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Partner indexes
CREATE INDEX IF NOT EXISTS "Partner_shortName_idx" ON "Partner"("shortName");
CREATE INDEX IF NOT EXISTS "Partner_fullCompanyName_idx" ON "Partner"("fullCompanyName");

-- Notification indexes
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt" DESC);

-- Schedule indexes
CREATE INDEX IF NOT EXISTS "Schedule_userId_idx" ON "Schedule"("userId");
CREATE INDEX IF NOT EXISTS "Schedule_startAt_idx" ON "Schedule"("startAt");
CREATE INDEX IF NOT EXISTS "Schedule_endAt_idx" ON "Schedule"("endAt");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "InternalCase_handler_status_idx" ON "InternalCase"("handlerId", "status");
CREATE INDEX IF NOT EXISTS "DeploymentCase_handler_status_idx" ON "DeploymentCase"("handlerId", "status");
CREATE INDEX IF NOT EXISTS "MaintenanceCase_handler_status_idx" ON "MaintenanceCase"("handlerId", "status");

-- Full-text search indexes (for PostgreSQL)
-- Uncomment if using PostgreSQL and need full-text search
-- CREATE INDEX IF NOT EXISTS "InternalCase_title_search_idx" ON "InternalCase" USING gin(to_tsvector('english', "title"));
-- CREATE INDEX IF NOT EXISTS "InternalCase_description_search_idx" ON "InternalCase" USING gin(to_tsvector('english', "description"));

-- Add statistics for query optimizer
ANALYZE "InternalCase";
ANALYZE "DeploymentCase";
ANALYZE "MaintenanceCase";
ANALYZE "Incident";
ANALYZE "Warranty";
ANALYZE "ReceivingCase";
ANALYZE "DeliveryCase";
ANALYZE "Employee";
ANALYZE "User";
ANALYZE "Partner";
ANALYZE "Notification";
ANALYZE "Schedule";

-- Show index sizes for monitoring
SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

