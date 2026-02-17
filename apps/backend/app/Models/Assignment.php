<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

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
        'prelist_data',
    ];

    protected $casts = [
        'prelist_data' => 'array',
    ];

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

    public function markCompleted(): void
    {
        if ($this->status !== 'synced') {
            $this->update(['status' => 'completed']);
        }
    }

    public function markSynced(): void
    {
        $this->update(['status' => 'synced']);
    }

    /**
     * Get the active TableVersion for this assignment's Table.
     */
    public function getActiveTableVersion(): ?TableVersion
    {
        return $this->table?->latestPublishedVersion;
    }
}
