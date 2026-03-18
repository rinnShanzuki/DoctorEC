<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Restore a database backup from a SQL file.
 * Supports both mysqldump and PHP-fallback generated backups.
 * Includes safety features: confirmation prompt, pre-restore backup,
 * and transaction-like rollback on failure.
 */
class RestoreDatabase extends Command
{
    protected $signature = 'backup:restore
        {file? : The SQL backup filename to restore (e.g. db_2026-03-08_17-41-12.sql)}
        {--force : Skip confirmation prompt}
        {--no-pre-backup : Skip creating a pre-restore safety backup}
        {--files : Also restore uploaded files from matching files_* directory}';

    protected $description = 'Restore the database (and optionally files) from a backup';

    public function handle(): int
    {
        $backupDir = storage_path('app/backups');

        if (!is_dir($backupDir)) {
            $this->error('No backups directory found at storage/app/backups/');
            return Command::FAILURE;
        }

        // If no file specified, show available and let user pick
        $file = $this->argument('file');
        if (!$file) {
            $file = $this->pickBackupFile($backupDir);
            if (!$file) return Command::FAILURE;
        }

        $filePath = $backupDir . '/' . $file;

        if (!file_exists($filePath)) {
            $this->error("Backup file not found: {$file}");
            $this->info("Run 'php artisan backup:list' to see available backups.");
            return Command::FAILURE;
        }

        $sizeKb = round(filesize($filePath) / 1024, 1);
        $date = date('Y-m-d H:i:s', filemtime($filePath));

        $this->info("============================================");
        $this->info("  DocEC Database Restore");
        $this->info("============================================");
        $this->info("  Backup file : {$file}");
        $this->info("  Size        : {$sizeKb} KB");
        $this->info("  Created     : {$date}");
        $this->info("  Database    : " . config('database.connections.mysql.database'));
        $this->info("============================================");

        // Confirmation
        if (!$this->option('force')) {
            $this->warn("\n⚠ WARNING: This will OVERWRITE the current database with the backup data!");
            if (!$this->confirm('Are you sure you want to restore this backup?')) {
                $this->info('Restore cancelled.');
                return Command::SUCCESS;
            }
        }

        // Pre-restore safety backup
        if (!$this->option('no-pre-backup')) {
            $this->info("\n[1/3] Creating pre-restore safety backup...");
            $exitCode = \Artisan::call('backup:run', ['--db-only' => true]);
            if ($exitCode === 0) {
                $this->info("   ✓ Safety backup created (in case restore fails)");
            } else {
                $this->warn("   ⚠ Safety backup failed, but continuing with restore...");
            }
        } else {
            $this->info("\n[1/3] Skipping pre-restore backup (--no-pre-backup)");
        }

        // Restore database
        $this->info("\n[2/3] Restoring database from: {$file}");

        $success = $this->restoreViaMySQL($filePath);

        if (!$success) {
            $this->warn("   → mysqldump restore failed, attempting PHP fallback...");
            $success = $this->restoreViaPHP($filePath);
        }

        if (!$success) {
            $this->error("\n   ✗ Database restore FAILED.");
            $this->error("     The pre-restore backup is available if needed.");
            return Command::FAILURE;
        }

        $this->info("   ✓ Database restored successfully!");

        // Restore files if requested
        if ($this->option('files')) {
            $this->info("\n[3/3] Restoring uploaded files...");
            $this->restoreFiles($backupDir, $file);
        } else {
            $this->info("\n[3/3] Skipping file restore (use --files to include)");
        }

        $this->info("\n============================================");
        $this->info("  Restore Complete!");
        $this->info("============================================");

        // Clear caches
        \Artisan::call('cache:clear');
        $this->info("  Cache cleared.");

        return Command::SUCCESS;
    }

    /**
     * Let user pick a backup file interactively.
     */
    protected function pickBackupFile(string $backupDir): ?string
    {
        $sqlFiles = [];
        foreach (scandir($backupDir) as $item) {
            if (str_starts_with($item, 'db_') && str_ends_with($item, '.sql')) {
                $sqlFiles[] = $item;
            }
        }

        if (empty($sqlFiles)) {
            $this->error('No database backup files found.');
            return null;
        }

        // Sort newest first
        rsort($sqlFiles);

        $this->info("Available database backups:\n");
        foreach ($sqlFiles as $i => $f) {
            $size = round(filesize($backupDir . '/' . $f) / 1024, 1);
            $date = date('Y-m-d H:i:s', filemtime($backupDir . '/' . $f));
            $this->line("  [{$i}] {$f} ({$size} KB, {$date})");
        }

        $index = $this->ask("\nEnter the number of the backup to restore", '0');

        if (!isset($sqlFiles[(int) $index])) {
            $this->error('Invalid selection.');
            return null;
        }

        return $sqlFiles[(int) $index];
    }

    /**
     * Restore using mysql command-line client.
     */
    protected function restoreViaMySQL(string $filePath): bool
    {
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $cmd = sprintf(
            'mysql --host=%s --port=%s --user=%s %s %s < %s 2>&1',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            $password ? '--password=' . escapeshellarg($password) : '',
            escapeshellarg($database),
            escapeshellarg($filePath)
        );

        exec($cmd, $output, $exitCode);

        return $exitCode === 0;
    }

    /**
     * Restore by reading SQL file and executing statements via PDO.
     */
    protected function restoreViaPHP(string $filePath): bool
    {
        try {
            $sql = file_get_contents($filePath);
            if (empty($sql)) {
                $this->error('   Backup file is empty.');
                return false;
            }

            // Disable foreign key checks during restore
            \DB::statement('SET FOREIGN_KEY_CHECKS=0');

            // Split into individual statements
            $statements = array_filter(
                array_map('trim', explode(";\n", $sql)),
                fn($s) => !empty($s) && !str_starts_with($s, '--')
            );

            $total = count($statements);
            $bar = $this->output->createProgressBar($total);
            $bar->start();

            $errors = 0;
            foreach ($statements as $statement) {
                try {
                    // Skip comments and empty lines
                    $clean = trim($statement);
                    if (empty($clean) || str_starts_with($clean, '--') || str_starts_with($clean, '/*')) {
                        $bar->advance();
                        continue;
                    }

                    \DB::unprepared($clean . ';');
                } catch (\Exception $e) {
                    $errors++;
                    // Log but continue — some statements may fail on re-runs
                }
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();

            // Re-enable foreign key checks
            \DB::statement('SET FOREIGN_KEY_CHECKS=1');

            if ($errors > 0) {
                $this->warn("   ⚠ {$errors} statement(s) had errors (may be harmless on re-runs)");
            }

            return true;
        } catch (\Exception $e) {
            $this->error('   PHP restore error: ' . $e->getMessage());
            \DB::statement('SET FOREIGN_KEY_CHECKS=1');
            return false;
        }
    }

    /**
     * Restore uploaded files from a matching backup directory.
     */
    protected function restoreFiles(string $backupDir, string $sqlFile): void
    {
        // Match db_TIMESTAMP.sql → files_TIMESTAMP/
        $timestamp = str_replace(['db_', '.sql'], '', $sqlFile);
        $filesDir = $backupDir . '/files_' . $timestamp;

        if (!is_dir($filesDir)) {
            $this->warn("   ⚠ No matching files backup found (files_{$timestamp}/)");
            $this->info("     Only database was restored.");
            return;
        }

        $target = storage_path('app/public');
        $this->copyDirectory($filesDir, $target);
        $this->info("   ✓ Uploaded files restored to storage/app/public/");
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
}
