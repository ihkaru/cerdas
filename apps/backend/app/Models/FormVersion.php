<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * FormVersion Model
 * 
 * A version of a Form's schema and layout.
 * Previously known as "AppSchemaVersion".
 */
class FormVersion extends Model {
    use HasFactory;

    protected $fillable = [
        'form_id',
        'version',
        'schema',
        'layout',
        'changelog',
        'published_at',
    ];

    protected $casts = [
        'schema' => 'array',
        'layout' => 'array',
        'published_at' => 'datetime',
        'version' => 'integer',
    ];

    // ========== Relationships ==========

    public function form(): BelongsTo {
        return $this->belongsTo(Form::class);
    }

    public function assignments(): HasMany {
        return $this->hasMany(Assignment::class);
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

        // Update parent form's current version
        $this->form->update([
            'current_version' => $this->version,
            'published_at' => now(),
        ]);

        return true;
    }

    /**
     * Get field definitions from schema
     */
    public function getFields(): array {
        return $this->schema['fields'] ?? [];
    }

    /**
     * Update field definitions in schema
     */
    public function setFields(array $fields): void {
        $schema = $this->schema ?? [];
        $schema['fields'] = $fields;
        $this->schema = $schema;
    }
}
