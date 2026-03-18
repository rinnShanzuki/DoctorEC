<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Custom daily backup command.
 * Backs up the MySQL database using mysqldump and copies uploaded files.
 * Backups are stored in storage/app/backups/ with timestamps.
 * Old backups beyond the retention period are automatically cleaned up.
 */
class BackupDatabase extends Command
{
    protected $signature = 'backup:run {--db-only : Only backup the database}';
    protected $description = 'Create a backup of the database and uploaded files';

    /**
     * Number of days to keep backups before cleanup.
     */
    protected int $retentionDays = 7;

    public function handle(): int
    {
        $timestamp = now()->format('Y-m-d_H-i-s');
        $backupDir = storage_path('app/backups');

        // Ensure backup directory exists
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $this->info("============================================");
        $this->info("  DocEC Backup — {$timestamp}");
        $this->info("============================================");

        // 1. Database backup using mysqldump
        $this->info("\n[1/3] Backing up database...");
        $dbFile = $backupDir . "/db_{$timestamp}.sql";

        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        // Build mysqldump command
        $cmd = sprintf(
            'mysqldump --host=%s --port=%s --user=%s %s %s > %s 2>&1',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            $password ? '--password=' . escapeshellarg($password) : '',
            escapeshellarg($database),
            escapeshellarg($dbFile)
        );

        exec($cmd, $output, $exitCode);

        if ($exitCode === 0 && file_exists($dbFile) && filesize($dbFile) > 0) {
            $sizeKb = round(filesize($dbFile) / 1024, 1);
            $this->info("   ✓ Database backed up: db_{$timestamp}.sql ({$sizeKb} KB)");
        } else {
            $this->error("   ✗ mysqldump failed (exit code: {$exitCode})");
            $this->error("     Output: " . implode("\n", $output));

            // Fallback: export via Laravel's query builder
            $this->warn("   → Attempting PHP-based fallback...");
            $this->phpFallbackBackup($dbFile, $database);
        }

        // 2. Storage files backup (uploaded images, etc.)
        if (!$this->option('db-only')) {
            $this->info("\n[2/3] Backing up uploaded files...");
            $storagePublicPath = storage_path('app/public');
            $filesBackupDir = $backupDir . "/files_{$timestamp}";

            if (is_dir($storagePublicPath)) {
                $this->copyDirectory($storagePublicPath, $filesBackupDir);
                $fileCount = $this->countFiles($filesBackupDir);
                $this->info("   ✓ {$fileCount} files backed up to files_{$timestamp}/");
            } else {
                $this->warn("   ⚠ No public storage directory found, skipping.");
            }
        } else {
            $this->info("\n[2/3] Skipping file backup (--db-only)");
        }

        // 3. Cleanup old backups
        $this->info("\n[3/3] Cleaning up old backups (>{$this->retentionDays} days)...");
        $cleaned = $this->cleanupOldBackups($backupDir);
        $this->info("   ✓ Removed {$cleaned} old backup(s)");

        $this->info("\n============================================");
        $this->info("  Backup Complete!");
        $this->info("  Location: storage/app/backups/");
        $this->info("============================================");

        return Command::SUCCESS;
    }

    /**
     * PHP-based fallback: exports all tables as INSERT statements.
     */
    protected function phpFallbackBackup(string $filePath, string $database): void
    {
        try {
            $tables = \DB::select('SHOW TABLES');
            $key = "Tables_in_{$database}";
            $sql = "-- DocEC Database Backup (PHP fallback)\n";
            $sql .= "-- Generated: " . now()->toDateTimeString() . "\n";
            $sql .= "-- Database: {$database}\n\n";
            $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

            foreach ($tables as $table) {
                $tableName = $table->$key;

                // Get CREATE TABLE
                $createResult = \DB::select("SHOW CREATE TABLE `{$tableName}`");
                $createSql = $createResult[0]->{'Create Table'} ?? '';
                $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                $sql .= $createSql . ";\n\n";

                // Get data
                $rows = \DB::table($tableName)->get();
                if ($rows->count() > 0) {
                    foreach ($rows as $row) {
                        $values = collect((array) $row)->map(function ($val) {
                            if (is_null($val)) return 'NULL';
                            return "'" . addslashes($val) . "'";
                        })->implode(', ');
                        $sql .= "INSERT INTO `{$tableName}` VALUES ({$values});\n";
                    }
                    $sql .= "\n";
                }
            }

            $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
            file_put_contents($filePath, $sql);

            $sizeKb = round(filesize($filePath) / 1024, 1);
            $this->info("   ✓ PHP fallback backup created ({$sizeKb} KB)");
        } catch (\Exception $e) {
            $this->error("   ✗ PHP fallback also failed: " . $e->getMessage());
        }
    }

    /**
     * Recursively copy a directory.
     */
    protected function copyDirectory(string $src, string $dst): void
    {
        if (!is_dir($dst)) {
            mkdir($dst, 0755, true);
        }

        $dir = opendir($src);
        while (($file = readdir($dir)) !== false) {
            if ($file === '.' || $file === '..') continue;

            $srcPath = $src . '/' . $file;
            $dstPath = $dst . '/' . $file;

            if (is_dir($srcPath)) {
                $this->copyDirectory($srcPath, $dstPath);
            } else {
                copy($srcPath, $dstPath);
            }
        }
        closedir($dir);
    }

    /**
     * Count files recursively.
     */
    protected function countFiles(string $dir): int
    {
        $count = 0;
        if (!is_dir($dir)) return 0;

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if ($file->isFile()) $count++;
        }
        return $count;
    }

    /**
     * Remove backups older than the retention period.
     */
    protected function cleanupOldBackups(string $backupDir): int
    {
        $cleaned = 0;
        $cutoff = now()->subDays($this->retentionDays)->timestamp;

        foreach (scandir($backupDir) as $item) {
            if ($item === '.' || $item === '..') continue;

            $path = $backupDir . '/' . $item;
            $mtime = filemtime($path);

            if ($mtime < $cutoff) {
                if (is_dir($path)) {
                    $this->deleteDirectory($path);
                } else {
                    unlink($path);
                }
                $cleaned++;
            }
        }

        return $cleaned;
    }

    /**
     * Recursively delete a directory.
     */
    protected function deleteDirectory(string $dir): void
    {
        if (!is_dir($dir)) return;

        foreach (scandir($dir) as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . '/' . $item;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
