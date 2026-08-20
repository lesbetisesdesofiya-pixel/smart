<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | This option controls the default broadcaster that will be used by the
    | framework when an event needs to be broadcast. You may set this to any
    | connection which is configured in your "connections" configuration.
    |
    | Supported: "reverb", "pusher", "ably", "redis", "log", "null"
    |
    */

    'default' => env('BROADCAST_CONNECTION', 'log'),

    /*
    |--------------------------------------------------------------------------
    | Broadcast Connections
    |--------------------------------------------------------------------------
    |
    | Here you may configure all of the broadcast connections that will be used
    | by your application. An example broadcast configuration is provided for
    | each connection supported by the framework. You're also welcome to add
    | additional connections that may be needed.
    |
    */

    'connections' => [

        'reverb' => [
            'driver' => 'reverb',
            'app_id' => env('REVERB_APP_ID'),
            'app_key' => env('REVERB_APP_KEY'),
            'app_secret' => env('REVERB_APP_SECRET'),
            'host' => env('REVERB_HOST', 'reverb.laravel.com'),
            'port' => (int) env('REVERB_PORT', 443),
            'scheme' => env('REVERB_SCHEME', 'https'),
            'use_tunnel' => env('REVERB_USE_TUNNEL', false),
        ],

        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            'options' => [
                'host' => env('PUSHER_HOST') ?: 'api-' . env('PUSHER_APP_CLUSTER', 'mt1') . '.pusher.com',
                'port' => (int) env('PUSHER_PORT', 443),
                'scheme' => env('PUSHER_SCHEME', 'https'),
                'use_tunnel' => env('PUSHER_USE_TUNNEL', false),
            ],
            'prefix' => '',
        ],

        'ably' => [
            'driver' => 'ably',
            'key' => env('ABLY_KEY'),
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => env('BROADCAST_REDIS_CONNECTION', 'default'),
        ],

        'log' => [
            'driver' => 'log',
            'connection' => env('BROADCAST_LOG_CONNECTION', 'stack'),
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Broadcast Channels
    |--------------------------------------------------------------------------
    |
    | All broadcast channels are defined in your Channel's authorization
    | logic. You may define as many channels as you need, with each channel
    | having its own authorization logic that determines whether the user
    | can listen on the given channel.
    |
    */

    'channels' => [],

];
