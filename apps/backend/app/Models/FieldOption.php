<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FieldOption extends Model {
    use HasFactory;

    protected $fillable = [
        'field_id',
        'value',
        'label',
        'order',
        'is_active',
        'show_if_js',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    // ========== Relationships ==========

    public function field(): BelongsTo {
        return $this->belongsTo(Field::class);
    }

    // ========== Scopes ==========

    public function scopeActive($query) {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query) {
        return $query->orderBy('order');
    }

    // ========== Helpers ==========

    public function hasConditionalVisibility(): bool {
        return !empty($this->show_if_js);
    }

    /**
     * Convert to client-friendly format
     */
    public function toClientFormat(): array {
        return [
            'value' => $this->value,
            'label' => $this->label,
            'showIfJs' => $this->show_if_js,
        ];
    }
}
