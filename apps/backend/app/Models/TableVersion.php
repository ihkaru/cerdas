<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * TableVersion Model
 * 
 * A version of a Table's fields and layout.
 * Previously known as "FormVersion" or "AppSchemaVersion".
 */
class TableVersion extends Model {
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $table = 'table_versions';

    protected static function booted() {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'table_id', // Renamed from form_id
        'version',
        'fields',   // Renamed from schema
        'layout',
        'changelog',
        'published_at',
    ];

    protected $casts = [
        'fields' => 'array',
        'layout' => 'array',
        'published_at' => 'datetime',
        'version' => 'integer',
    ];

    // ========== Relationships ==========

    public function table(): BelongsTo {
        return $this->belongsTo(Table::class);
    }

    // assignments relation removed as Assignments now link directly to Table

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
     * Publish this version (makes it immutable)
     */
    public function publish(?string $changelog = null): bool {
        if ($this->isPublished()) {
            return false; // Already published, immutable
        }

        $this->update([
            'published_at' => now(),
            'changelog' => $changelog,
        ]);

        // Update parent table's current version
        // Note: Can't use $this->table as it conflicts with Model's $table property
        $parentTable = Table::find($this->table_id);
        if ($parentTable) {
            $parentTable->update([
                'current_version' => $this->version,
                'published_at' => now(),
            ]);
        }

        return true;
    }

    /**
     * Get field definitions
     */
    public function getFields(): array {
        return $this->fields ?? [];
    }

    /**
     * Update field definitions
     */
    public function setFields(array $fields): void {
        $this->fields = $fields;
    }
}
