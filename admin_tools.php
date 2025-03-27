<?php
// session_start(); // Removido pois a sessão já é iniciada em config.php
require_once('config.php');
$logFile = 'logs/admin_activity.log';

// Função para registrar atividade do administrador
function logAdminActivity($action, $details = '') {
    global $logFile;
    
    // Verificar se o diretório de logs existe, se não, criar
    $logDir = dirname($logFile);
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $username = isset($_SESSION['username']) ? $_SESSION['username'] : 'Desconhecido';
    $ip = $_SERVER['REMOTE_ADDR'];
    $logMessage = "[$timestamp] $username ($ip): $action - $details\n";
    file_put_contents($logFile, $logMessage, FILE_APPEND);
}

// Verificar se o usuário está logado e é administrador
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    logAdminActivity('Acesso negado', 'Tentativa de acesso não autorizado às ferramentas administrativas');
    header('Location: login.php?error=unauthorized');
    exit;
}

// Processar ações do administrador
if (isset($_POST['action'])) {
    $action = $_POST['action'];
    
    switch ($action) {
        case 'ban_user':
            if (isset($_POST['user_id']) && !empty($_POST['user_id'])) {
                $userId = $_POST['user_id'];
                // Fazer requisição para a API para banir o usuário
                $apiUrl = "http://localhost:34567/api/admin/users/$userId/ban";
                $ch = curl_init($apiUrl);
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $_SESSION['access_token']
                ]);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($httpCode >= 200 && $httpCode < 300) {
                    logAdminActivity('Banimento de usuário', "Usuário ID: $userId banido com sucesso");
                    $successMessage = "Usuário ID: $userId banido com sucesso";
                } else {
                    logAdminActivity('Falha no banimento', "Falha ao banir usuário ID: $userId. Código: $httpCode");
                    $errorMessage = "Falha ao banir usuário. Código de resposta: $httpCode";
                }
            }
            break;
            
        case 'unban_user':
            if (isset($_POST['user_id']) && !empty($_POST['user_id'])) {
                $userId = $_POST['user_id'];
                $apiUrl = "http://localhost:34567/api/admin/users/$userId/unban";
                $ch = curl_init($apiUrl);
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $_SESSION['access_token']
                ]);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($httpCode >= 200 && $httpCode < 300) {
                    logAdminActivity('Desbanimento de usuário', "Usuário ID: $userId desbanido com sucesso");
                    $successMessage = "Usuário ID: $userId desbanido com sucesso";
                } else {
                    logAdminActivity('Falha no desbanimento', "Falha ao desbanir usuário ID: $userId. Código: $httpCode");
                    $errorMessage = "Falha ao desbanir usuário. Código de resposta: $httpCode";
                }
            }
            break;
            
        case 'delete_character':
            if (isset($_POST['character_id']) && !empty($_POST['character_id'])) {
                $characterId = $_POST['character_id'];
                $apiUrl = "http://localhost:34567/api/characters/$characterId";
                $ch = curl_init($apiUrl);
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $_SESSION['access_token']
                ]);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($httpCode >= 200 && $httpCode < 300) {
                    logAdminActivity('Exclusão de personagem', "Personagem ID: $characterId excluído com sucesso");
                    $successMessage = "Personagem ID: $characterId excluído com sucesso";
                } else {
                    logAdminActivity('Falha na exclusão', "Falha ao excluir personagem ID: $characterId. Código: $httpCode");
                    $errorMessage = "Falha ao excluir personagem. Código de resposta: $httpCode";
                }
            }
            break;
            
        case 'promote_admin':
            if (isset($_POST['user_id']) && !empty($_POST['user_id'])) {
                $userId = $_POST['user_id'];
                $apiUrl = "http://localhost:34567/api/admin/users/$userId/promote";
                $ch = curl_init($apiUrl);
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $_SESSION['access_token']
                ]);
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                if ($httpCode >= 200 && $httpCode < 300) {
                    logAdminActivity('Promoção de usuário', "Usuário ID: $userId promovido a administrador");
                    $successMessage = "Usuário ID: $userId promovido a administrador com sucesso";
                } else {
                    logAdminActivity('Falha na promoção', "Falha ao promover usuário ID: $userId. Código: $httpCode");
                    $errorMessage = "Falha ao promover usuário. Código de resposta: $httpCode";
                }
            }
            break;
            
        case 'clear_logs':
            if (!empty($_POST['log_days']) && is_numeric($_POST['log_days'])) {
                $days = (int)$_POST['log_days'];
                $timestamp = strtotime("-$days days");
                $date = date('Y-m-d', $timestamp);
                
                // Listar arquivos de log
                $logFiles = glob('logs/activity_*.log');
                $deletedCount = 0;
                
                foreach ($logFiles as $file) {
                    $fileDate = substr(basename($file), 9, 10); // Extrair data do nome do arquivo
                    if ($fileDate < $date) {
                        if (unlink($file)) {
                            $deletedCount++;
                        }
                    }
                }
                
                logAdminActivity('Limpeza de logs', "Removidos $deletedCount arquivos de log mais antigos que $date");
                $successMessage = "Removidos $deletedCount arquivos de log mais antigos que $date";
            }
            break;
    }
}

// Buscar informações do servidor
$serverInfo = null;
$apiUrl = "http://localhost:34567/api/status";
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    $serverInfo = json_decode($response, true);
}

// Buscar lista de usuários
$usersList = [];
$apiUrl = "http://localhost:34567/api/admin/users";
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $_SESSION['access_token']
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    $usersData = json_decode($response, true);
    if (isset($usersData['success']) && $usersData['success'] && isset($usersData['data'])) {
        $usersList = $usersData['data'];
    }
}

// Buscar lista de personagens
$charactersList = [];
$apiUrl = "http://localhost:34567/api/admin/characters";
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $_SESSION['access_token']
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    $charactersData = json_decode($response, true);
    if (isset($charactersData['success']) && $charactersData['success'] && isset($charactersData['data'])) {
        $charactersList = $charactersData['data'];
    }
}

// Buscar arquivos de log
$logFiles = glob('logs/activity_*.log');
rsort($logFiles); // Mais recentes primeiro
$recentLogs = array_slice($logFiles, 0, 5); // Apenas 5 mais recentes

$pageTitle = "Painel de Administração - Umbra Eternum";
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?></title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <?php include('views/header.php'); ?>
    
    <div class="container">
        <h1>Painel de Administração</h1>
        
        <?php if (isset($errorMessage)): ?>
            <div class="admin-alert error"><?php echo $errorMessage; ?></div>
        <?php endif; ?>
        
        <?php if (isset($successMessage)): ?>
            <div class="admin-alert success"><?php echo $successMessage; ?></div>
        <?php endif; ?>
        
        <div class="admin-container">
            <div class="admin-sidebar">
                <div class="admin-card">
                    <h3>Status do Servidor</h3>
                    <?php if ($serverInfo): ?>
                        <div class="stat-box">
                            <div class="value"><?php echo $serverInfo['status']; ?></div>
                            <div class="label">Estado</div>
                        </div>
                        <div class="stat-box">
                            <div class="value"><?php echo $serverInfo['onlinePlayers']; ?></div>
                            <div class="label">Jogadores Online</div>
                        </div>
                        <div class="stat-box">
                            <div class="value"><?php echo $serverInfo['version']; ?></div>
                            <div class="label">Versão</div>
                        </div>
                        <div class="stat-box">
                            <div class="value"><?php echo $serverInfo['database']; ?></div>
                            <div class="label">Banco de Dados</div>
                        </div>
                        <div class="stat-box">
                            <div class="value"><?php echo count($usersList); ?></div>
                            <div class="label">Total de Usuários</div>
                        </div>
                        <div class="stat-box">
                            <div class="value"><?php echo count($charactersList); ?></div>
                            <div class="label">Total de Personagens</div>
                        </div>
                    <?php else: ?>
                        <p>Não foi possível obter informações do servidor.</p>
                    <?php endif; ?>
                </div>
                
                <div class="admin-card">
                    <h3>Documentação</h3>
                    <ul>
                        <li><a href="README.md" target="_blank">README Principal</a></li>
                        <li><a href="README_API.md" target="_blank">Documentação da API</a></li>
                    </ul>
                </div>
                
                <div class="admin-card">
                    <h3>Limpar Logs</h3>
                    <form method="post" action="">
                        <input type="hidden" name="action" value="clear_logs">
                        <div class="form-group">
                            <label for="log_days">Remover logs mais antigos que:</label>
                            <select name="log_days" id="log_days" class="form-control">
                                <option value="7">7 dias</option>
                                <option value="14">14 dias</option>
                                <option value="30">30 dias</option>
                                <option value="90">90 dias</option>
                            </select>
                        </div>
                        <button type="submit" class="btn">Limpar Logs</button>
                    </form>
                </div>
            </div>
            
            <div class="admin-panel">
                <div class="admin-tabs">
                    <button class="tab-button active" data-tab="users">Usuários</button>
                    <button class="tab-button" data-tab="characters">Personagens</button>
                    <button class="tab-button" data-tab="logs">Logs</button>
                </div>
                
                <!-- Aba de Usuários -->
                <div id="users-tab" class="tab-content active">
                    <div class="admin-card">
                        <h3>Gerenciamento de Usuários</h3>
                        <input type="text" id="user-search" placeholder="Pesquisar usuários..." class="search-input">
                        
                        <div class="user-list">
                            <?php if (empty($usersList)): ?>
                                <p>Nenhum usuário encontrado.</p>
                            <?php else: ?>
                                <?php foreach ($usersList as $user): ?>
                                    <div class="user-item" data-username="<?php echo $user['username']; ?>">
                                        <div>
                                            <strong><?php echo $user['username']; ?></strong> 
                                            (<?php echo $user['email']; ?>)
                                            <span class="badge <?php echo $user['role']; ?>"><?php echo $user['role']; ?></span>
                                            <span class="badge <?php echo $user['active'] ? 'active' : 'banned'; ?>">
                                                <?php echo $user['active'] ? 'Ativo' : 'Banido'; ?>
                                            </span>
                                        </div>
                                        <div>
                                            <?php if ($user['active']): ?>
                                                <form method="post" action="" style="display: inline;">
                                                    <input type="hidden" name="action" value="ban_user">
                                                    <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                    <button type="submit" class="btn btn-small btn-danger">Banir</button>
                                                </form>
                                            <?php else: ?>
                                                <form method="post" action="" style="display: inline;">
                                                    <input type="hidden" name="action" value="unban_user">
                                                    <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                    <button type="submit" class="btn btn-small">Desbanir</button>
                                                </form>
                                            <?php endif; ?>
                                            
                                            <?php if ($user['role'] !== 'admin'): ?>
                                                <form method="post" action="" style="display: inline;">
                                                    <input type="hidden" name="action" value="promote_admin">
                                                    <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                    <button type="submit" class="btn btn-small btn-warning">Promover a Admin</button>
                                                </form>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                
                <!-- Aba de Personagens -->
                <div id="characters-tab" class="tab-content">
                    <div class="admin-card">
                        <h3>Gerenciamento de Personagens</h3>
                        <input type="text" id="character-search" placeholder="Pesquisar personagens..." class="search-input">
                        
                        <div class="character-list">
                            <?php if (empty($charactersList)): ?>
                                <p>Nenhum personagem encontrado.</p>
                            <?php else: ?>
                                <?php foreach ($charactersList as $character): ?>
                                    <div class="character-item" data-name="<?php echo $character['name']; ?>">
                                        <div>
                                            <strong><?php echo $character['name']; ?></strong> 
                                            (Nível <?php echo $character['level']; ?> <?php echo $character['class']; ?>)
                                            <span class="badge">Usuário: <?php echo $character['username']; ?></span>
                                            <span class="badge <?php echo $character['active'] ? 'active' : 'inactive'; ?>">
                                                <?php echo $character['active'] ? 'Ativo' : 'Inativo'; ?>
                                            </span>
                                        </div>
                                        <div>
                                            <form method="post" action="" style="display: inline;">
                                                <input type="hidden" name="action" value="delete_character">
                                                <input type="hidden" name="character_id" value="<?php echo $character['id']; ?>">
                                                <button type="submit" class="btn btn-small btn-danger">Excluir</button>
                                            </form>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                
                <!-- Aba de Logs -->
                <div id="logs-tab" class="tab-content">
                    <div class="admin-card">
                        <h3>Logs do Sistema</h3>
                        <p>Arquivos de log mais recentes:</p>
                        
                        <select id="log-file-select" class="form-control">
                            <?php foreach ($recentLogs as $logFile): ?>
                                <option value="<?php echo $logFile; ?>"><?php echo basename($logFile); ?></option>
                            <?php endforeach; ?>
                        </select>
                        
                        <div class="log-preview" id="log-content">
                            Selecione um arquivo de log para visualizar.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <?php include('views/footer.php'); ?>
    
    <script>
        // Alternar entre abas
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                // Remover classe ativa de todos os botões e conteúdos
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Adicionar classe ativa ao botão clicado
                button.classList.add('active');
                
                // Mostrar o conteúdo correspondente
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId + '-tab').classList.add('active');
            });
        });
        
        // Filtrar usuários
        const userSearch = document.getElementById('user-search');
        if (userSearch) {
            userSearch.addEventListener('input', () => {
                const searchTerm = userSearch.value.toLowerCase();
                document.querySelectorAll('.user-item').forEach(item => {
                    const username = item.getAttribute('data-username').toLowerCase();
                    if (username.includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
        
        // Filtrar personagens
        const characterSearch = document.getElementById('character-search');
        if (characterSearch) {
            characterSearch.addEventListener('input', () => {
                const searchTerm = characterSearch.value.toLowerCase();
                document.querySelectorAll('.character-item').forEach(item => {
                    const name = item.getAttribute('data-name').toLowerCase();
                    if (name.includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
        
        // Carregar conteúdo do log
        const logFileSelect = document.getElementById('log-file-select');
        const logContent = document.getElementById('log-content');
        
        if (logFileSelect && logContent) {
            logFileSelect.addEventListener('change', () => {
                const selectedFile = logFileSelect.value;
                
                // Fazer requisição Ajax para buscar o conteúdo do log
                fetch(`view_log.php?file=${encodeURIComponent(selectedFile)}`)
                    .then(response => response.text())
                    .then(data => {
                        logContent.innerHTML = data;
                        // Rolar para o final do log
                        logContent.scrollTop = logContent.scrollHeight;
                    })
                    .catch(error => {
                        logContent.innerHTML = `Erro ao carregar arquivo: ${error}`;
                    });
            });
            
            // Carregar o primeiro log automaticamente
            if (logFileSelect.options.length > 0) {
                const event = new Event('change');
                logFileSelect.dispatchEvent(event);
            }
        }
    </script>
</body>
</html> 