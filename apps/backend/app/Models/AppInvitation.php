<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AppInvitation extends Model {
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted() {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            if (empty($model->token)) {
                $model->token = (string) Str::uuid(); // Use UUID as token for now, or Str::random
            }
        });
    }

    protected $fillable = [
        'app_id',
        'email',
        'role',
        'token',
        'created_by',
    ];

    // ========== Relationships ==========

    public function app(): BelongsTo {
        return $this->belongsTo(App::class);
    }

    public function creator(): BelongsTo {
        return $this->belongsTo(User::class, 'created_by');
    }
}
