<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_text(mixed $value, int $max): string {
    $text = is_string($value) ? trim($value) : '';
    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? '';
    return function_exists('mb_substr') ? mb_substr($text, 0, $max, 'UTF-8') : substr($text, 0, $max);
}

function valid_date(string $value): bool {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) return false;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date !== false && $date->format('Y-m-d') === $value;
}

function validate_state(mixed $raw): array {
    if (!is_array($raw)) respond(422, ['ok' => false, 'error' => 'Selecția transmisă nu este validă.']);
    $allowedItems = [
        'analytics_tools','seo_basic','seo_basic_monitor','seo_advanced','seo_pro',
        'google_search_setup','google_search_maintenance','google_search_daily','google_search_conversions',
        'shopping_setup','shopping_maintenance','shopping_daily','shopping_conversions',
        'google_call_setup','google_call_maintenance','google_call_daily','google_call_conversions',
        'meta_post_setup','meta_post_monitor','meta_post_daily','meta_catalog_setup','meta_catalog_monitor','meta_catalog_daily',
        'tiktok_post_setup','tiktok_post_monitor','tiktok_post_daily','tiktok_catalog_setup','tiktok_catalog_monitor','tiktok_catalog_daily',
        'google_business','store_ui','store_email','store_newsletter','store_status','store_billing','store_stock','store_spv',
        'excel_custom','blog_standard','blog_seo'
    ];
    $allowedSet = array_fill_keys($allowedItems, true);
    $monthly = array_fill_keys(['seo_advanced','seo_pro','google_search_maintenance','shopping_maintenance','google_call_maintenance'], true);
    $daily = array_fill_keys(['google_search_daily','shopping_daily','google_call_daily','meta_post_daily','meta_catalog_daily','tiktok_post_daily','tiktok_catalog_daily'], true);
    $packages = array_fill_keys(['store_100','store_500','store_1000','store_plus'], true);
    $exports = array_fill_keys(['stock','invoices','nir','orders','clients','subscribers','products','other'], true);

    $selected = [];
    if (isset($raw['selected']) && is_array($raw['selected'])) {
        foreach ($raw['selected'] as $id => $enabled) {
            if (isset($allowedSet[$id]) && $enabled === true) $selected[$id] = true;
        }
    }
    $months = [];
    if (isset($raw['months']) && is_array($raw['months'])) {
        foreach ($raw['months'] as $id => $count) {
            if (isset($monthly[$id]) && isset($selected[$id])) $months[$id] = max(1, min(24, (int)$count));
        }
    }
    if (isset($selected['seo_advanced'])) $months['seo_advanced'] = max(3, $months['seo_advanced'] ?? 3);
    if (isset($selected['seo_pro'])) $months['seo_pro'] = max(2, $months['seo_pro'] ?? 2);

    $dates = [];
    if (isset($raw['dates']) && is_array($raw['dates'])) {
        foreach ($raw['dates'] as $id => $values) {
            if (!isset($daily[$id], $selected[$id]) || !is_array($values)) continue;
            $clean = [];
            foreach (array_slice($values, 0, 366) as $value) if (is_string($value) && valid_date($value)) $clean[$value] = true;
            $dates[$id] = array_keys($clean);
            sort($dates[$id]);
        }
    }
    $startDates = [];
    $allowedStartIds = $allowedSet + array_fill_keys(['store_package','exports'], true);
    if (isset($raw['startDates']) && is_array($raw['startDates'])) {
        foreach ($raw['startDates'] as $id => $value) {
            if (isset($allowedStartIds[$id]) && is_string($value) && valid_date($value)) $startDates[$id] = $value;
        }
    }

    $exportSections = [];
    if (isset($raw['exportSections']) && is_array($raw['exportSections'])) {
        foreach ($raw['exportSections'] as $id) if (is_string($id) && isset($exports[$id])) $exportSections[$id] = true;
    }
    $startMonth = is_string($raw['startMonth'] ?? null) && preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $raw['startMonth']) ? $raw['startMonth'] : gmdate('Y-m');
    $storePackage = is_string($raw['storePackage'] ?? null) && isset($packages[$raw['storePackage']]) ? $raw['storePackage'] : '';

    if (!$storePackage) foreach (['store_ui','store_email','store_newsletter','store_status','store_billing','store_stock','store_spv'] as $id) unset($selected[$id]);
    if (isset($selected['store_status'])) $selected['store_email'] = true;
    if (isset($selected['store_spv'])) $selected['store_billing'] = true;
    if (!isset($selected['seo_basic'])) unset($selected['seo_basic_monitor']);
    if (isset($selected['seo_basic'])) { unset($selected['seo_advanced'], $selected['seo_pro']); }
    elseif (isset($selected['seo_advanced'])) unset($selected['seo_pro']);
    if (isset($selected['blog_standard'])) unset($selected['blog_seo']);

    foreach ($allowedItems as $id) if (!isset($selected[$id])) unset($startDates[$id]);
    if (!$storePackage) unset($startDates['store_package']);
    if (!$exportSections) unset($startDates['exports']);

    return [
        'version' => 1,
        'clientName' => clean_text($raw['clientName'] ?? '', 100) ?: 'ARRA Events by Monica Trif',
        'startMonth' => $startMonth,
        'selected' => $selected,
        'months' => $months,
        'dates' => $dates,
        'startDates' => $startDates,
        'storePackage' => $storePackage,
        'exportSections' => array_keys($exportSections),
        'notes' => clean_text($raw['notes'] ?? '', 1500)
    ];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET','POST'], true)) {
    header('Allow: GET, POST');
    respond(405, ['ok' => false, 'error' => 'Metodă neacceptată.']);
}

$documentRoot = realpath((string)($_SERVER['DOCUMENT_ROOT'] ?? '')) ?: dirname(__DIR__, 3);
$privateRoot = dirname($documentRoot) . DIRECTORY_SEPARATOR . 'arra_private' . DIRECTORY_SEPARATOR . 'service_configurator';
if (!is_dir($privateRoot) && !mkdir($privateRoot, 0700, true) && !is_dir($privateRoot)) respond(500, ['ok'=>false,'error'=>'Spațiul privat de salvare nu poate fi inițializat.']);
$stateFile = $privateRoot . DIRECTORY_SEPARATOR . 'current.json';
$historyFile = $privateRoot . DIRECTORY_SEPARATOR . 'history.jsonl';
$lockFile = $privateRoot . DIRECTORY_SEPARATOR . 'selection.lock';
$lock = fopen($lockFile, 'c+');
if ($lock === false) respond(500, ['ok'=>false,'error'=>'Salvarea nu poate fi inițializată.']);
@chmod($lockFile, 0600);

$readState = static function () use ($stateFile): array {
    if (!is_file($stateFile)) return ['revision'=>0,'updatedAt'=>null,'updatedBy'=>null,'state'=>null];
    $decoded = json_decode((string)file_get_contents($stateFile), true);
    return is_array($decoded) ? $decoded : ['revision'=>0,'updatedAt'=>null,'updatedBy'=>null,'state'=>null];
};

if ($method === 'GET') {
    flock($lock, LOCK_SH);
    $stored = $readState();
    flock($lock, LOCK_UN);
    fclose($lock);
    respond(200, ['ok'=>true] + $stored);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = strtolower(preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
if ($origin !== '') {
    $originHost = strtolower((string)parse_url($origin, PHP_URL_HOST));
    if ($originHost === '' || !hash_equals($host, $originHost)) respond(403, ['ok'=>false,'error'=>'Origine neacceptată.']);
}
$length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($length > 262144) respond(413, ['ok'=>false,'error'=>'Selecția transmisă este prea mare.']);
$input = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($input)) respond(400, ['ok'=>false,'error'=>'Date JSON invalide.']);
$clientId = clean_text($input['clientId'] ?? '', 80);
if ($clientId === '' || !preg_match('/^[A-Za-z0-9._-]+$/', $clientId)) respond(422, ['ok'=>false,'error'=>'Identificator de sesiune invalid.']);
$cleanState = validate_state($input['state'] ?? null);

flock($lock, LOCK_EX);
$current = $readState();
$record = [
    'revision' => ((int)($current['revision'] ?? 0)) + 1,
    'updatedAt' => gmdate('c'),
    'updatedBy' => $clientId,
    'state' => $cleanState
];
$json = json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$temp = $stateFile . '.tmp-' . bin2hex(random_bytes(5));
if (file_put_contents($temp, $json, LOCK_EX) === false || !rename($temp, $stateFile)) {
    @unlink($temp); flock($lock, LOCK_UN); fclose($lock); respond(500, ['ok'=>false,'error'=>'Selecția nu a putut fi salvată.']);
}
@chmod($stateFile, 0600);
if (is_file($historyFile) && filesize($historyFile) > 8 * 1024 * 1024) @rename($historyFile, $privateRoot . DIRECTORY_SEPARATOR . 'history-' . gmdate('Ymd-His') . '.jsonl');
$historyEntry = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
file_put_contents($historyFile, $historyEntry, FILE_APPEND | LOCK_EX);
@chmod($historyFile, 0600);
flock($lock, LOCK_UN);
fclose($lock);
respond(200, ['ok'=>true] + $record);
