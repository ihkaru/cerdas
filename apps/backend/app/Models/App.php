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
 * An App is a container for multiple Forms.
 * Previously known as "Project".
 */
class App extends Model {
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'created_by',
        'is_active',
        'navigation',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'navigation' => 'array',
    ];

    // ========== Relationships ==========

    public function creator(): BelongsTo {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function memberships(): HasMany {
        return $this->hasMany(AppMembership::class);
    }

    public function organizations(): HasMany {
        return $this->hasMany(Organization::class, 'project_id');
    }

    public function members(): BelongsToMany {
        return $this->belongsToMany(User::class, 'app_memberships')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function forms(): HasMany {
        return $this->hasMany(Form::class);
    }

    public function views(): HasMany {
        return $this->hasMany(View::class);
    }

    // ========== Scopes ==========

    public function scopeActive($query) {
        return $query->where('is_active', true);
    }

    protected static function booted() {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Resolve the route binding for ID, Slug, or UUID.
     */
    public function resolveRouteBinding($value, $field = null) {
        return $this->where('id', $value)
            ->orWhere('slug', $value)
            ->orWhere('uuid', $value)
            ->firstOrFail();
    }

    // ========== Helpers ==========

    public function getFormCount(): int {
        return $this->forms()->count();
    }

    public function getMemberCount(): int {
        return $this->memberships()->count();
    }
}
