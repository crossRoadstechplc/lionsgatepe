<?php
/**
 * Lionsgate contact form handler (SMTP via PHPMailer).
 */

declare(strict_types=1);

header('X-Content-Type-Options: nosniff');

const MAX_NAME_LEN = 120;
const MAX_ORG_LEN = 160;
const MAX_MESSAGE_LEN = 5000;

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/includes/send-mail.php';

function wantsJson(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    return str_contains($accept, 'application/json')
        || str_contains($contentType, 'application/json');
}

function respond(bool $success, string $message, int $code = 200): void
{
    http_response_code($code);

    if (wantsJson()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => $success,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $param = $success ? 'sent=1' : 'error=' . rawurlencode($message);
    header('Location: index.html#contact?' . $param);
    exit;
}

function sanitize(string $value): string
{
    $value = trim($value);
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    return strip_tags($value);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed.', 405);
}

$mailConfig = loadMailConfig();

if ($mailConfig === null) {
    respond(
        false,
        'Mail is not configured. Copy config.mail.example.php to config.mail.php and add your SMTP details.',
        503
    );
}

$payload = $_POST;

if (str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw ?: '', true);
    if (!is_array($decoded)) {
        respond(false, 'Invalid request body.', 400);
    }
    $payload = $decoded;
}

$honeypot = trim((string) ($payload['website'] ?? ''));
if ($honeypot !== '') {
    respond(true, 'Thank you. Your message has been sent.');
}

$name = sanitize((string) ($payload['name'] ?? ''));
$email = sanitize((string) ($payload['email'] ?? ''));
$organization = sanitize((string) ($payload['organization'] ?? ''));
$message = sanitize((string) ($payload['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    respond(false, 'Please fill in all required fields.', 422);
}

if (strlen($name) > MAX_NAME_LEN) {
    respond(false, 'Name is too long.', 422);
}

if (strlen($organization) > MAX_ORG_LEN) {
    respond(false, 'Organization name is too long.', 422);
}

if (strlen($message) > MAX_MESSAGE_LEN) {
    respond(false, 'Message is too long.', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.', 422);
}

$subject = 'Website inquiry from ' . $name;

$body = implode("\n", [
    'New message from the Lionsgate website',
    '',
    'Name: ' . $name,
    'Email: ' . $email,
    'Organization: ' . ($organization !== '' ? $organization : '—'),
    '',
    'Message:',
    $message,
    '',
    '—',
    'Sent: ' . gmdate('Y-m-d H:i:s') . ' UTC',
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
]);

try {
    $sent = sendContactMail($mailConfig, $subject, $body, $name, $email);
} catch (Throwable $e) {
    error_log('Contact form mail error: ' . $e->getMessage());
    respond(false, 'Unable to send your message right now. Please email info@lionsgatepe.com directly.', 500);
}

if (!$sent) {
    respond(false, 'Unable to send your message right now. Please email info@lionsgatepe.com directly.', 500);
}

respond(true, 'Thank you. Your message has been sent. We will respond shortly.');
