<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Field extends Model {
    use HasFactory;

    /**
     * Supported field types
     */
    public const TYPES = [
        'text',
        'textarea',
        'number',
        'date',
        'datetime',
        'time',
        'select',
        'radio',
        'checkbox',
        'toggle',
        'image',
        'gps',
        'signature',
        'nested',
        'lookup',
        'calculated',
    ];

    protected $fillable = [
        'app_schema_version_id',
        'parent_field_id',
        'name',
        'label',
        'type',
        'config',
        'default_value',
        'is_required',
        'is_readonly',
        'is_hidden',
        'validation_js',
        'show_if_js',
        'editable_if_js',
        'computed_js',
        'order',
        'group',
        'description',
        'placeholder',
    ];

    protected $casts = [
        'config' => 'array',
        'default_value' => 'array',
        'is_required' => 'boolean',
        'is_readonly' => 'boolean',
        'is_hidden' => 'boolean',
        'order' => 'integer',
    ];

    // ========== Relationships ==========

    public function schemaVersion(): BelongsTo {
        return $this->belongsTo(AppSchemaVersion::class, 'app_schema_version_id');
    }

    public function parentField(): BelongsTo {
        return $this->belongsTo(Field::class, 'parent_field_id');
    }

    public function childFields(): HasMany {
        return $this->hasMany(Field::class, 'parent_field_id')->orderBy('order');
    }

    public function options(): HasMany {
        return $this->hasMany(FieldOption::class)->orderBy('order');
    }

    // ========== Scopes ==========

    public function scopeRootLevel($query) {
        return $query->whereNull('parent_field_id');
    }

    public function scopeOrdered($query) {
        return $query->orderBy('order');
    }

    // ========== Helpers ==========

    public function isType(string $type): bool {
        return $this->type === $type;
    }

    public function hasOptions(): bool {
        return in_array($this->type, ['select', 'radio', 'checkbox']);
    }

    public function isNested(): bool {
        return $this->type === 'nested';
    }

    public function isCalculated(): bool {
        return $this->type === 'calculated' || !empty($this->computed_js);
    }

    public function hasValidation(): bool {
        return !empty($this->validation_js);
    }

    public function hasConditionalVisibility(): bool {
        return !empty($this->show_if_js);
    }

    public function hasConditionalEditability(): bool {
        return !empty($this->editable_if_js);
    }

    /**
     * Get config value with default
     */
    public function getConfig(string $key, $default = null) {
        return data_get($this->config, $key, $default);
    }

    /**
     * Convert to client-friendly format
     */
    public function toClientFormat(): array {
        return [
            'name' => $this->name,
            'label' => $this->label,
            'type' => $this->type,
            'config' => $this->config ?? [],
            'defaultValue' => $this->default_value,
            'isRequired' => $this->is_required,
            'isReadonly' => $this->is_readonly,
            'isHidden' => $this->is_hidden,
            'validationJs' => $this->validation_js,
            'showIfJs' => $this->show_if_js,
            'editableIfJs' => $this->editable_if_js,
            'computedJs' => $this->computed_js,
            'group' => $this->group,
            'description' => $this->description,
            'placeholder' => $this->placeholder,
            'options' => $this->hasOptions()
                ? $this->options->map->toClientFormat()->toArray()
                : null,
            'children' => $this->isNested()
                ? $this->childFields->map->toClientFormat()->toArray()
                : null,
        ];
    }
}
