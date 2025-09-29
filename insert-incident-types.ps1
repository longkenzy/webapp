# Script to insert incident types into both development and production databases
# This script adds the new incident types without affecting existing data

Write-Host "Starting incident types insertion..." -ForegroundColor Green

# Define the incident types data
$incidentTypes = @(
    @{
        name = "Hardware"
        description = "Hỏng PC, laptop, server, máy in, thiết bị ngoại vi."
    },
    @{
        name = "Software"
        description = "Lỗi hệ điều hành, ứng dụng, update, patch."
    },
    @{
        name = "Network"
        description = "Mất mạng LAN/WiFi/VPN, lỗi router, switch, firewall."
    },
    @{
        name = "Account & Access"
        description = "Quên mật khẩu, khóa tài khoản, lỗi phân quyền."
    },
    @{
        name = "Email & Collaboration"
        description = "Lỗi gửi/nhận mail, spam, Teams/Zoom/Outlook lỗi."
    },
    @{
        name = "Printing & Peripheral"
        description = "Lỗi in ấn, kẹt giấy, không share máy in, ngoại vi hỏng."
    },
    @{
        name = "Security"
        description = "Virus, malware, phishing, tấn công mạng, lộ dữ liệu."
    },
    @{
        name = "Service Request"
        description = "Cấp tài khoản, quyền truy cập, cài phần mềm, cấp thiết bị."
    },
    @{
        name = "Problem"
        description = "Sự cố lặp lại, cần phân tích nguyên nhân gốc rễ."
    },
    @{
        name = "Change"
        description = "Thay đổi/nâng cấp phần mềm, hệ thống, cấu hình."
    }
)

# Function to insert incident types into database
function Insert-IncidentTypes {
    param(
        [string]$DatabaseUrl,
        [string]$Environment
    )
    
    Write-Host "Inserting incident types into $Environment database..." -ForegroundColor Yellow
    
    try {
        # Set the DATABASE_URL environment variable
        $env:DATABASE_URL = $DatabaseUrl
        
        # Create a temporary Node.js script to insert the data
        $tempScript = @"
const { PrismaClient } = require('@prisma/client');

async function insertIncidentTypes() {
    const prisma = new PrismaClient();
    
    const incidentTypes = [
        {
            name: "Hardware",
            description: "Hỏng PC, laptop, server, máy in, thiết bị ngoại vi."
        },
        {
            name: "Software", 
            description: "Lỗi hệ điều hành, ứng dụng, update, patch."
        },
        {
            name: "Network",
            description: "Mất mạng LAN/WiFi/VPN, lỗi router, switch, firewall."
        },
        {
            name: "Account & Access",
            description: "Quên mật khẩu, khóa tài khoản, lỗi phân quyền."
        },
        {
            name: "Email & Collaboration",
            description: "Lỗi gửi/nhận mail, spam, Teams/Zoom/Outlook lỗi."
        },
        {
            name: "Printing & Peripheral",
            description: "Lỗi in ấn, kẹt giấy, không share máy in, ngoại vi hỏng."
        },
        {
            name: "Security",
            description: "Virus, malware, phishing, tấn công mạng, lộ dữ liệu."
        },
        {
            name: "Service Request",
            description: "Cấp tài khoản, quyền truy cập, cài phần mềm, cấp thiết bị."
        },
        {
            name: "Problem",
            description: "Sự cố lặp lại, cần phân tích nguyên nhân gốc rễ."
        },
        {
            name: "Change",
            description: "Thay đổi/nâng cấp phần mềm, hệ thống, cấu hình."
        }
    ];
    
    let inserted = 0;
    let skipped = 0;
    
    for (const type of incidentTypes) {
        try {
            // Check if incident type already exists
            const existing = await prisma.incidentType.findUnique({
                where: { name: type.name }
            });
            
            if (existing) {
                console.log(\`Skipping existing incident type: \${type.name}\`);
                skipped++;
                continue;
            }
            
            // Insert new incident type
            await prisma.incidentType.create({
                data: {
                    name: type.name,
                    description: type.description,
                    isActive: true
                }
            });
            
            console.log(\`Inserted incident type: \${type.name}\`);
            inserted++;
            
        } catch (error) {
            console.error(\`Error inserting \${type.name}:\`, error.message);
        }
    }
    
    console.log(\`\nSummary for $($Environment):\`);
    console.log(\`- Inserted: \${inserted}\`);
    console.log(\`- Skipped (already exists): \${skipped}\`);
    
    await prisma.\$disconnect();
}

insertIncidentTypes().catch(console.error);
"@
        
        # Write the script to a temporary file
        $tempScriptPath = "temp_insert_incident_types.js"
        $tempScript | Out-File -FilePath $tempScriptPath -Encoding UTF8
        
        # Run the script
        node $tempScriptPath
        
        # Clean up
        Remove-Item $tempScriptPath -Force
        
        Write-Host "Successfully processed incident types for $Environment" -ForegroundColor Green
        
    } catch {
        Write-Host "Error inserting incident types into $Environment : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Get database URLs from environment files or ask user
$devDbUrl = ""
$prodDbUrl = ""

# Try to read from .env files
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "DATABASE_URL=(.+?)(?:\r?\n|$)") {
        $devDbUrl = $matches[1].Trim()
    }
}

if (Test-Path ".env.production") {
    $envContent = Get-Content ".env.production" -Raw
    if ($envContent -match "DATABASE_URL=(.+?)(?:\r?\n|$)") {
        $prodDbUrl = $matches[1].Trim()
    }
}

# If URLs not found in env files, ask user
if (-not $devDbUrl) {
    $devDbUrl = Read-Host "Enter Development Database URL"
}

if (-not $prodDbUrl) {
    $prodDbUrl = Read-Host "Enter Production Database URL"
}

# Confirm before proceeding
Write-Host "`nAbout to insert incident types into:" -ForegroundColor Cyan
Write-Host "- Development: $($devDbUrl.Substring(0, [Math]::Min(50, $devDbUrl.Length)))..." -ForegroundColor Yellow
Write-Host "- Production: $($prodDbUrl.Substring(0, [Math]::Min(50, $prodDbUrl.Length)))..." -ForegroundColor Yellow

$confirm = Read-Host "`nDo you want to continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit 0
}

# Insert into development database
if ($devDbUrl) {
    Insert-IncidentTypes -DatabaseUrl $devDbUrl -Environment "Development"
}

# Insert into production database  
if ($prodDbUrl) {
    Insert-IncidentTypes -DatabaseUrl $prodDbUrl -Environment "Production"
}

Write-Host "`nIncident types insertion completed!" -ForegroundColor Green
Write-Host "You can now use these incident types in your application." -ForegroundColor Cyan
