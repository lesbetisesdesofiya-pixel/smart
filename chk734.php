<?php
$file = 'C:\xampp\htdocs\smart\app\Http\Controllers\Api\ZernioWebhookController.php.bak';
$c = file_get_contents($file);
$lines = explode("\n", $c);
$line = $lines[733]; // line 734 (0-indexed)
echo "Hex: " . bin2hex(substr($line, 0, 100)) . "\n";
echo "Raw: " . substr($line, 0, 100) . "\n";
