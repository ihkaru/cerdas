<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * AppOrganization Pivot Model
 * 
 * Links Organizations to Apps (Many-to-Many).
 * Each Organization can participate in multiple Apps.
 * Each App can have multiple Organizations.
 */
class AppOrganization extends Pivot {
    public $incrementing = true;

    protected $table = 'app_organizations';

    protected $fillable = [
        'app_id',
        'organization_id',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    // ========== Relationships ==========

    public function app(): BelongsTo {
        return $this->belongsTo(App::class);
    }

    public function organization(): BelongsTo {
        return $this->belongsTo(Organization::class);
    }
}
