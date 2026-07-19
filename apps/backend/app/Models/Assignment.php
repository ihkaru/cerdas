<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property \App\Models\Table $table
 */
class Assignment extends Model
{
    use HasFactory;
    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            if (empty($model->status_history)) {
                $model->recordStatusChange($model->status ?? 'in_progress');
            }
        });

        static::updating(function ($assignment) {
            if ($assignment->isDirty('status')) {
                $assignment->recordStatusChange($assignment->status);
            }
        });

        static::deleting(function ($assignment) {
            $table = null;

            if (is_object($assignment->tableVersion) && is_object($assignment->tableVersion->table)) {
                $table = $assignment->tableVersion->table;
            } elseif (is_object($assignment->table)) {
                $table = $assignment->table;
            } elseif (! empty($assignment->table_id)) {
                $table = Table::find($assignment->table_id);
            }

            if ($table && is_object($table) && ($table->source_type ?? null) === 'google_sheets') {
                $sheetConfig = $table->source_config['google_sheet'] ?? null;
                if ($sheetConfig && ! empty($sheetConfig['sync_enabled'])) {
                    $responses = Response::withTrashed()->where('assignment_id', $assignment->id)->get();
                    foreach ($responses as $response) {
                        \App\Jobs\GoogleSheetEnqueueRowJob::dispatch($response->id, 'delete');
                    }
                }
            }
        });
    }

    protected $fillable = [
        'table_id',          // Renamed from form_id
        'table_version_id',  // Renamed from form_version_id
        'organization_id',
        'supervisor_id',
        'enumerator_id',
        'external_id',
        'status',
        'status_history',
        'prelist_data',
    ];

    protected $casts = [
        'prelist_data' => 'array',
        'status_history' => 'array',
    ];

    /**
     * Record a status transition entry into status_history audit log.
     */
    public function recordStatusChange(?string $newStatus = null, ?User $user = null, ?string $note = null): void
    {
        $statusToRecord = $newStatus ?? $this->status ?? 'unknown';
        $userObj = $user ?? auth()->user();

        $history = $this->status_history ?? [];
        $history[] = [
            'status' => $statusToRecord,
            'timestamp' => now()->toISOString(),
            'user_id' => $userObj?->id ?? null,
            'user_email' => $userObj?->email ?? null,
            'user_name' => $userObj?->name ?? 'System',
            'note' => $note,
        ];

        $this->status_history = $history;
    }

    // ========== Relationships ==========

    /**
     * The Table this assignment belongs to.
     */
    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    /**
     * The specific TableVersion this assignment was created with.
     */
    public function tableVersion(): BelongsTo
    {
        return $this->belongsTo(TableVersion::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function enumerator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enumerator_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(Response::class);
    }

    // ========== Scopes ==========

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForEnumerator($query, string $userId)
    {
        return $query->where('enumerator_id', $userId);
    }

    public function scopeForSupervisor($query, string $userId)
    {
        return $query->where('supervisor_id', $userId);
    }

    // ========== Helpers ==========

    public function markInProgress(): void
    {
        if ($this->status === 'assigned') {
            $this->update(['status' => 'in_progress']);
        }
    }

    public function markApproved(): void
    {
        $this->update(['status' => 'approved']);
    }

    /**
     * Get the active TableVersion for this assignment's Table.
     */
    public function getActiveTableVersion(): ?TableVersion
    {
        return $this->table?->latestPublishedVersion;
    }
}
