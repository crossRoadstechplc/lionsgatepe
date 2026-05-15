<?php
/**
 * SMTP settings for the contact form.
 *
 * SETUP:
 * 1. Copy this file to: config.mail.php
 * 2. Fill in your real SMTP host, username, and password in config.mail.php
 * 3. Upload config.mail.php to your server (same folder as contact.php)
 *
 * Do NOT commit config.mail.php or share it in chat — it contains your password.
 */

return [
    'smtp_host'     => 'mail.your-host.com',   // e.g. mail.lionsgatepe.com or smtp.gmail.com
    'smtp_port'     => 587,                     // 587 for TLS, 465 for SSL
    'smtp_secure'   => 'tls',                   // 'tls' or 'ssl'
    'smtp_username' => 'info@lionsgatepe.com',
    'smtp_password' => 'PASTE_YOUR_PASSWORD_HERE',

    'from_email' => 'info@lionsgatepe.com',
    'from_name'  => 'Lionsgate Private Equity',
    'to_email'   => 'info@lionsgatepe.com',
];
