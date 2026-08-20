<?php
$file = 'C:\xampp\htdocs\smart\app\Http\Controllers\Api\ZernioWebhookController.php.bak';
$c = file_get_contents($file);
$lines = explode("\n", $c);
echo "Line 632 hex: " . bin2hex(substr($lines[631], 0, 80)) . "\n";
echo "Line 632 raw: " . substr($lines[631], 0, 100) . "\n";
