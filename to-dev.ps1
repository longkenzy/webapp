# Switch to Development Database
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jzQACkco0T8S@ep-rapid-dream-a1b4rn5j-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$env:NODE_ENV = "development"
Write-Host "Switched to DEVELOPMENT database" -ForegroundColor Yellow






