<?php
// Incluir configurações
require_once 'config.php';

// Verificar se o usuário está autenticado
require_authentication();

// Inicializar variáveis
$error_message = '';
$character = null;
$character_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Verificar se o ID do personagem foi fornecido
if ($character_id <= 0) {
    add_log("Tentativa de acessar character_view.php sem ID de personagem válido", 'warning');
    redirect('account.php', 'Personagem não especificado');
}

// Log de acesso
add_log("Acesso à página de detalhes do personagem ID: $character_id pelo usuário: {$_SESSION['username']}", 'info');

// Obter detalhes do personagem
try {
    $response = api_get_request("/characters/$character_id");
    
    if ($response['success'] === true && isset($response['data'])) {
        $character = $response['data'];
        add_log("Personagem carregado com sucesso: {$character['name']}", 'debug');
    } else {
        // Em caso de erro de autenticação, tente renovar o token
        if (isset($response['http_code']) && $response['http_code'] === 401) {
            add_log("Token expirado, tentando renovar", 'info');
            
            if (refresh_token()) {
                // Tentar novamente com o token renovado
                $response = api_get_request("/characters/$character_id");
                
                if ($response['success'] === true && isset($response['data'])) {
                    $character = $response['data'];
                    add_log("Personagem carregado com sucesso após renovação de token: {$character['name']}", 'debug');
                } else {
                    add_log("Falha ao obter personagem mesmo após renovação de token", 'error');
                    redirect('account.php', 'Não foi possível carregar o personagem. Por favor, tente fazer login novamente.');
                }
            } else {
                // Falha na renovação do token, redirecionar para login
                add_log("Falha na renovação do token, redirecionando para login", 'warning');
                redirect('logout.php');
            }
        } else {
            add_log("Erro ao obter personagem: " . ($response['message'] ?? 'Erro desconhecido'), 'error');
            redirect('account.php', 'Erro ao carregar o personagem. Por favor, tente novamente mais tarde.');
        }
    }
} catch (Exception $e) {
    add_log("Exceção ao obter personagem: " . $e->getMessage(), 'error');
    redirect('account.php', 'Ocorreu um erro ao processar sua solicitação.');
}

// Verificar se o personagem pertence ao usuário atual
if (!$character || $character['userId'] != $_SESSION['user_id']) {
    add_log("Tentativa de acesso a personagem não pertencente ao usuário: {$_SESSION['username']}", 'warning');
    redirect('account.php', 'Você não tem permissão para acessar este personagem.');
}

// Título da página
$page_title = "Personagem: {$character['name']} - UmbraEternum";

// Simulação de algumas estatísticas e habilidades (substitua por dados reais da API)
$skills = [
    [
        'name' => 'Golpe Rápido',
        'damage' => '10-15',
        'cost' => '5 mana',
        'cooldown' => '2s',
        'description' => 'Um ataque rápido que causa dano físico ao alvo.'
    ],
    [
        'name' => 'Bola de Fogo',
        'damage' => '20-25',
        'cost' => '15 mana',
        'cooldown' => '8s',
        'description' => 'Conjura uma bola de fogo que causa dano mágico em área.'
    ],
    [
        'name' => 'Cura Menor',
        'damage' => 'Cura 15-20 HP',
        'cost' => '20 mana',
        'cooldown' => '15s',
        'description' => 'Recupera uma pequena quantidade de pontos de vida.'
    ],
    [
        'name' => 'Escudo Arcano',
        'damage' => 'Absorve 30 de dano',
        'cost' => '25 mana',
        'cooldown' => '30s',
        'description' => 'Cria um escudo mágico que absorve dano por 10 segundos.'
    ]
];

$equipment = [
    'weapon' => 'Espada Longa +1',
    'armor' => 'Armadura de Couro',
    'helmet' => 'Elmo de Bronze',
    'boots' => 'Botas de Couro',
    'gloves' => 'Luvas de Couro',
    'accessory1' => 'Amuleto de Proteção',
    'accessory2' => 'Anel da Sorte'
];

$inventory = [
    ['name' => 'Poção de Vida', 'quantity' => 5, 'description' => 'Recupera 50 pontos de vida'],
    ['name' => 'Poção de Mana', 'quantity' => 3, 'description' => 'Recupera 50 pontos de mana'],
    ['name' => 'Pedra de Retorno', 'quantity' => 1, 'description' => 'Permite retornar à cidade']
];

$stats = [
    'strength' => 14,
    'dexterity' => 12,
    'constitution' => 13,
    'intelligence' => 10,
    'wisdom' => 8,
    'charisma' => 9
];

// Simular estatísticas derivadas
$derived_stats = [
    'physical_damage' => $stats['strength'] * 2 + 5,
    'magical_damage' => $stats['intelligence'] * 2 + 3,
    'defense' => $stats['constitution'] * 1.5 + 10,
    'evasion' => $stats['dexterity'] * 1 + 5,
    'critical_chance' => round($stats['dexterity'] * 0.5) . '%',
    'spell_resist' => $stats['wisdom'] * 1.2 + 8
];

// Determinar o progresso de experiência para o próximo nível
$current_exp = $character['experience'] ?? 0;
$next_level_exp = 100 * pow(1.5, $character['level']);
$exp_percentage = min(($current_exp / $next_level_exp) * 100, 100);
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    <style>
        body {
            background-color: #121212;
            color: #e0e0e0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .card {
            background-color: #1e1e1e;
            border: none;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            margin-bottom: 20px;
        }
        .card-header {
            background-color: #2d2d2d;
            color: #e0e0e0;
            font-weight: 600;
        }
        .btn-primary {
            background-color: #7e30e1;
            border-color: #7e30e1;
        }
        .btn-primary:hover {
            background-color: #6525b5;
            border-color: #6525b5;
        }
        .progress {
            background-color: #2d2d2d;
        }
        .stat-value {
            font-size: 18px;
            font-weight: bold;
        }
        .stat-name {
            color: #b0b0b0;
        }
        .skill-card {
            background-color: #2d2d2d;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            transition: transform 0.2s;
        }
        .skill-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 7px 15px rgba(0, 0, 0, 0.3);
        }
        .item-row {
            padding: 8px;
            border-bottom: 1px solid #3d3d3d;
        }
        .item-row:last-child {
            border-bottom: none;
        }
        .character-portrait {
            width: 100%;
            max-width: 200px;
            height: auto;
            border-radius: 10px;
            border: 3px solid #7e30e1;
            margin-bottom: 15px;
        }
        .nav-tabs .nav-link {
            color: #e0e0e0;
        }
        .nav-tabs .nav-link.active {
            background-color: #2d2d2d;
            color: #ffffff;
            border-color: #3d3d3d;
        }
        .navbar {
            background-color: #1e1e1e !important;
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="index.php">UmbraEternum</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="index.php">Início</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="account.php">Minha Conta</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php">Sair</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Character Content -->
    <div class="container py-5">
        <div class="row mb-4">
            <div class="col-md-12">
                <a href="account.php" class="btn btn-outline-secondary mb-3">
                    <i class="bi bi-arrow-left"></i> Voltar para Conta
                </a>
                <div class="d-flex justify-content-between align-items-center">
                    <h1><?php echo htmlspecialchars($character['name']); ?></h1>
                    <a href="character_edit.php?id=<?php echo $character_id; ?>" class="btn btn-primary">
                        <i class="bi bi-pencil"></i> Editar Personagem
                    </a>
                </div>
            </div>
        </div>
        
        <div class="row">
            <!-- Character Info Sidebar -->
            <div class="col-md-4">
                <!-- Portrait and Basic Info -->
                <div class="card mb-4">
                    <div class="card-body text-center">
                        <img src="assets/images/character-placeholder.jpg" alt="<?php echo htmlspecialchars($character['name']); ?>" class="character-portrait">
                        <h3><?php echo htmlspecialchars($character['name']); ?></h3>
                        <p>
                            <span class="badge bg-secondary"><?php echo htmlspecialchars($character['class']); ?></span>
                            <span class="badge bg-primary">Nível <?php echo htmlspecialchars($character['level']); ?></span>
                        </p>
                    </div>
                </div>
                
                <!-- Status Bars -->
                <div class="card mb-4">
                    <div class="card-header">Status</div>
                    <div class="card-body">
                        <!-- HP -->
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>HP</span>
                                <span><?php echo $character['currentHp']; ?>/<?php echo $character['maxHp']; ?></span>
                            </div>
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar bg-danger" role="progressbar" 
                                     style="width: <?php echo ($character['currentHp'] / $character['maxHp']) * 100; ?>%" 
                                     aria-valuenow="<?php echo $character['currentHp']; ?>" 
                                     aria-valuemin="0" 
                                     aria-valuemax="<?php echo $character['maxHp']; ?>">
                                    <?php echo $character['currentHp']; ?>/<?php echo $character['maxHp']; ?>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Mana -->
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <span>Mana</span>
                                <span><?php echo $character['currentMana']; ?>/<?php echo $character['maxMana']; ?></span>
                            </div>
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar bg-info" role="progressbar" 
                                     style="width: <?php echo ($character['currentMana'] / $character['maxMana']) * 100; ?>%" 
                                     aria-valuenow="<?php echo $character['currentMana']; ?>" 
                                     aria-valuemin="0" 
                                     aria-valuemax="<?php echo $character['maxMana']; ?>">
                                    <?php echo $character['currentMana']; ?>/<?php echo $character['maxMana']; ?>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Experience -->
                        <div>
                            <div class="d-flex justify-content-between mb-1">
                                <span>Experiência</span>
                                <span><?php echo $current_exp; ?>/<?php echo number_format($next_level_exp); ?></span>
                            </div>
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar bg-success" role="progressbar" 
                                     style="width: <?php echo $exp_percentage; ?>%" 
                                     aria-valuenow="<?php echo $current_exp; ?>" 
                                     aria-valuemin="0" 
                                     aria-valuemax="<?php echo $next_level_exp; ?>">
                                    <?php echo round($exp_percentage); ?>%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Basic Stats -->
                <div class="card mb-4">
                    <div class="card-header">Atributos</div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6 mb-3">
                                <div class="stat-name">Força</div>
                                <div class="stat-value"><?php echo $stats['strength']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Destreza</div>
                                <div class="stat-value"><?php echo $stats['dexterity']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Constituição</div>
                                <div class="stat-value"><?php echo $stats['constitution']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Inteligência</div>
                                <div class="stat-value"><?php echo $stats['intelligence']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Sabedoria</div>
                                <div class="stat-value"><?php echo $stats['wisdom']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Carisma</div>
                                <div class="stat-value"><?php echo $stats['charisma']; ?></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Derived Stats -->
                <div class="card">
                    <div class="card-header">Estatísticas Derivadas</div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6 mb-3">
                                <div class="stat-name">Dano Físico</div>
                                <div class="stat-value"><?php echo $derived_stats['physical_damage']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Dano Mágico</div>
                                <div class="stat-value"><?php echo $derived_stats['magical_damage']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Defesa</div>
                                <div class="stat-value"><?php echo $derived_stats['defense']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Evasão</div>
                                <div class="stat-value"><?php echo $derived_stats['evasion']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Chance Crítica</div>
                                <div class="stat-value"><?php echo $derived_stats['critical_chance']; ?></div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="stat-name">Resistência Mágica</div>
                                <div class="stat-value"><?php echo $derived_stats['spell_resist']; ?></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <ul class="nav nav-tabs card-header-tabs">
                            <li class="nav-item">
                                <a class="nav-link active" id="skills-tab" data-bs-toggle="tab" href="#skills">Habilidades</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="equipment-tab" data-bs-toggle="tab" href="#equipment">Equipamento</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="inventory-tab" data-bs-toggle="tab" href="#inventory">Inventário</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="quests-tab" data-bs-toggle="tab" href="#quests">Missões</a>
                            </li>
                        </ul>
                    </div>
                    <div class="card-body">
                        <div class="tab-content">
                            <!-- Skills Tab -->
                            <div class="tab-pane fade show active" id="skills">
                                <h3 class="mb-4">Habilidades</h3>
                                <div class="row">
                                    <?php foreach ($skills as $skill): ?>
                                        <div class="col-md-6 mb-3">
                                            <div class="skill-card">
                                                <h5><?php echo $skill['name']; ?></h5>
                                                <div class="mb-2">
                                                    <span class="badge bg-danger">Dano: <?php echo $skill['damage']; ?></span>
                                                    <span class="badge bg-info">Custo: <?php echo $skill['cost']; ?></span>
                                                    <span class="badge bg-warning text-dark">CD: <?php echo $skill['cooldown']; ?></span>
                                                </div>
                                                <p class="mb-0"><?php echo $skill['description']; ?></p>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            
                            <!-- Equipment Tab -->
                            <div class="tab-pane fade" id="equipment">
                                <h3 class="mb-4">Equipamento</h3>
                                <div class="row">
                                    <?php foreach ($equipment as $slot => $item): ?>
                                        <div class="col-md-6 mb-3">
                                            <div class="card">
                                                <div class="card-header">
                                                    <?php echo ucfirst(str_replace(['accessory1', 'accessory2'], ['Acessório 1', 'Acessório 2'], $slot)); ?>
                                                </div>
                                                <div class="card-body d-flex align-items-center">
                                                    <div class="me-3">
                                                        <i class="bi bi-shield-fill text-primary" style="font-size: 2rem;"></i>
                                                    </div>
                                                    <div>
                                                        <h5 class="mb-0"><?php echo $item; ?></h5>
                                                        <small class="text-muted">Nível requerido: <?php echo rand(1, $character['level']); ?></small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            
                            <!-- Inventory Tab -->
                            <div class="tab-pane fade" id="inventory">
                                <h3 class="mb-4">Inventário</h3>
                                <div class="card">
                                    <div class="card-body p-0">
                                        <div class="table-responsive">
                                            <table class="table table-dark table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Item</th>
                                                        <th>Quantidade</th>
                                                        <th>Descrição</th>
                                                        <th>Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <?php foreach ($inventory as $item): ?>
                                                        <tr>
                                                            <td><?php echo $item['name']; ?></td>
                                                            <td><?php echo $item['quantity']; ?></td>
                                                            <td><?php echo $item['description']; ?></td>
                                                            <td>
                                                                <button class="btn btn-sm btn-outline-primary">Usar</button>
                                                            </td>
                                                        </tr>
                                                    <?php endforeach; ?>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-3 text-muted">
                                    <small>Slots de inventário: <?php echo count($inventory); ?>/20</small>
                                </div>
                            </div>
                            
                            <!-- Quests Tab -->
                            <div class="tab-pane fade" id="quests">
                                <h3 class="mb-4">Missões</h3>
                                <div class="alert alert-info">
                                    Seu personagem ainda não possui missões ativas.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Last Login Info -->
                <div class="card mt-4">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-0"><strong>Última Localização:</strong> <?php echo $character['lastLocation'] ?? 'Cidade de Umbra'; ?></p>
                            </div>
                            <div class="col-md-6 text-md-end">
                                <p class="mb-0"><strong>Último Login:</strong> <?php echo date('d/m/Y H:i', strtotime($character['lastLogin'] ?? 'now')); ?></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html> 