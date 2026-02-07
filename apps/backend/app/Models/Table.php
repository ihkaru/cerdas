<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Table Model
 * 
 * A Table is a data source with field definitions.
 * Previously known as "Form" or "AppSchema".
 */
class Table extends Model {
    use HasFactory, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted() {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected $table = 'tables';

    protected $fillable = [
        'app_id',
        'name',
        'slug',
        'description',
        'current_version',
        'settings',
        'source_type',   // internal, google_sheets, airtable, api
        'source_config', // connection details
        'published_at',
    ];

    protected $casts = [
        'settings' => 'array',
        'source_config' => 'array',
        'published_at' => 'datetime',
        'current_version' => 'integer',
    ];



    /**
     * Resolve the route binding for ID or UUID.
     */
    public function resolveRouteBinding($value, $field = null) {
        return $this->where('id', $value)
            ->firstOrFail();
    }

    // ========== Relationships ==========

    public function app(): BelongsTo {
        return $this->belongsTo(App::class);
    }

    public function versions(): HasMany {
        return $this->hasMany(TableVersion::class);
    }

    public function assignments(): HasMany {
        return $this->hasMany(Assignment::class);
    }

    public function views(): HasMany {
        return $this->hasMany(View::class);
    }

    public function currentVersionModel(): HasOne {
        return $this->hasOne(TableVersion::class)
            ->where('version', $this->current_version);
    }

    public function latestVersion(): HasOne {
        return $this->hasOne(TableVersion::class)
            ->orderByDesc('version');
    }

    public function latestPublishedVersion(): HasOne {
        return $this->hasOne(TableVersion::class)
            ->whereNotNull('published_at')
            ->orderByDesc('version');
    }

    public function latestDraftVersion(): HasOne {
        return $this->hasOne(TableVersion::class)
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
    public function createDraftVersion(): TableVersion {
        $latest = $this->latestVersion;
        $newVersion = ($latest ? $latest->version : 0) + 1;

        return $this->versions()->create([
            'version' => $newVersion,
            'fields' => $latest?->fields ?? [], // schema renamed to fields
            'layout' => $latest?->layout ?? [],
            'published_at' => null,
        ]);
    }

    /**
     * Get the working version (draft if exists, else latest)
     */
    public function getWorkingVersion(): ?TableVersion {
        return $this->latestDraftVersion ?? $this->latestVersion;
    }
}
