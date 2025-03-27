<?php
// Página de Guia
add_log("Acessando página de guia", 'info');
?>

<div class="page-header py-5">
    <div class="container">
        <h1 class="display-4 fw-bold">Guia do Jogo</h1>
        <p class="lead">Aprenda tudo sobre Umbra Eternum e domine suas mecânicas</p>
    </div>
</div>

<div class="container py-5">
    <!-- Navegação por tabs -->
    <ul class="nav nav-tabs mb-4" id="guideTab" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" id="inicio-tab" data-bs-toggle="tab" data-bs-target="#inicio" type="button" role="tab" aria-controls="inicio" aria-selected="true">Início</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="classes-tab" data-bs-toggle="tab" data-bs-target="#classes" type="button" role="tab" aria-controls="classes" aria-selected="false">Classes</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="combate-tab" data-bs-toggle="tab" data-bs-target="#combate" type="button" role="tab" aria-controls="combate" aria-selected="false">Combate</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="itens-tab" data-bs-toggle="tab" data-bs-target="#itens" type="button" role="tab" aria-controls="itens" aria-selected="false">Itens</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="mundo-tab" data-bs-toggle="tab" data-bs-target="#mundo" type="button" role="tab" aria-controls="mundo" aria-selected="false">Mundo</button>
        </li>
    </ul>
    
    <!-- Conteúdo das tabs -->
    <div class="tab-content" id="guideTabContent">
        <!-- Tab Início -->
        <div class="tab-pane fade show active" id="inicio" role="tabpanel" aria-labelledby="inicio-tab">
            <div class="row mb-4">
                <div class="col-lg-8">
                    <h2 class="mb-4">Bem-vindo ao Guia de Umbra Eternum</h2>
                    <p>Este guia foi criado para ajudar tanto iniciantes quanto veteranos a compreender as mecânicas do jogo e a explorar todo o potencial do mundo de Avaloria.</p>
                    <p>Se você é novo em Umbra Eternum, recomendamos começar pela seção de <strong>Primeiros Passos</strong> abaixo. Jogadores mais experientes podem navegar diretamente para seções específicas usando as abas acima.</p>

                    <h3 class="mt-4 mb-3">Primeiros Passos</h3>
                    <div class="accordion" id="beginnerAccordion">
                        <div class="accordion-item bg-dark border-secondary">
                            <h4 class="accordion-header" id="heading1">
                                <button class="accordion-button bg-dark text-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapse1" aria-expanded="true" aria-controls="collapse1">
                                    Criando seu Personagem
                                </button>
                            </h4>
                            <div id="collapse1" class="accordion-collapse collapse show" aria-labelledby="heading1" data-bs-parent="#beginnerAccordion">
                                <div class="accordion-body">
                                    <p>Para começar sua jornada em Umbra Eternum, primeiro você precisará criar um personagem:</p>
                                    <ol>
                                        <li>Crie uma conta em nosso site.</li>
                                        <li>Faça login e acesse a seção "Minha Conta".</li>
                                        <li>Clique em "Criar Novo Personagem".</li>
                                        <li>Escolha uma classe entre as seis disponíveis.</li>
                                        <li>Personalize sua aparência e atributos iniciais.</li>
                                        <li>Escolha um nome para seu personagem.</li>
                                        <li>Comece sua aventura em Avaloria!</li>
                                    </ol>
                                    <p>Cada conta pode ter até 3 personagens ativos simultaneamente.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="accordion-item bg-dark border-secondary">
                            <h4 class="accordion-header" id="heading2">
                                <button class="accordion-button bg-dark text-light collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse2" aria-expanded="false" aria-controls="collapse2">
                                    Interface do Jogo
                                </button>
                            </h4>
                            <div id="collapse2" class="accordion-collapse collapse" aria-labelledby="heading2" data-bs-parent="#beginnerAccordion">
                                <div class="accordion-body">
                                    <p>A interface de Umbra Eternum foi projetada para ser intuitiva e personalizável:</p>
                                    <ul>
                                        <li><strong>Barra de Saúde (Vermelha):</strong> Mostra seus pontos de vida atuais.</li>
                                        <li><strong>Barra de Mana (Azul):</strong> Energia mágica para lançar habilidades.</li>
                                        <li><strong>Barra de Experiência (Verde):</strong> Progresso para o próximo nível.</li>
                                        <li><strong>Barra de Ação:</strong> Suas habilidades e itens de uso rápido.</li>
                                        <li><strong>Minimapa:</strong> Visão da área ao seu redor.</li>
                                    </ul>
                                    <p>Você pode personalizar a interface nas configurações do jogo (tecla ESC).</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="accordion-item bg-dark border-secondary">
                            <h4 class="accordion-header" id="heading3">
                                <button class="accordion-button bg-dark text-light collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse3" aria-expanded="false" aria-controls="collapse3">
                                    Primeiras Missões
                                </button>
                            </h4>
                            <div id="collapse3" class="accordion-collapse collapse" aria-labelledby="heading3" data-bs-parent="#beginnerAccordion">
                                <div class="accordion-body">
                                    <p>Quando você cria um novo personagem, aparecerá na cidade inicial de Altoria. Aqui você encontrará várias missões introdutórias:</p>
                                    <ul>
                                        <li><strong>"Boas-vindas a Altoria":</strong> Conheça os NPCs principais da cidade.</li>
                                        <li><strong>"Primeiras Armas":</strong> Obtenha seu equipamento inicial no Ferreiro.</li>
                                        <li><strong>"Ameaça nos Campos":</strong> Elimine lobos que ameaçam fazendeiros.</li>
                                    </ul>
                                    <p>Completar estas missões iniciais fornecerá equipamentos básicos e ensinará as mecânicas fundamentais do jogo.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h3 class="mt-4 mb-3">Controles Básicos</h3>
                    <div class="table-responsive">
                        <table class="table table-dark table-striped">
                            <thead>
                                <tr>
                                    <th>Tecla</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>W, A, S, D</td>
                                    <td>Movimentação</td>
                                </tr>
                                <tr>
                                    <td>Mouse Esquerdo</td>
                                    <td>Atacar / Selecionar</td>
                                </tr>
                                <tr>
                                    <td>Mouse Direito</td>
                                    <td>Interagir / Mover-se</td>
                                </tr>
                                <tr>
                                    <td>1-9</td>
                                    <td>Usar habilidades da barra de ação</td>
                                </tr>
                                <tr>
                                    <td>I</td>
                                    <td>Abrir inventário</td>
                                </tr>
                                <tr>
                                    <td>M</td>
                                    <td>Abrir mapa</td>
                                </tr>
                                <tr>
                                    <td>C</td>
                                    <td>Abrir painel de personagem</td>
                                </tr>
                                <tr>
                                    <td>P</td>
                                    <td>Abrir painel de habilidades</td>
                                </tr>
                                <tr>
                                    <td>ESC</td>
                                    <td>Menu principal / Fechar janelas</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <div class="card bg-dark mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Dicas Rápidas</h5>
                        </div>
                        <div class="card-body">
                            <ul class="list-group list-group-flush bg-transparent">
                                <li class="list-group-item bg-dark text-light border-secondary">
                                    <i class="fas fa-star text-warning me-2"></i> Complete missões diárias para ganhar recompensas extras.
                                </li>
                                <li class="list-group-item bg-dark text-light border-secondary">
                                    <i class="fas fa-star text-warning me-2"></i> Junte-se a uma guilda para acessar conteúdo exclusivo.
                                </li>
                                <li class="list-group-item bg-dark text-light border-secondary">
                                    <i class="fas fa-star text-warning me-2"></i> Visite o NPC de treinamento a cada 5 níveis.
                                </li>
                                <li class="list-group-item bg-dark text-light border-secondary">
                                    <i class="fas fa-star text-warning me-2"></i> Use o canal de chat "Ajuda" para tirar dúvidas.
                                </li>
                                <li class="list-group-item bg-dark text-light border-secondary">
                                    <i class="fas fa-star text-warning me-2"></i> Guarde equipamentos de qualidade rara ou superior.
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="card bg-dark">
                        <div class="card-header">
                            <h5 class="mb-0">Downloads Úteis</h5>
                        </div>
                        <div class="card-body">
                            <ul class="list-group list-group-flush bg-transparent">
                                <li class="list-group-item bg-dark text-light border-secondary">
                                    <a href="#" class="text-light">
                                        <i class="fas fa-download me-2"></i> Mapa de Avaloria (PDF)
                                    </a>
                                </li>
                                <li class="list-group-item bg-dark text-light border-secondary">
                                    <a href="#" class="text-light">
                                        <i class="fas fa-download me-2"></i> Guia para Iniciantes (PDF)
                                    </a>
                                </li>
                                <li class="list-group-item bg-dark text-light border-secondary">
                                    <a href="#" class="text-light">
                                        <i class="fas fa-download me-2"></i> Tabela de Atributos
                                    </a>
                                </li>
                                <li class="list-group-item bg-dark text-light border-secondary">
                                    <a href="#" class="text-light">
                                        <i class="fas fa-download me-2"></i> Lista de Receitas de Crafting
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tab Classes -->
        <div class="tab-pane fade" id="classes" role="tabpanel" aria-labelledby="classes-tab">
            <h2 class="mb-4">Classes de Personagem</h2>
            <p>Em Umbra Eternum, você pode escolher entre seis classes distintas, cada uma com estilos de jogo, habilidades e papéis únicos.</p>
            
            <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4 mb-4">
                <!-- Guerreiro -->
                <div class="col">
                    <div class="card h-100 bg-dark">
                        <div class="card-header bg-primary text-light">
                            <h4 class="mb-0">Guerreiro</h4>
                        </div>
                        <div class="card-body">
                            <div class="class-icon text-center mb-3">
                                <i class="fas fa-sword fa-3x"></i>
                            </div>
                            <h5>Especialidade</h5>
                            <p>Combate corpo a corpo, tanque, dano sustentado</p>
                            
                            <h5>Atributos Principais</h5>
                            <p>Força, Constituição</p>
                            
                            <h5>Habilidades Notáveis</h5>
                            <ul>
                                <li>Golpe Giratório: Ataca todos os inimigos próximos</li>
                                <li>Grito de Guerra: Aumenta ataque da equipe</li>
                                <li>Provocar: Força inimigos a atacá-lo</li>
                            </ul>
                            
                            <h5>Estilo de Jogo</h5>
                            <p>Guerreiros são a linha de frente, protegendo aliados e resistindo a grandes quantidades de dano enquanto lidam com dano constante.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Mago -->
                <div class="col">
                    <div class="card h-100 bg-dark">
                        <div class="card-header bg-info text-light">
                            <h4 class="mb-0">Mago</h4>
                        </div>
                        <div class="card-body">
                            <div class="class-icon text-center mb-3">
                                <i class="fas fa-hat-wizard fa-3x"></i>
                            </div>
                            <h5>Especialidade</h5>
                            <p>Dano mágico em área, controle de grupo</p>
                            
                            <h5>Atributos Principais</h5>
                            <p>Inteligência, Sabedoria</p>
                            
                            <h5>Habilidades Notáveis</h5>
                            <ul>
                                <li>Bola de Fogo: Alto dano em área</li>
                                <li>Congelamento: Imobiliza inimigos</li>
                                <li>Teleporte: Movimentação rápida</li>
                            </ul>
                            
                            <h5>Estilo de Jogo</h5>
                            <p>Magos causam dano massivo em área e controlam o campo de batalha, mas são frágeis e precisam manter distância dos inimigos.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Arqueiro -->
                <div class="col">
                    <div class="card h-100 bg-dark">
                        <div class="card-header bg-success text-light">
                            <h4 class="mb-0">Arqueiro</h4>
                        </div>
                        <div class="card-body">
                            <div class="class-icon text-center mb-3">
                                <i class="fas fa-bow-arrow fa-3x"></i>
                            </div>
                            <h5>Especialidade</h5>
                            <p>Dano físico à distância, mobilidade</p>
                            
                            <h5>Atributos Principais</h5>
                            <p>Destreza, Agilidade</p>
                            
                            <h5>Habilidades Notáveis</h5>
                            <ul>
                                <li>Tiro Certeiro: Alto dano em alvo único</li>
                                <li>Chuva de Flechas: Dano em área</li>
                                <li>Evasão: Esquiva de ataques</li>
                            </ul>
                            
                            <h5>Estilo de Jogo</h5>
                            <p>Arqueiros são especialistas em atacar à distância com precisão letal, usando sua mobilidade para se manter fora do alcance inimigo.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Outras classes... só resumindo para não ficar muito extenso -->
            </div>
        </div>
        
        <!-- Tab Combate -->
        <div class="tab-pane fade" id="combate" role="tabpanel" aria-labelledby="combate-tab">
            <h2 class="mb-4">Sistema de Combate</h2>
            <p>O combate em Umbra Eternum é dinâmico e estratégico, combinando ação em tempo real com elementos táticos.</p>
            
            <!-- Conteúdo resumido do sistema de combate -->
        </div>
        
        <!-- Tab Itens -->
        <div class="tab-pane fade" id="itens" role="tabpanel" aria-labelledby="itens-tab">
            <h2 class="mb-4">Itens e Equipamentos</h2>
            <p>O sistema de itens de Umbra Eternum oferece vasta personalização através de armas, armaduras e acessórios.</p>
            
            <!-- Conteúdo resumido do sistema de itens -->
        </div>
        
        <!-- Tab Mundo -->
        <div class="tab-pane fade" id="mundo" role="tabpanel" aria-labelledby="mundo-tab">
            <h2 class="mb-4">O Mundo de Avaloria</h2>
            <p>Avaloria é um vasto reino de fantasia com diversas regiões, cada uma com sua própria história, fauna e desafios.</p>
            
            <!-- Conteúdo resumido sobre o mundo do jogo -->
        </div>
    </div>
</div> 