<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Portfólio')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <style>
        html {
            scroll-behavior: smooth;
        }
        body {
            background: radial-gradient(circle at 20% 20%, rgba(79,70,229,0.15) 0%, transparent 40%),
                        radial-gradient(circle at 80% 80%, rgba(37,99,235,0.15) 0%, transparent 40%),
                        #0f172a;
        }
    </style>
</head>

<body class="text-gray-100 font-sans selection:bg-indigo-500 selection:text-white">
    <header class="fixed top-0 left-0 w-full bg-gray-900/80 backdrop-blur-lg z-50 border-b border-gray-800">
        <nav class="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
            <a href="#inicio" class="text-2xl font-bold text-indigo-400 hover:text-indigo-300 transition">Renato</a>
            <div class="flex space-x-6 text-sm">
                <a href="#inicio" class="hover:text-indigo-400 transition">Início</a>
                <a href="#sobre" class="hover:text-indigo-400 transition">Sobre</a>
                <a href="#projetos" class="hover:text-indigo-400 transition">Projetos</a>
            </div>
        </nav>
    </header>

    <main class="pt-24" id="inicio">
        @yield('content')
    </main>

    <footer class="mt-24 border-t border-gray-800 text-center py-6 text-gray-500 text-sm">
        © {{ date('Y') }} • Renato
    </footer>
</body>
</html>
