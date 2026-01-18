<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Response extends Model {
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'assignment_id',
        'parent_response_id',
        'data',
        'local_id',
        'device_id',
        'synced_at',
    ];

    protected $casts = [
        'data' => 'array',
        'synced_at' => 'datetime',
    ];

    // ========== Boot ==========

    protected static function boot() {
        parent::boot();

        static::creating(function ($response) {
            // Auto-generate local_id if not provided
            if (empty($response->local_id)) {
                $response->local_id = (string) Str::uuid();
            }
        });
    }

    // ========== Relationships ==========

    public function assignment(): BelongsTo {
        return $this->belongsTo(Assignment::class);
    }

    public function parentResponse(): BelongsTo {
        return $this->belongsTo(Response::class, 'parent_response_id');
    }

    public function childResponses(): HasMany {
        return $this->hasMany(Response::class, 'parent_response_id');
    }

    // ========== Scopes ==========

    public function scopeSynced($query) {
        return $query->whereNotNull('synced_at');
    }

    public function scopeUnsynced($query) {
        return $query->whereNull('synced_at');
    }

    public function scopeRootLevel($query) {
        return $query->whereNull('parent_response_id');
    }

    // ========== Helpers ==========

    public function isSynced(): bool {
        return $this->synced_at !== null;
    }

    public function isNested(): bool {
        return $this->parent_response_id !== null;
    }

    public function markSynced(): void {
        $this->update(['synced_at' => now()]);
    }

    /**
     * Get a specific field value from data
     */
    public function getField(string $key, $default = null) {
        return data_get($this->data, $key, $default);
    }

    /**
     * Set a specific field value in data
     */
    public function setField(string $key, $value): void {
        $data = $this->data ?? [];
        data_set($data, $key, $value);
        $this->update(['data' => $data]);
    }
}
