<?php

namespace App\Http\Controllers\Api\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\MagicLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'zernio_public_url' => Setting::value('zernio_public_url', config('zernio.public_url', url('/'))),
                'fallback_public_url' => config('zernio.public_url', url('/')),
                'magic_link_base' => app(MagicLinkService::class)->baseUrl(),
            ],
        ]);
    }

    public function updateZernioPublicUrl(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'url' => ['required', 'string', 'max:500', 'url'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        Setting::set('zernio_public_url', rtrim($request->string('url')->toString(), '/'));

        return response()->json([
            'success' => true,
            'data' => [
                'zernio_public_url' => Setting::value('zernio_public_url'),
                'magic_link_base' => app(MagicLinkService::class)->baseUrl(),
            ],
        ]);
    }
}
