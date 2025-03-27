<?php
// Página inicial
add_log("Acessando página inicial", 'info');
?>

<div class="hero-section py-5">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-7 mb-4 mb-lg-0">
                <h1 class="display-4 fw-bold mb-4">Bem-vindo a Umbra Eternum</h1>
                <p class="lead mb-4">Um RPG online de fantasia medieval onde você pode criar personagens, explorar terras misteriosas e viver aventuras épicas.</p>
                
                <?php if (!$is_logged_in): ?>
                <div class="d-flex gap-3 mb-4">
                    <a href="index.php?p=register" class="btn btn-primary btn-lg">
                        <i class="fas fa-user-plus me-2"></i> Criar Conta
                    </a>
                    <a href="index.php?p=login" class="btn btn-outline-light btn-lg">
                        <i class="fas fa-sign-in-alt me-2"></i> Entrar
                    </a>
                </div>
                <?php else: ?>
                <div class="d-flex gap-3 mb-4">
                    <a href="index.php?p=account" class="btn btn-primary btn-lg">
                        <i class="fas fa-gamepad me-2"></i> Jogar Agora
                    </a>
                    <a href="index.php?p=guide" class="btn btn-outline-light btn-lg">
                        <i class="fas fa-book me-2"></i> Guia do Jogo
                    </a>
                </div>
                <?php endif; ?>
            </div>
            <div class="col-lg-5">
                <div class="hero-image text-center">
                    <img src="img/hero-image.jpg" alt="Umbra Eternum" class="img-fluid rounded shadow">
                </div>
            </div>
        </div>
    </div>
</div>

<div class="py-5 bg-darker">
    <div class="container">
        <h2 class="text-center mb-5">Características do Jogo</h2>
        
        <div class="row mb-5 g-4">
            <div class="col-md-4">
                <div class="feature-card h-100 p-4 rounded bg-dark shadow">
                    <div class="feature-icon mb-3 text-primary">
                        <i class="fas fa-user-shield fa-3x"></i>
                    </div>
                    <h3>Crie seu Personagem</h3>
                    <p class="text-muted">Escolha entre diversas classes e personalize seu herói com atributos únicos. Seja um guerreiro poderoso, um mago místico ou um habilidoso arqueiro.</p>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="feature-card h-100 p-4 rounded bg-dark shadow">
                    <div class="feature-icon mb-3 text-primary">
                        <i class="fas fa-map-marked-alt fa-3x"></i>
                    </div>
                    <h3>Explore o Mundo</h3>
                    <p class="text-muted">Aventure-se por terras misteriosas, calabouços perigosos e cidades antigas. Descubra segredos ocultos e tesouros esquecidos.</p>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="feature-card h-100 p-4 rounded bg-dark shadow">
                    <div class="feature-icon mb-3 text-primary">
                        <i class="fas fa-users fa-3x"></i>
                    </div>
                    <h3>Jogue em Grupo</h3>
                    <p class="text-muted">Forme alianças com outros jogadores, participe de guildas e enfrente juntos os desafios mais difíceis. A união é sua maior arma.</p>
                </div>
            </div>
        </div>
        
        <?php if (!$is_logged_in): ?>
        <div class="text-center mt-4">
            <a href="index.php?p=register" class="btn btn-outline-primary btn-lg">
                Comece sua jornada agora
            </a>
        </div>
        <?php endif; ?>
    </div>
</div>

<div class="py-5">
    <div class="container">
        <h2 class="text-center mb-5">Jogadores Online</h2>
        
        <div class="row justify-content-center">
            <div class="col-md-10 col-lg-8">
                <?php include 'views/player_list.php'; ?>
            </div>
        </div>
    </div>
</div>

<div class="py-5 bg-darker">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6 mb-4 mb-lg-0">
                <h2 class="mb-4">Atualizações Recentes</h2>
                <div class="news-item mb-3 p-3 bg-dark rounded">
                    <div class="d-flex justify-content-between mb-2">
                        <h5 class="mb-0">Nova Dungeon: As Minas de Moria</h5>
                        <span class="badge bg-primary">Novo</span>
                    </div>
                    <p class="text-muted mb-0">Explore as profundezas das novas masmorras e enfrente os temíveis Balrogs para conseguir equipamentos lendários.</p>
                    <small class="text-muted">26/03/2025</small>
                </div>
                
                <div class="news-item mb-3 p-3 bg-dark rounded">
                    <div class="d-flex justify-content-between mb-2">
                        <h5 class="mb-0">Novo Sistema de Crafting</h5>
                        <span class="badge bg-success">Atualização</span>
                    </div>
                    <p class="text-muted mb-0">Agora é possível criar seus próprios itens e equipamentos com recursos coletados pelo mundo.</p>
                    <small class="text-muted">20/03/2025</small>
                </div>
                
                <a href="index.php?p=news" class="btn btn-outline-light mt-3">Ver todas as notícias</a>
            </div>
            
            <div class="col-lg-6">
                <div class="discord-widget p-4 bg-dark rounded shadow">
                    <h4 class="mb-3">Junte-se à nossa comunidade</h4>
                    <p class="text-muted mb-4">Participe do nosso Discord para encontrar outros jogadores, tirar dúvidas e ficar por dentro das novidades!</p>
                    <a href="https://discord.gg/umbraeternum" target="_blank" class="btn btn-discord btn-lg w-100">
                        <i class="fab fa-discord me-2"></i> Entrar no Discord
                    </a>
                </div>
            </div>
        </div>
    </div>
</div> 