<?php
declare(strict_types=1);

namespace LifeOS;

define('LIFEOS_ROOT', dirname(__DIR__));

spl_autoload_register(function (string $class): void {
    if (strncmp($class, 'LifeOS\\', 7) !== 0) return;
    $file = __DIR__ . '/' . str_replace('\\', '/', substr($class, 7)) . '.php';
    if (is_file($file)) require $file;
});

final class Config
{
    private static ?array $c = null;
    public static function get(string $key, mixed $default = null): mixed
    {
        if (self::$c === null) {
            $f = LIFEOS_ROOT . '/config.php';
            $env = self::env();
            if (!is_file($f) && !$env) throw new HttpError('Server not configured: create config.php or .env', 500);
            self::$c = is_file($f) ? (require $f) : [];
            // .env values (project root or backendserver/) override config.php.
            $map = ['LIFEOS_DB_HOST' => ['db', 'host'], 'LIFEOS_DB_PORT' => ['db', 'port'], 'LIFEOS_DB_NAME' => ['db', 'name'],
                'LIFEOS_DB_USER' => ['db', 'user'], 'LIFEOS_DB_PASS' => ['db', 'pass'],
                'LIFEOS_APP_SECRET' => ['app_secret'], 'LIFEOS_MASTER_KEY' => ['master_key']];
            foreach ($map as $k => $path) {
                if (!isset($env[$k]) || $env[$k] === '') continue;
                $v = $k === 'LIFEOS_DB_PORT' ? (int) $env[$k] : $env[$k];
                if (count($path) === 2) self::$c[$path[0]][$path[1]] = $v; else self::$c[$path[0]] = $v;
            }
        }
        return self::$c[$key] ?? $default;
    }

    /** Reads KEY="value" lines from .env beside or above backendserver/. */
    public static function env(): array
    {
        $out = [];
        foreach ([dirname(LIFEOS_ROOT) . '/.env', LIFEOS_ROOT . '/.env'] as $file) {
            if (!is_file($file)) continue;
            foreach (file($file, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
                if (!preg_match('/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/', $line, $m)) continue;
                $out[$m[1]] = trim(trim($m[2]), "\"'");
            }
        }
        return $out;
    }
}

final class HttpError extends \RuntimeException
{
    public function __construct(string $msg, public int $status = 400) { parent::__construct($msg); }
}

final class DB
{
    private static ?\PDO $pdo = null;
    public static function pdo(): \PDO
    {
        if (self::$pdo) return self::$pdo;
        $c = Config::get('db');
        $name = Migrations::databaseName((string) $c['name']);
        $dsn = "mysql:host={$c['host']};port={$c['port']};charset=utf8mb4";
        $options = [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION, \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC, \PDO::ATTR_EMULATE_PREPARES => false];
        try {
            $pdo = new \PDO($dsn . ";dbname={$c['name']}", $c['user'], $c['pass'], $options);
        } catch (\PDOException $e) {
            // Only unknown-database errors permit creation; never mask password/host errors.
            if ((int) ($e->errorInfo[1] ?? 0) !== 1049 || !Config::get('auto_setup', true)) throw $e;
            $pdo = new \PDO($dsn, $c['user'], $c['pass'], $options);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS $name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE $name");
        }
        $pdo->exec("SET time_zone = '+06:00'");
        if (Config::get('auto_setup', true)) Migrations::apply($pdo);
        self::$pdo = $pdo;
        return self::$pdo;
    }
    public static function all(string $sql, array $p = []): array { $s = self::pdo()->prepare($sql); $s->execute($p); return $s->fetchAll(); }
    public static function one(string $sql, array $p = []): ?array { $s = self::pdo()->prepare($sql); $s->execute($p); $r = $s->fetch(); return $r ?: null; }
    public static function val(string $sql, array $p = []): mixed { $s = self::pdo()->prepare($sql); $s->execute($p); return $s->fetchColumn(); }
    public static function run(string $sql, array $p = []): int { $s = self::pdo()->prepare($sql); $s->execute($p); return $s->rowCount(); }
    public static function insert(string $sql, array $p = []): int { self::run($sql, $p); return (int) self::pdo()->lastInsertId(); }
    /** Runs $fn in a transaction; rolls back on any error. Safe to nest (uses savepoints). */
    public static function tx(callable $fn): mixed
    {
        $pdo = self::pdo();
        if ($pdo->inTransaction()) {
            $level = ++self::$txLevel;
            $pdo->exec("SAVEPOINT sp_$level");
            try { $r = $fn(); $pdo->exec("RELEASE SAVEPOINT sp_$level"); return $r; }
            catch (\Throwable $e) { $pdo->exec("ROLLBACK TO SAVEPOINT sp_$level"); throw $e; }
            finally { self::$txLevel--; }
        }
        $pdo->beginTransaction();
        try { $r = $fn(); $pdo->commit(); return $r; }
        catch (\Throwable $e) { $pdo->rollBack(); throw $e; }
    }
    private static int $txLevel = 0;
}

final class Http
{
    public static function path(): string
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
        if ($base !== '' && str_starts_with($uri, $base)) $uri = substr($uri, strlen($base));
        return '/' . trim($uri, '/');
    }
    public static function rawBody(): string { static $b = null; return $b ??= (string) file_get_contents('php://input'); }
    public static function body(): array
    {
        $d = json_decode(self::rawBody(), true);
        return is_array($d) ? $d : $_POST;
    }
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    public static function ok(mixed $data = null): never { self::json(['ok' => true, 'data' => $data]); }
    public static function cors(): void
    {
        // Bearer-token API (no cookies): reflecting any origin is safe and keeps
        // browsers working even when the deployed config has no cors_origins list.
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin) header("Access-Control-Allow-Origin: $origin");
        else header('Access-Control-Allow-Origin: *');
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token, X-Requested-With');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Max-Age: 86400');
    }
    public static function ip(): string { return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'; }
}

date_default_timezone_set('Asia/Dhaka');
