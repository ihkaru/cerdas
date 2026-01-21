<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Assignment extends Model {
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'form_id',
        'form_version_id',
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
     * The Form this assignment belongs to.
     * Assignment follows the active FormVersion automatically.
     */
    public function form(): BelongsTo {
        return $this->belongsTo(Form::class);
    }

    /**
     * Legacy: Direct link to a specific FormVersion.
     * Kept for backward compatibility during migration.
     */
    public function formVersion(): BelongsTo {
        return $this->belongsTo(FormVersion::class, 'form_version_id');
    }

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }

    public function supervisor(): BelongsTo {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function enumerator(): BelongsTo {
        return $this->belongsTo(User::class, 'enumerator_id');
    }

    public function responses(): HasMany {
        return $this->hasMany(Response::class);
    }

    // ========== Scopes ==========

    public function scopeStatus($query, string $status) {
        return $query->where('status', $status);
    }

    public function scopeForEnumerator($query, int $userId) {
        return $query->where('enumerator_id', $userId);
    }

    public function scopeForSupervisor($query, int $userId) {
        return $query->where('supervisor_id', $userId);
    }

    // ========== Helpers ==========

    public function markInProgress(): void {
        if ($this->status === 'assigned') {
            $this->update(['status' => 'in_progress']);
        }
    }

    public function markCompleted(): void {
        if ($this->status !== 'synced') {
            $this->update(['status' => 'completed']);
        }
    }

    public function markSynced(): void {
        $this->update(['status' => 'synced']);
    }

    /**
     * Get the active FormVersion for this assignment's Form.
     */
    public function getActiveFormVersion(): ?FormVersion {
        return $this->form?->activeVersion;
    }
}
