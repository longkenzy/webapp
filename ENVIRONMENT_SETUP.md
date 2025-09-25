# Environment Setup Guide

## Overview
Project đã được thống nhất sử dụng **Local PostgreSQL** cho tất cả environments.

## Environment Files

### 1. env.development
- **Database**: `smartservices_dev` (Local PostgreSQL)
- **Purpose**: Development environment
- **URL**: `postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices_dev`

### 2. env.production  
- **Database**: `smartservices` (Local PostgreSQL)
- **Purpose**: Production environment
- **URL**: `postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices`

### 3. .env (Main file for Next.js)
Tạo file `.env` trong root directory với nội dung:

```bash
# Development Environment - Local PostgreSQL
DATABASE_URL="postgresql://smartservices:Longkenzy%407525@113.161.61.162:5432/smartservices_dev"
NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="V6ep3RewHhCwymO/nStkq9QPVsIpuD5h0IGNhsrZs0M="

# Telegram Configuration
TELEGRAM_BOT_TOKEN="7957331372:AAEl8wYO_mlZz3XLhzBGg9AKr-LZM--3LKo"
TELEGRAM_CHAT_ID="1653169009"
```

## Scripts

### PowerShell Scripts
- `setup-env.ps1 -Environment dev`: Setup development environment
- `setup-env.ps1 -Environment prod`: Setup production environment
- `to-dev.ps1`: Switch to development database
- `to-prod.ps1`: Switch to production database

### Usage
```powershell
# Setup development environment
.\setup-env.ps1 -Environment dev

# Setup production environment  
.\setup-env.ps1 -Environment prod

# Quick switch to development
.\to-dev.ps1

# Quick switch to production
.\to-prod.ps1
```

## Database Structure

### Development Database: `smartservices_dev`
- Used for local development
- Safe to experiment and test

### Production Database: `smartservices`  
- Used for production deployment
- Contains live data

## Changes Made

1. ✅ **Removed**: `env.deployment` (duplicate file)
2. ✅ **Updated**: `env.development` to use Local PostgreSQL
3. ✅ **Updated**: `env.production` to include Telegram config
4. ✅ **Updated**: All PowerShell scripts to use Local PostgreSQL
5. ✅ **Added**: Telegram configuration to all environments

## Migration from Neon to Local PostgreSQL

All database connections have been migrated from Neon to Local PostgreSQL:
- **Before**: Mixed Neon and Local PostgreSQL
- **After**: Unified Local PostgreSQL for all environments

## Next Steps

1. Create `.env` file from the template above
2. Ensure Local PostgreSQL server is running
3. Run database migrations if needed
4. Test the application with new environment setup
