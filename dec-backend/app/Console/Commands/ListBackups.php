<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * List all available backups with size and date.
 */
class ListBackups extends Command
{
    protected $signature = 'backup:list';
    protected $description = 'List all available backups';

    public function handle(): int
    {
        $backupDir = storage_path('app/backups');

        if (!is_dir($backupDir)) {
            $this->warn('No backups found. Run "php artisan backup:run" to create one.');
            return Command::SUCCESS;
        }

        $files = scandir($backupDir);
        $backups = [];

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;

            $path = $backupDir . '/' . $file;
            $isDir = is_dir($path);
            $size = $isDir ? $this->directorySize($path) : filesize($path);
            $date = date('Y-m-d H:i:s', filemtime($path));

            $backups[] = [
                'name' => $file,
                'type' => $isDir ? 'Files' : 'Database',
                'size' => $this->formatBytes($size),
                'date' => $date,
            ];
        }

        if (empty($backups)) {
            $this->warn('No backups found. Run "php artisan backup:run" to create one.');
            return Command::SUCCESS;
        }

        // Sort by date descending
        usort($backups, fn($a, $b) => strcmp($b['date'], $a['date']));

        $this->info("Available Backups (storage/app/backups/):\n");
        $this->table(['Name', 'Type', 'Size', 'Created'], $backups);

        return Command::SUCCESS;
    }

    protected function directorySize(string $dir): int
    {
        $size = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            $size += $file->getSize();
        }
        return $size;
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024) return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }
}
