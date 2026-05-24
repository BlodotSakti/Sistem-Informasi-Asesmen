<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Sistem Informasi Asesmen</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <script>
        window.__APP_CSRF__ = @json(csrf_token());
    </script>
</head>
<body class="bg-slate-100 text-slate-900 antialiased">
    <div id="app"></div>
</body>
</html>