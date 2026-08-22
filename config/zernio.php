<?php

return [

    'api_key' => env('ZERNIO_API_KEY'),

    'base_url' => env('ZERNIO_BASE_URL', 'https://zernio.com/api'),

    'webhook_secret' => env('ZERNIO_WEBHOOK_SECRET'),

    'timeout' => env('ZERNIO_TIMEOUT', 30),

    'php_binary' => env('ZERNIO_PHP_BINARY', PHP_BINARY),

    'public_url' => env('ZERNIO_PUBLIC_URL', 'https://classinote.sofiya.cc'),

];
