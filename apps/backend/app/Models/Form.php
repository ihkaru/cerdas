<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Form Model
 * 
 * A Form is a data collection schema within an App.
 * Previously known as "AppSchema".
 */
class Form extends Model {
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'app_id',
        'name',
        'slug',
        'description',
        'current_version',
        'settings',
        'published_at',
    ];

    protected $casts = [
        'settings' => 'array',
        'published_at' => 'datetime',
        'current_version' => 'integer',
    ];

    protected static function booted() {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    /**
     * Resolve the route binding for ID or UUID.
     */
    public function resolveRouteBinding($value, $field = null) {
        return $this->where('id', $value)
            ->orWhere('uuid', $value)
            ->firstOrFail();
    }

    // ========== Relationships ==========

    public function app(): BelongsTo {
        return $this->belongsTo(App::class);
    }

    public function versions(): HasMany {
        return $this->hasMany(FormVersion::class);
    }

    public function currentVersionModel(): HasOne {
        return $this->hasOne(FormVersion::class)
            ->where('version', $this->current_version);
    }

    public function latestVersion(): HasOne {
        return $this->hasOne(FormVersion::class)
            ->orderByDesc('version');
    }

    public function latestPublishedVersion(): HasOne {
        return $this->hasOne(FormVersion::class)
            ->whereNotNull('published_at')
            ->orderByDesc('version');
    }

    public function latestDraftVersion(): HasOne {
        return $this->hasOne(FormVersion::class)
            ->whereNull('published_at')
            ->orderByDesc('version');
    }

    // ========== Scopes ==========

    public function scopePublished($query) {
        return $query->whereNotNull('published_at');
    }

    public function scopeDraft($query) {
        return $query->whereNull('published_at');
    }

    // ========== Helpers ==========

    public function isPublished(): bool {
        return $this->published_at !== null;
    }

    public function isDraft(): bool {
        return $this->published_at === null;
    }

    /**
     * Create a new draft version based on latest version
     */
    public function createDraftVersion(): FormVersion {
        $latest = $this->latestVersion;
        $newVersion = ($latest ? $latest->version : 0) + 1;

        return $this->versions()->create([
            'version' => $newVersion,
            'schema' => $latest?->schema ?? ['fields' => []],
            'layout' => $latest?->layout ?? [],
            'published_at' => null,
        ]);
    }

    /**
     * Get the working version (draft if exists, else latest)
     */
    public function getWorkingVersion(): ?FormVersion {
        return $this->latestDraftVersion ?? $this->latestVersion;
    }
}
