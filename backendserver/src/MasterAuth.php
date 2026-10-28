<?php
declare(strict_types=1);

namespace LifeOS;

/**
 * Master Worker authentication: HMAC-SHA256 signature over
 * "{timestamp}.{method}.{path}.{sha256(body)}" using the shared master_key.
 * The key never appears in browser code. Optional IP allowlist applies.
 */
final class MasterAuth
{
    public static function verify(string $method, string $path): void
    {
        $allow = Config::get('master_ip_allowlist', []);
        if ($allow && !in_array(Http::ip(), $allow, true)) {
            self::audit('auth', $path, false, 'IP not allowed');
            throw new HttpError('Forbidden', 403);
        }
        $ts = $_SERVER['HTTP_X_MASTER_TS'] ?? '';
        $sig = $_SERVER['HTTP_X_MASTER_SIG'] ?? '';
        if (!$ts || !$sig || abs(time() - (int) $ts) > 300) {
            self::audit('auth', $path, false, 'bad timestamp');
            throw new HttpError('Invalid signature', 401);
        }
        $base = "$ts.$method.$path." . hash('sha256', Http::rawBody());
        $ok = false;
        foreach (self::keys() as $key) {
            if (hash_equals(hash_hmac('sha256', $base, $key), $sig)) { $ok = true; }
        }
        if (!$ok) {
            self::audit('auth', $path, false, 'bad signature');
            throw new HttpError('Invalid signature', 401);
        }
    }

    /** All accepted keys: config master_key, config master_keys, and master-keys.json beside backendserver/. */
    public static function keys(): array
    {
        $keys = array_merge([(string) Config::get('master_key', '')], (array) Config::get('master_keys', []));
        foreach ([dirname(__DIR__, 2) . '/master-keys.json', dirname(__DIR__) . '/storage/master-keys.json'] as $file) {
            if (is_file($file)) {
                $data = json_decode((string) file_get_contents($file), true);
                $keys = array_merge($keys, array_values((array) ($data['keys'] ?? [])));
            }
        }
        return array_values(array_filter(array_unique(array_map('strval', $keys)), fn($k) => $k !== '' && $k !== 'change-me-master-key'));
    }

    public static function audit(string $action, ?string $target, bool $ok, ?string $detail = null): void
    {
        try {
            DB::run('INSERT INTO lo_master_audit (action, target, ip, ok, detail) VALUES (?,?,?,?,?)',
                [$action, $target, Http::ip(), $ok ? 1 : 0, $detail]);
        } catch (\Throwable) { /* audit must never break the request */ }
    }
}
