<?php
// Verificar se este arquivo está sendo incluído ou acessado diretamente
if (!defined('API_URL')) {
    require_once 'config.php';
}

// Inicializar variáveis
$players = [];
$error = '';

// Obter lista de jogadores online
try {
    add_log("Obtendo lista de jogadores online", 'debug');
    
    // Simular um array de jogadores caso não haja endpoint específico para isso
    // Em um ambiente real, você teria um endpoint como '/players/online'
    $online_users = [
        [
            'username' => 'Thormun',
            'level' => 12,
            'class' => 'Guerreiro',
            'last_active' => '2023-07-15 15:30:22'
        ],
        [
            'username' => 'Elyndra',
            'level' => 8,
            'class' => 'Mago',
            'last_active' => '2023-07-15 15:45:10'
        ],
        [
            'username' => 'Lyria',
            'level' => 10,
            'class' => 'Arqueira',
            'last_active' => '2023-07-15 15:40:05'
        ]
    ];
    
    // Tente obter jogadores online da API, se existir um endpoint para isso
    // Se a API não tiver esse endpoint, use os dados simulados acima
    $response = api_get_request('/status');
    
    // Verificar se a chave 'success' existe no array de resposta
    if (isset($response['success']) && $response['success'] === true) {
        add_log("API está online com status: " . $response['status'], 'info');
        
        // Se houver uma endpoint de jogadores online, descomentar o código abaixo
        /*
        $players_response = api_get_request('/players/online');
        if ($players_response['success'] === true && isset($players_response['data'])) {
            $online_users = $players_response['data'];
        }
        */
    } else {
        add_log("Erro ao verificar status da API: " . ($response['message'] ?? 'Erro desconhecido'), 'error');
        $error = "Não foi possível conectar ao servidor de jogos. Por favor, tente novamente mais tarde.";
    }
    
    $players = $online_users;
    
} catch (Exception $e) {
    add_log("Exceção ao obter lista de jogadores: " . $e->getMessage(), 'error');
    $error = "Ocorreu um erro ao tentar obter a lista de jogadores.";
}
?>

<!-- Lista de Jogadores -->
<div class="player-list">
    <?php if (!empty($error)): ?>
        <div class="alert alert-danger" role="alert">
            <?php echo $error; ?>
        </div>
    <?php elseif (empty($players)): ?>
        <div class="alert alert-info" role="alert">
            Nenhum jogador online no momento.
        </div>
    <?php else: ?>
        <div class="table-responsive">
            <table class="table table-dark table-hover">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Nível</th>
                        <th>Classe</th>
                        <th>Última Atividade</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($players as $player): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($player['username']); ?></td>
                            <td><?php echo isset($player['level']) ? htmlspecialchars($player['level']) : 'N/A'; ?></td>
                            <td><?php echo isset($player['class']) ? htmlspecialchars($player['class']) : 'N/A'; ?></td>
                            <td><?php echo isset($player['last_active']) ? htmlspecialchars($player['last_active']) : 'N/A'; ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <p class="text-muted text-center">Total de jogadores online: <?php echo count($players); ?></p>
    <?php endif; ?>
</div> 