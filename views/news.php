<?php
// Página de Notícias
add_log("Acessando página de notícias", 'info');
?>

<div class="page-header py-5">
    <div class="container">
        <h1 class="display-4 fw-bold">Notícias de Umbra Eternum</h1>
        <p class="lead">Fique por dentro das últimas atualizações e eventos do jogo</p>
    </div>
</div>

<div class="container py-5">
    <div class="row">
        <div class="col-lg-8">
            <!-- Notícia Principal -->
            <div class="news-featured mb-5">
                <div class="card bg-dark shadow">
                    <img src="img/news-feature.jpg" class="card-img-top" alt="Nova Expansão">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-primary">Expansão</span>
                            <small class="text-muted">26/03/2025</small>
                        </div>
                        <h2 class="card-title">Nova Expansão: As Terras Sombrias</h2>
                        <p class="card-text">Preparem-se aventureiros! A maior expansão de Umbra Eternum está chegando no próximo mês. As Terras Sombrias trarão um novo continente para explorar, com regiões inéditas, masmorras desafiadoras e uma história épica que mudará para sempre o destino de Avaloria.</p>
                        <p class="card-text">Entre as novidades, destacamos:</p>
                        <ul>
                            <li>Novo continente: Sombreterra</li>
                            <li>Aumento do nível máximo para 50</li>
                            <li>6 novas masmorras</li>
                            <li>2 raids de alta dificuldade</li>
                            <li>Nova classe: Necromante</li>
                            <li>Sistema de habitação</li>
                        </ul>
                        <p class="card-text">A pré-venda começará em 01/04/2025 com bônus exclusivos para quem adquirir o pacote premium!</p>
                    </div>
                </div>
            </div>
            
            <!-- Lista de Notícias -->
            <div class="news-list">
                <h3 class="mb-4">Notícias Recentes</h3>
                
                <div class="news-item card bg-dark mb-4 shadow">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-danger">Dungeon</span>
                            <small class="text-muted">20/03/2025</small>
                        </div>
                        <h4 class="card-title">Nova Dungeon: As Minas de Moria</h4>
                        <p class="card-text">Explore as profundezas das novas masmorras e enfrente os temíveis Balrogs para conseguir equipamentos lendários. As Minas de Moria são recomendadas para grupos de 5 jogadores com nível 30+.</p>
                        <p class="card-text">A nova masmorra apresenta mecânicas inéditas de mineração, que permitem aos jogadores coletar recursos raros durante a aventura. Esses recursos podem ser utilizados para criar equipamentos exclusivos com o novo sistema de Crafting.</p>
                    </div>
                </div>
                
                <div class="news-item card bg-dark mb-4 shadow">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-success">Atualização</span>
                            <small class="text-muted">15/03/2025</small>
                        </div>
                        <h4 class="card-title">Novo Sistema de Crafting</h4>
                        <p class="card-text">Agora é possível criar seus próprios itens e equipamentos com recursos coletados pelo mundo. O sistema de Crafting permite que jogadores de todas as classes desenvolvam habilidades de criação em diversas profissões:</p>
                        <ul>
                            <li>Ferraria: criação de armas e armaduras metálicas</li>
                            <li>Costura: confecção de vestes, capas e bolsas</li>
                            <li>Alquimia: produção de poções e elixires</li>
                            <li>Encantamento: melhoria mágica de equipamentos</li>
                        </ul>
                    </div>
                </div>
                
                <div class="news-item card bg-dark mb-4 shadow">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-info">Evento</span>
                            <small class="text-muted">10/03/2025</small>
                        </div>
                        <h4 class="card-title">Festival da Primavera</h4>
                        <p class="card-text">O Festival da Primavera chegou a Umbra Eternum! De 15 a 30 de Março, todas as cidades principais estarão decoradas com flores e luzes, oferecendo diversas atividades especiais e recompensas únicas.</p>
                        <p class="card-text">Participe da caça aos ovos mágicos, compita no torneio de tiro com arco e ajude a restaurar os jardins da cidade para ganhar a montaria exclusiva: Cervo Celestial!</p>
                    </div>
                </div>
                
                <div class="news-item card bg-dark mb-4 shadow">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-warning">Manutenção</span>
                            <small class="text-muted">05/03/2025</small>
                        </div>
                        <h4 class="card-title">Manutenção Programada</h4>
                        <p class="card-text">Informamos que no dia 08/03/2025, entre 02:00 e 08:00 (horário de Brasília), nossos servidores estarão em manutenção para a implementação de melhorias de desempenho e correção de bugs.</p>
                        <p class="card-text">Principais correções:</p>
                        <ul>
                            <li>Resolução do problema de lag em áreas populosas</li>
                            <li>Correção do bug que impedia a conclusão da missão "A Espada Perdida"</li>
                            <li>Ajustes de balanceamento para a classe Paladino</li>
                            <li>Melhorias no sistema de inventário</li>
                        </ul>
                    </div>
                </div>
                
                <div class="news-item card bg-dark shadow">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-secondary">Comunidade</span>
                            <small class="text-muted">01/03/2025</small>
                        </div>
                        <h4 class="card-title">Resultado do Concurso de Screenshots</h4>
                        <p class="card-text">O concurso de Screenshots "Belezas de Avaloria" chegou ao fim! Recebemos mais de 500 participações e nossa equipe teve a difícil tarefa de escolher os vencedores.</p>
                        <p class="card-text">Os três primeiros colocados receberão recompensas exclusivas e terão suas capturas exibidas na tela de login do jogo durante o próximo mês. Confira os ganhadores em nosso Discord oficial!</p>
                    </div>
                </div>
            </div>
            
            <!-- Paginação -->
            <nav class="mt-5">
                <ul class="pagination justify-content-center">
                    <li class="page-item active"><a class="page-link" href="#">1</a></li>
                    <li class="page-item"><a class="page-link" href="#">2</a></li>
                    <li class="page-item"><a class="page-link" href="#">3</a></li>
                    <li class="page-item">
                        <a class="page-link" href="#" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
        
        <div class="col-lg-4">
            <!-- Sidebar -->
            <div class="sidebar-section">
                <!-- Categorias -->
                <div class="card bg-dark mb-4 shadow">
                    <div class="card-header">
                        <h5 class="mb-0">Categorias</h5>
                    </div>
                    <div class="card-body">
                        <div class="list-group list-group-flush bg-transparent">
                            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center bg-dark text-light">
                                Atualizações
                                <span class="badge bg-primary rounded-pill">12</span>
                            </a>
                            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center bg-dark text-light">
                                Eventos
                                <span class="badge bg-primary rounded-pill">8</span>
                            </a>
                            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center bg-dark text-light">
                                Manutenção
                                <span class="badge bg-primary rounded-pill">5</span>
                            </a>
                            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center bg-dark text-light">
                                Comunidade
                                <span class="badge bg-primary rounded-pill">7</span>
                            </a>
                            <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center bg-dark text-light">
                                Expansões
                                <span class="badge bg-primary rounded-pill">3</span>
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Status do Servidor -->
                <div class="card bg-dark mb-4 shadow">
                    <div class="card-header">
                        <h5 class="mb-0">Status do Servidor</h5>
                    </div>
                    <div class="card-body">
                        <div id="serverStatus" class="server-status mb-3">
                            <p class="text-muted mb-0">Carregando status do servidor...</p>
                        </div>
                        <div id="onlinePlayers" class="online-players">
                            <p class="text-muted mb-0">Jogadores online: Carregando...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Discord -->
                <div class="card bg-dark mb-4 shadow">
                    <div class="card-header">
                        <h5 class="mb-0">Comunidade</h5>
                    </div>
                    <div class="card-body">
                        <p class="card-text">Junte-se a outros jogadores em nosso Discord oficial para discutir estratégias, encontrar grupos e participar de eventos exclusivos.</p>
                        <a href="https://discord.gg/umbraeternum" target="_blank" class="btn btn-discord w-100">
                            <i class="fab fa-discord me-2"></i> Entrar no Discord
                        </a>
                    </div>
                </div>
                
                <!-- Newsletter -->
                <div class="card bg-dark shadow">
                    <div class="card-header">
                        <h5 class="mb-0">Newsletter</h5>
                    </div>
                    <div class="card-body">
                        <p class="card-text">Receba as últimas notícias e atualizações diretamente em seu e-mail.</p>
                        <form>
                            <div class="mb-3">
                                <input type="email" class="form-control" placeholder="Seu email" required>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Inscrever-se</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> 