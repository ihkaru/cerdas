<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Organization Model
 *
 * A GLOBAL entity representing an organization (e.g., "BPS Kab. Bandung").
 * Organizations can participate in multiple Apps via app_organizations pivot.
 * Only Super Admin can create Organizations.
 */
class Organization extends Model
{
    use HasFactory, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'name',
        'code',
        'metadata',
        'creator_id',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // ========== Relationships ==========

    /**
     * The user who created this organization (if any).
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Apps that this organization participates in.
     * Many-to-Many via app_organizations pivot.
     */
    public function apps(): BelongsToMany
    {
        return $this->belongsToMany(App::class, 'app_organizations')
            ->withPivot('settings')
            ->withTimestamps();
    }

    /**
     * Memberships of users in this organization (per App).
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(AppMembership::class);
    }

    /**
     * Users who are members of this organization.
     * New: Reusable Teams logic.
     */
    public function members(): BelongsToMany
    {
        // Pivot table organization_members
        return $this->belongsToMany(User::class, 'organization_members')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(OrganizationInvitation::class);
    }

    /**
     * Assignments owned by this organization.
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    // ========== Scopes ==========

    public function scopeOwnedBy($query, $user)
    {
        return $query->where('creator_id', $user->id);
    }

    // ========== Helpers ==========

    /**
     * Get enumerators for this organization within a specific App.
     */
    public function getEnumerators(?int $appId = null)
    {
        $query = $this->memberships()->where('role', 'enumerator')->with('user');
        if ($appId) {
            $query->where('app_id', $appId);
        }

        return $query->get();
    }

    /**
     * Get supervisors for this organization within a specific App.
     */
    public function getSupervisors(?int $appId = null)
    {
        $query = $this->memberships()->where('role', 'supervisor')->with('user');
        if ($appId) {
            $query->where('app_id', $appId);
        }

        return $query->get();
    }
}
