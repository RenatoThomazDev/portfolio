@extends('layout')

@section('title', 'Portfólio')

@section('content')

<section id="inicio" class="min-h-[70vh] flex flex-col md:flex-row items-center justify-center md:justify-between gap-10 px-6 md:px-12 lg:px-80">
    <div class="text-center md:text-left max-w-xl">
        <h1 class="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4">
            Meu nome é <span class="text-indigo-400">Renato</span>
        </h1>
        <p class="text-gray-300 text-lg mb-6">
            Desenvolvedor de sites em PHP, JavaScript e Java.  
            Gosto de transformar ideias em interfaces bonitas e funcionais.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a href="#projetos" class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition">Ver Projetos</a>
            <a href="#sobre" class="px-6 py-3 border border-indigo-500 text-indigo-400 font-semibold rounded-lg hover:bg-indigo-500 hover:text-white transition">Sobre Mim</a>
        </div>
    </div>

    <div class="relative">
        <div class="absolute inset-0 rounded-full bg-indigo-400 blur-3xl opacity-30 animate-pulse"></div>
        <img src="https://cdn.discordapp.com/attachments/830605801567420449/1424814609478713455/IMG_0206.png?ex=68e55182&is=68e40002&hm=adb5876c72ddd19f5ce245dae6f7237e80bf0c7815cf10047c87e81ad1260537" 
             alt="Foto" 
             class="relative z-10 w-64 h-64 rounded-full shadow-[0_0_40px_rgba(99,102,241,0.6)] object-cover border-4 border-indigo-500">
    </div>
</section>

<section id="sobre" class="py-20 px-6 md:px-12 lg:px-24 bg-gray-800/40 backdrop-blur-lg rounded-3xl shadow-xl mt-20">
    <h2 class="text-3xl font-bold text-indigo-400 mb-6 text-center">Sobre Mim</h2>
    <p class="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto text-center">
        Sou um desenvolvedor cursando Desenvolvimento de Sistemas no terceiro ano do ensino médio.  
        Tenho grande interesse em design e experiência do usuário.  
        Utilizo <span class="text-indigo-400">Laravel</span>, <span class="text-indigo-400">TailwindCSS</span> e <span class="text-indigo-400">JavaScript</span> para criar aplicações bonitas e funcionais.
    </p>
</section>

<section id="projetos" class="py-24 px-6 md:px-12 lg:px-24">
    <h2 class="text-3xl font-bold text-indigo-400 mb-12 text-center">Projetos</h2>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        @foreach ([
            [
                'titulo' => 'Portfólio Pessoal',
                'descricao' => 'Site pessoal moderno com Laravel e Tailwind.',
                'imagem' => 'https://cdn.discordapp.com/attachments/830605801567420449/1424915053324533760/image.png?ex=68e5af0e&is=68e45d8e&hm=2d366b940fd1f92b88435de6889da6863fd4ffa06ded79963037972613f9d6d2',
                'video' => asset('videos/portfolio.mp4'),
            ],
            [
                'titulo' => 'Jogo da Velha',
                'descricao' => 'Feito em aula de Programação Mobile.',
                'imagem' => 'https://cdn.discordapp.com/attachments/830605801567420449/1424841066322071582/image.png?ex=68e56a26&is=68e418a6&hm=a272e748a493757b5ecbc7e4b5dcd3dc86bbd645b7fe0f2d37557921a64a72ef',
                'video' => asset('videos/jogodavelha.mp4'),
            ],
            [
                'titulo' => 'Gerenciador de Tarefas',
                'descricao' => 'Lista de tarefas com botão de excluir e ver mais.',
                'imagem' => 'https://cdn.discordapp.com/attachments/830605801567420449/1424878349775540327/image.png?ex=68e58cdf&is=68e43b5f&hm=cad75dbf8d1ae20612bf3a44a96626c1d8e260a99ab00ecfe24d7e2296a4b0ec',
                'video' => asset('videos/tarefas.mp4'),
            ],
        ] as $p)
        <div class="group relative bg-gray-800/70 hover:bg-gray-700 transition rounded-xl p-6 shadow-lg overflow-hidden">

            <img src="{{ $p['imagem'] }}" 
                 alt="{{ $p['titulo'] }}" 
                 class="rounded-lg mb-4 w-full h-70 object-cover shadow-md transition-opacity duration-300 group-hover:opacity-0">

            <video 
                src="{{ $p['video'] }}"
                muted
                playsinline
                loop
                preload="metadata"
                class="absolute top-6 left-6 w-[calc(100%-3rem)] h-70 object-cover rounded-lg shadow-md opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            ></video>

            <div class="relative z-10">
                <h3 class="text-xl font-semibold text-white mb-2">{{ $p['titulo'] }}</h3>
                <p class="text-gray-400">{{ $p['descricao'] }}</p>
            </div>
        </div>
        @endforeach
    </div>
</section>

<script>
    document.querySelectorAll('.group').forEach(card => {
        const video = card.querySelector('video');
        if (!video) return;

        card.addEventListener('mouseenter', () => {
            video.currentTime = 0;
            video.play();
        });

        card.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
        });
    });
</script>


@endsection
