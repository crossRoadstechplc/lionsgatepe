<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

/**
 * @param array<string, string> $mailConfig
 */
function sendContactMail(array $mailConfig, string $subject, string $body, string $replyName, string $replyEmail): bool
{
    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host       = $mailConfig['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $mailConfig['smtp_username'];
    $mail->Password   = $mailConfig['smtp_password'];
    $mail->Port       = (int) $mailConfig['smtp_port'];

    $secure = strtolower((string) ($mailConfig['smtp_secure'] ?? 'tls'));
    if ($secure === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($secure === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } else {
        $mail->SMTPSecure = '';
        $mail->SMTPAutoTLS = false;
    }

    $mail->CharSet = 'UTF-8';
    $mail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
    $mail->addAddress($mailConfig['to_email']);
    $mail->addReplyTo($replyEmail, $replyName);

    $mail->Subject = $subject;
    $mail->Body    = $body;
    $mail->isHTML(false);

    return $mail->send();
}

/**
 * @return array<string, string>|null
 */
function loadMailConfig(): ?array
{
    $path = dirname(__DIR__) . '/config.mail.php';

    if (!is_readable($path)) {
        return null;
    }

    $config = require $path;

    if (!is_array($config)) {
        return null;
    }

    $required = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email', 'to_email', 'from_name'];

    foreach ($required as $key) {
        if (empty($config[$key])) {
            return null;
        }
    }

    if (str_contains((string) $config['smtp_password'], 'PASTE_YOUR_PASSWORD')) {
        return null;
    }

    return $config;
}
