<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * PendingSheetRow Model
 *
 * Staging table for micro-batch Google Sheets sync.
 * Rows are inserted here when a Response is created/updated/deleted,
 * then consumed and flushed to Google Sheets in batches every 30 seconds.
 *
 * This avoids per-response Google Sheets API calls which would hit rate limits
 * at scale (Google allows 60 req/min/user/project).
 *
 * @property int $id
 * @property string $spreadsheet_id
 * @property string $sheet_name
 * @property string $tab_type 'root' | 'nested'
 * @property string $app_id
 * @property string $table_id
 * @property string $response_id
 * @property string $operation 'upsert' | 'delete'
 * @property array|null $row_data
 * @property \Illuminate\Support\Carbon $created_at
 */
class PendingSheetRow extends Model
{
    // Only created_at — rows are inserted and deleted, never updated
    public $timestamps = false;

    protected $fillable = [
        'spreadsheet_id',
        'sheet_name',
        'tab_type',
        'app_id',
        'table_id',
        'response_id',
        'operation',
        'row_data',
    ];

    protected $casts = [
        'row_data' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Boot model to auto-set created_at since timestamps=false.
     */
    protected static function booted(): void
    {
        static::creating(function (self $model) {
            $model->created_at = now();
        });
    }
}
