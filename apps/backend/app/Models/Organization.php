<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model {
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'name',
        'code',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // ========== Relationships ==========

    // ========== Relationships ==========

    /**
     * Get the App that owns the Organization.
     * Note: Database column is still 'project_id' for now.
     */
    public function app(): BelongsTo {
        return $this->belongsTo(App::class, 'project_id');
    }

    public function memberships(): HasMany {
        return $this->hasMany(AppMembership::class);
    }

    public function assignments(): HasMany {
        return $this->hasMany(Assignment::class);
    }

    // ========== Helpers ==========

    public function getEnumerators() {
        return $this->memberships()->where('role', 'enumerator')->with('user')->get();
    }

    public function getSupervisors() {
        return $this->memberships()->where('role', 'supervisor')->with('user')->get();
    }
}
