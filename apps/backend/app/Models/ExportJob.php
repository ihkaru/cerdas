<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ExportJob — Tracks the lifecycle of an async CSV export task.
 *
 * Status flow: pending → processing → completed | failed
 *
 * @property string $id
 * @property string $table_id
 * @property int $user_id
 * @property string $status
 * @property int $version
 * @property string|null $file_path
 * @property int|null $total_rows
 * @property string|null $error_message
 * @property \Illuminate\Support\Carbon|null $expires_at
 * @property \App\Models\Table $table
 */
class ExportJob extends Model
{
    use HasUuids;

    protected $fillable = [
        'id',
        'table_id',
        'user_id',
        'status',
        'version',
        'file_path',
        'total_rows',
        'error_message',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    // =========================================================================
    // Relationships
    // =========================================================================

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // =========================================================================
    // Status Helpers
    // =========================================================================

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function markProcessing(): void
    {
        $this->update(['status' => 'processing']);
    }

    public function markCompleted(string $filePath, int $totalRows): void
    {
        $this->update([
            'status' => 'completed',
            'file_path' => $filePath,
            'total_rows' => $totalRows,
            'expires_at' => now()->addHour(), // File auto-expires in 1 hour
        ]);
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
        ]);
    }

    // =========================================================================
    // Cleanup: delete expired files from storage
    // =========================================================================

    public static function cleanupExpired(): int
    {
        $expired = static::where('status', 'completed')
            ->where('expires_at', '<', now())
            ->get();

        $count = 0;
        foreach ($expired as $job) {
            if ($job->file_path && \Illuminate\Support\Facades\Storage::exists($job->file_path)) {
                \Illuminate\Support\Facades\Storage::delete($job->file_path);
            }
            $job->delete();
            $count++;
        }

        return $count;
    }
}
