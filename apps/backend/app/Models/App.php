<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * App Model
 *
 * An App is a container for multiple Tables.
 * Previously known as "Project".
 */
class App extends Model
{
    use HasFactory;
    use SoftDeletes;

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
        'slug',
        'description',
        'created_by',
        'is_active',
        'mode',
        'navigation',
        'view_configs',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'navigation' => 'array',
        'view_configs' => 'array',
        'settings' => 'array',
    ];

    // ========== Relationships ==========

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(AppMembership::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(AppInvitation::class);
    }

    /**
     * Organizations participating in this App.
     * Many-to-Many via app_organizations pivot.
     */
    public function organizations(): BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'app_organizations')
            ->withPivot('settings')
            ->withTimestamps();
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'app_memberships')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function tables(): HasMany
    {
        return $this->hasMany(Table::class);
    }

    public function views(): HasMany
    {
        return $this->hasMany(View::class);
    }

    // ========== Scopes ==========

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Resolve the route binding for ID, Slug, or UUID.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('id', $value)
            ->orWhere('slug', $value)
            ->firstOrFail();
    }

    // ========== Helpers ==========

    public function getTableCount(): int
    {
        return $this->tables()->count();
    }

    public function getMemberCount(): int
    {
        return $this->memberships()->count();
    }

    /**
     * Check if this App is in Simple mode (direct membership).
     */
    public function isSimpleMode(): bool
    {
        return $this->mode === 'simple';
    }

    /**
     * Check if this App is in Complex mode (organization-based membership).
     */
    public function isComplexMode(): bool
    {
        return $this->mode === 'complex';
    }
}
