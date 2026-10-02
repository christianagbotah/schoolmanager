<?php
defined('BASEPATH') OR exit('No direct script access allowed');
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title><?php echo $heading; ?></title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style type="text/css">
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif;
    background: #f1f5f9;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: #1e293b;
}
.error-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.08);
    max-width: 560px;
    width: 100%;
    padding: 48px 40px;
    text-align: center;
}
.error-code {
    font-size: 72px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 12px;
}
h1 {
    font-size: 20px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 14px 0;
}
.message {
    font-size: 15px;
    line-height: 1.65;
    color: #475569;
    margin: 0 0 28px 0;
    word-break: break-word;
}
.home-btn {
    display: inline-block;
    background: #2563eb;
    color: #ffffff;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 28px;
    border-radius: 10px;
    transition: background 150ms ease, transform 150ms ease;
}
.home-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
.home-btn:active { transform: translateY(0); }
.hint {
    margin-top: 24px;
    font-size: 12px;
    color: #94a3b8;
}
@media (max-width: 480px) {
    .error-card { padding: 32px 24px; }
    .error-code { font-size: 56px; }
}
</style>
</head>
<body>
    <div class="error-card">
        <div class="error-code">404</div>
        <h1><?php echo $heading; ?></h1>
        <div class="message"><?php echo $message; ?></div>
        <a class="home-btn" href="javascript:history.back()">&larr; Go Back</a>
        <div class="hint">If you believe this is a mistake, please contact your system administrator.</div>
    </div>
</body>
</html>
