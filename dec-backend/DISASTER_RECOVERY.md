# DocEC — Disaster Recovery Procedures

## Overview

This document outlines the procedures for backing up and restoring the DocEC system in case of data loss, corruption, or system failure.

---

## Backup Summary

| Item | Schedule | Location | Retention |
|------|----------|----------|-----------|
| Database (MySQL) | Daily at 2:00 AM | `storage/app/backups/db_*.sql` | 7 days |
| Uploaded files | Daily at 2:00 AM | `storage/app/backups/files_*/` | 7 days |
| Database only | Weekly Sunday 3:00 AM | `storage/app/backups/db_*.sql` | 7 days |

---

## Available Commands

| Command | Description |
|---------|-------------|
| `php artisan backup:run` | Full backup (database + files) |
| `php artisan backup:run --db-only` | Database backup only |
| `php artisan backup:list` | List all available backups |
| `php artisan backup:restore` | Interactive database restore |
| `php artisan backup:restore db_2026-03-08.sql` | Restore a specific backup |
| `php artisan backup:restore --files` | Restore database + uploaded files |
| `php artisan backup:restore --force` | Skip confirmation prompt |

---

## Recovery Procedures

### Scenario 1: Database Corruption

**Symptoms:** Application errors, missing data, broken queries.

**Steps:**
1. List available backups:
   ```
   php artisan backup:list
   ```
2. Restore the most recent backup:
   ```
   php artisan backup:restore
   ```
3. Select the latest backup from the interactive list
4. The system automatically creates a safety backup before restoring
5. Verify the application works correctly

### Scenario 2: Accidental Data Deletion

**Steps:**
1. Identify the backup created BEFORE the deletion
2. Restore that specific backup:
   ```
   php artisan backup:restore db_YYYY-MM-DD_HH-mm-ss.sql
   ```
3. Data deleted after that backup timestamp will be lost

### Scenario 3: Complete Server Failure

**Steps:**
1. Set up a new Laravel server with the same PHP and MySQL versions
2. Clone the repository and install dependencies:
   ```
   composer install
   npm install
   ```
3. Copy `.env` from a known good copy and configure database credentials
4. Run migrations:
   ```
   php artisan migrate
   ```
5. Copy the backup files to `storage/app/backups/`
6. Restore database:
   ```
   php artisan backup:restore --force
   ```
7. Restore uploaded files:
   ```
   php artisan backup:restore --files --force
   ```
8. Link storage:
   ```
   php artisan storage:link
   ```

### Scenario 4: Rolling Back a Bad Deployment

**Steps:**
1. The restore command automatically creates a pre-restore safety backup
2. If the restore itself causes issues, restore the safety backup:
   ```
   php artisan backup:restore
   ```
   Select the most recent `db_*` file (the safety backup)

---

## How to Activate Automatic Backups

### Option A: Laravel Scheduler (Recommended)
```
php artisan schedule:work
```
Or use `start-scheduler.bat` on Windows. Keep this running for automatic daily backups.

### Option B: Windows Task Scheduler
1. Open Task Scheduler
2. Create a Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `php`
6. Arguments: `artisan backup:run`
7. Start in: `c:\laragon\www\DocEC\dec-backend`

---

## Important Notes

- Backups older than **7 days** are automatically cleaned up
- The restore command always creates a **safety backup** before overwriting
- Backup logs are written to `storage/logs/backup.log`
- Test your restore procedures periodically to ensure backups are valid
