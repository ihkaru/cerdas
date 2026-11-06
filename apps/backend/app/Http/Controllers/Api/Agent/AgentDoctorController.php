<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Models\App;
use App\Services\SurveyDoctorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentDoctorController extends Controller
{
    /**
     * Inspect all surveys and return a global readiness audit report.
     *
     * GET /api/agent/v1/apps/doctor
     */
    public function index(Request $request, SurveyDoctorService $doctor): JsonResponse
    {
        $status = $request->input('status', 'active'); // active, all, trashed
        $query = App::query();

        if ($status === 'trashed') {
            $query->onlyTrashed();
        } elseif ($status === 'all') {
            $query->withTrashed();
        } else {
            $query->where('is_active', true);
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $apps = $query->orderBy('name')->get();
        $report = $doctor->diagnoseAll($apps);

        return response()->json([
            'success' => true,
            'message' => 'Global survey readiness audit completed',
            'data' => $report,
        ]);
    }

    /**
     * Inspect a single survey and return a granular GSBPM readiness scorecard.
     *
     * GET /api/agent/v1/apps/{app}/doctor
     */
    public function show(Request $request, string $appId, SurveyDoctorService $doctor): JsonResponse
    {
        $app = App::withTrashed()->where('id', $appId)->orWhere('slug', $appId)->firstOrFail();
        $scorecard = $doctor->diagnoseApp($app);

        return response()->json([
            'success' => true,
            'message' => "Readiness audit completed for {$app->name}",
            'data' => $scorecard,
        ]);
    }
}
