<?php
// Página de lista de jogadores online
add_log("Carregando lista de jogadores", 'debug');

// Verificar se a API está acessível
$api_status = api_get_request('/status');

if (!isset($api_status['success']) || !$api_status['success']) {
    echo '<div class="alert alert-warning" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i> Não foi possível conectar ao servidor de jogo. Tente novamente mais tarde.
          </div>';
    return;
}

// Se estiver conectado, obter a contagem de jogadores online
$online_count = $api_status['onlinePlayers'] ?? 0;

// Exibir a lista de jogadores (simulado para demonstração)
// Em uma implementação real, você faria uma requisição para obter a lista de jogadores online
$demo_players = [
    ['username' => 'Aragorn', 'class' => 'guerreiro', 'level' => 42],
    ['username' => 'Gandalf', 'class' => 'mago', 'level' => 38],
    ['username' => 'Legolas', 'class' => 'arqueiro', 'level' => 35]
];

// Classe para ícones
$class_icons = [
    'guerreiro' => 'fas fa-shield-alt',
    'mago' => 'fas fa-hat-wizard',
    'arqueiro' => 'fas fa-bow-arrow',
    'sacerdote' => 'fas fa-pray',
    'assassino' => 'fas fa-mask',
    'paladino' => 'fas fa-shield-cross'
];

// Classe para cores
$class_colors = [
    'guerreiro' => 'primary',
    'mago' => 'info',
    'arqueiro' => 'success',
    'sacerdote' => 'light',
    'assassino' => 'danger',
    'paladino' => 'warning'
];
?>

<div class="online-players-container">
    <div class="card bg-dark shadow mb-4">
        <div class="card-header bg-dark">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-users me-2"></i> Jogadores Online</h5>
                <span class="badge bg-primary rounded-pill"><?php echo $online_count; ?></span>
            </div>
        </div>
        
        <div class="card-body p-0">
            <?php if ($online_count > 0): ?>
                <ul class="list-group list-group-flush bg-transparent">
                    <?php foreach ($demo_players as $player): ?>
                        <li class="list-group-item bg-dark text-light border-secondary">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <i class="<?php echo $class_icons[$player['class']] ?? 'fas fa-user'; ?> me-2 text-<?php echo $class_colors[$player['class']] ?? 'secondary'; ?>"></i>
                                    <span class="fw-bold"><?php echo htmlspecialchars($player['username']); ?></span>
                                </div>
                                <div>
                                    <span class="badge bg-secondary me-1"><?php echo ucfirst($player['class']); ?></span>
                                    <span class="badge bg-primary">Nível <?php echo $player['level']; ?></span>
                                </div>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <div class="text-center py-4">
                    <p class="text-muted mb-0">Nenhum jogador online no momento.</p>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="card-footer text-center">
            <small class="text-muted">Atualizado em: <?php echo date('d/m/Y H:i:s'); ?></small>
        </div>
    </div>
</div> 