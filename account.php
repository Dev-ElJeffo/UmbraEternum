<?php
// Incluir configurações
require_once 'config.php';

// Verificar se o usuário está autenticado
require_authentication();

// Inicializar variáveis
$error_message = '';
$success_message = '';
$user_info = [
    'id' => $_SESSION['user_id'] ?? '',
    'username' => $_SESSION['username'] ?? '',
    'email' => $_SESSION['email'] ?? '',
    'role' => $_SESSION['role'] ?? ''
];

// Verificar mensagens flash
if (isset($_SESSION['flash_message'])) {
    if ($_SESSION['flash_type'] == 'error') {
        $error_message = $_SESSION['flash_message'];
    } else {
        $success_message = $_SESSION['flash_message'];
    }
    
    // Limpar mensagens flash
    unset($_SESSION['flash_message']);
    unset($_SESSION['flash_type']);
}

// Log de acesso
add_log("Acesso à página da conta pelo usuário: {$user_info['username']}", 'info');

// Listar personagens do usuário
$characters = [];
try {
    add_log("Tentando obter personagens do usuário ID: {$user_info['id']}", 'debug');
    
    $response = api_get_request('/characters');
    
    if ($response['success'] === true && isset($response['data'])) {
        $characters = $response['data'];
        add_log("Obtidos " . count($characters) . " personagens", 'debug');
    } else {
        // Em caso de erro de autenticação, tente renovar o token
        if (isset($response['http_code']) && $response['http_code'] === 401) {
            add_log("Token expirado, tentando renovar", 'info');
            
            if (refresh_token()) {
                // Tentar novamente com o token renovado
                $response = api_get_request('/characters');
                
                if ($response['success'] === true && isset($response['data'])) {
                    $characters = $response['data'];
                    add_log("Obtidos " . count($characters) . " personagens após renovação de token", 'debug');
                } else {
                    add_log("Falha ao obter personagens mesmo após renovação de token", 'error');
                    $error_message = "Não foi possível obter seus personagens. Por favor, tente fazer login novamente.";
                }
            } else {
                // Falha na renovação do token, redirecionar para login
                add_log("Falha na renovação do token, redirecionando para login", 'warning');
                header('Location: logout.php');
                exit;
            }
        } else {
            add_log("Erro ao obter personagens: " . ($response['message'] ?? 'Erro desconhecido'), 'error');
            $error_message = "Erro ao carregar seus personagens. Por favor, tente novamente mais tarde.";
        }
    }
} catch (Exception $e) {
    add_log("Exceção ao obter personagens: " . $e->getMessage(), 'error');
    $error_message = "Ocorreu um erro ao processar sua solicitação.";
}

// Processar alteração de senha
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'change_password') {
    add_log("Solicitação de alteração de senha recebida", 'debug');
    
    // Verificar CSRF token
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        add_log("Falha na validação do token CSRF", 'warning');
        $error_message = "Erro de segurança. Por favor, tente novamente.";
    } else {
        // Validar campos
        $current_password = $_POST['current_password'] ?? '';
        $new_password = $_POST['new_password'] ?? '';
        $confirm_password = $_POST['confirm_password'] ?? '';
        
        if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
            $error_message = "Todos os campos são obrigatórios.";
        } elseif ($new_password !== $confirm_password) {
            $error_message = "As novas senhas não coincidem.";
        } elseif (strlen($new_password) < 6) {
            $error_message = "A nova senha deve ter pelo menos 6 caracteres.";
        } else {
            // Chamar a função para alterar a senha
            $response = change_user_password($current_password, $new_password);
            
            if ($response['success'] === true) {
                $success_message = "Senha alterada com sucesso!";
                add_log("Senha alterada com sucesso para o usuário: {$user_info['username']}", 'info');
            } else {
                $error_message = $response['message'] ?? 'Erro ao alterar a senha. Verifique se a senha atual está correta.';
                add_log("Falha na alteração de senha: $error_message", 'warning');
            }
        }
    }
}

// Gerar token CSRF
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// Título da página
$page_title = "Minha Conta - UmbraEternum";
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
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
        .form-control {
            background-color: #2d2d2d;
            border-color: #3d3d3d;
            color: #e0e0e0;
        }
        .form-control:focus {
            background-color: #2d2d2d;
            border-color: #7e30e1;
            color: #e0e0e0;
            box-shadow: 0 0 0 0.25rem rgba(126, 48, 225, 0.25);
        }
        .navbar {
            background-color: #1e1e1e !important;
        }
        .nav-tabs .nav-link {
            color: #e0e0e0;
        }
        .nav-tabs .nav-link.active {
            background-color: #2d2d2d;
            color: #ffffff;
            border-color: #3d3d3d;
        }
        .character-card {
            background-color: #2d2d2d;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            transition: transform 0.3s;
        }
        .character-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
            min-width: 300px;
        }
        .password-strength .progress {
            height: 5px;
            background-color: #3d3d3d;
        }
        .password-strength .progress-bar.very-weak { background-color: #dc3545; }
        .password-strength .progress-bar.weak { background-color: #fd7e14; }
        .password-strength .progress-bar.medium { background-color: #ffc107; }
        .password-strength .progress-bar.strong { background-color: #20c997; }
        .password-strength .progress-bar.very-strong { background-color: #198754; }
        
        .toggle-password {
            background-color: #2d2d2d;
            border-color: #3d3d3d;
            color: #e0e0e0;
        }
        .toggle-password:hover {
            background-color: #3d3d3d;
            border-color: #4d4d4d;
            color: #ffffff;
        }
    </style>
</head>
<body>
    <!-- Notificações -->
    <div id="notifications" class="notification"></div>
    
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
                        <a class="nav-link active" href="account.php">Minha Conta</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php">Sair</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Account Content -->
    <div class="container py-5">
        <h1 class="mb-4">Minha Conta</h1>
        
        <?php if (!empty($error_message)): ?>
            <div class="alert alert-danger" role="alert">
                <?php echo $error_message; ?>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($success_message)): ?>
            <div class="alert alert-success" role="alert">
                <?php echo $success_message; ?>
            </div>
        <?php endif; ?>
        
        <div class="row">
            <!-- User Info Sidebar -->
            <div class="col-md-4">
                <div class="card mb-4">
                    <div class="card-header">Informações do Usuário</div>
                    <div class="card-body">
                        <p><strong>Nome de Usuário:</strong> <?php echo htmlspecialchars($user_info['username']); ?></p>
                        <p><strong>E-mail:</strong> <?php echo htmlspecialchars($user_info['email']); ?></p>
                        <p><strong>Função:</strong> <?php echo htmlspecialchars($user_info['role']); ?></p>
                        <p id="online-status"><strong>Jogadores Online:</strong> <span class="badge bg-success">Carregando...</span></p>
                        <p id="server-status"><strong>Status do Servidor:</strong> <span class="badge bg-info">Conectando...</span></p>
                        
                        <?php if (isset($user_info['role']) && $user_info['role'] === 'admin'): ?>
                        <div class="mt-3">
                            <a href="admin_tools.php" class="btn btn-danger w-100">Painel de Administração</a>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">Alterar Senha</div>
                    <div class="card-body">
                        <form method="POST" action="account.php" id="password-form">
                            <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                            <input type="hidden" name="action" value="change_password">
                            
                            <div class="mb-3">
                                <label for="current_password" class="form-label">Senha Atual</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="current_password" name="current_password" required>
                                    <button class="btn btn-outline-secondary toggle-password" type="button" data-target="current_password">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="new_password" class="form-label">Nova Senha</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="new_password" name="new_password" required>
                                    <button class="btn btn-outline-secondary toggle-password" type="button" data-target="new_password">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                                <small class="text-muted">Mínimo de 6 caracteres</small>
                                <div class="password-strength mt-2">
                                    <div class="progress">
                                        <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                    </div>
                                    <small class="strength-text text-muted">Força da senha: Muito fraca</small>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="confirm_password" class="form-label">Confirmar Nova Senha</label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                                    <button class="btn btn-outline-secondary toggle-password" type="button" data-target="confirm_password">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </div>
                                <div id="password-match-feedback" class="invalid-feedback"></div>
                            </div>
                            
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary" id="change-password-btn">Alterar Senha</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <ul class="nav nav-tabs card-header-tabs">
                            <li class="nav-item">
                                <a class="nav-link active" id="characters-tab" data-bs-toggle="tab" href="#characters">Meus Personagens</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="activity-tab" data-bs-toggle="tab" href="#activity">Atividade Recente</a>
                            </li>
                        </ul>
                    </div>
                    <div class="card-body">
                        <div class="tab-content">
                            <!-- Characters Tab -->
                            <div class="tab-pane fade show active" id="characters">
                                <div class="d-flex justify-content-between align-items-center mb-4">
                                    <h3>Seus Personagens</h3>
                                    <button class="btn btn-primary" onclick="location.href='character_create.php'">Criar Novo</button>
                                </div>
                                
                                <?php if (empty($characters)): ?>
                                    <div class="alert alert-info">
                                        Você ainda não possui personagens. Clique no botão "Criar Novo" para começar sua jornada!
                                    </div>
                                <?php else: ?>
                                    <div class="row">
                                        <?php foreach ($characters as $character): ?>
                                            <div class="col-md-6 mb-3">
                                                <div class="character-card">
                                                    <h4><?php echo htmlspecialchars($character['name']); ?></h4>
                                                    <p>
                                                        <span class="badge bg-secondary"><?php echo htmlspecialchars($character['class']); ?></span>
                                                        <span class="badge bg-primary">Nível <?php echo htmlspecialchars($character['level']); ?></span>
                                                    </p>
                                                    <div class="progress mb-3" style="height: 10px;">
                                                        <div class="progress-bar bg-danger" role="progressbar" style="width: <?php echo ($character['currentHp'] / $character['maxHp']) * 100; ?>%"></div>
                                                    </div>
                                                    <div class="progress mb-3" style="height: 10px;">
                                                        <div class="progress-bar bg-info" role="progressbar" style="width: <?php echo ($character['currentMana'] / $character['maxMana']) * 100; ?>%"></div>
                                                    </div>
                                                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                                        <a href="character_view.php?id=<?php echo $character['id']; ?>" class="btn btn-sm btn-outline-light">Ver</a>
                                                        <a href="character_edit.php?id=<?php echo $character['id']; ?>" class="btn btn-sm btn-outline-primary">Editar</a>
                                                    </div>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                <?php endif; ?>
                            </div>
                            
                            <!-- Activity Tab -->
                            <div class="tab-pane fade" id="activity">
                                <h3 class="mb-4">Atividade Recente</h3>
                                <div id="activity-feed">
                                    <div class="alert alert-info">
                                        Carregando atividades recentes...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Conectar ao servidor Socket.IO
            const socket = io('http://localhost:34567');
            const notificationsContainer = document.getElementById('notifications');
            const onlineStatus = document.getElementById('online-status');
            const serverStatus = document.getElementById('server-status');
            const activityFeed = document.getElementById('activity-feed');
            let pingInterval;
            
            function showNotification(message, type = 'info') {
                const notification = document.createElement('div');
                notification.className = `alert alert-${type} alert-dismissible fade show`;
                notification.innerHTML = `
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                notificationsContainer.appendChild(notification);
                
                // Auto-remover após 5 segundos
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        notification.remove();
                    }, 500);
                }, 5000);
            }
            
            function updateOnlineStatus(count) {
                onlineStatus.innerHTML = `<strong>Jogadores Online:</strong> <span class="badge bg-success">${count}</span>`;
            }
            
            function addActivityItem(activity) {
                if (activityFeed.querySelector('.alert-info')) {
                    activityFeed.innerHTML = '';
                }
                
                const activityItem = document.createElement('div');
                activityItem.className = 'card mb-2';
                activityItem.innerHTML = `
                    <div class="card-body">
                        <p class="mb-1">${activity.message}</p>
                        <small class="text-muted">${new Date(activity.timestamp).toLocaleString()}</small>
                    </div>
                `;
                activityFeed.prepend(activityItem);
            }
            
            socket.on('connect', () => {
                console.log('Conectado ao servidor Socket.IO');
                serverStatus.innerHTML = '<strong>Status do Servidor:</strong> <span class="badge bg-success">Online</span>';
                
                // Enviar token de autenticação
                socket.emit('authenticate', '<?php echo $_SESSION['access_token']; ?>');
                
                // Iniciar ping a cada 30 segundos
                pingInterval = setInterval(() => {
                    socket.emit('ping', Date.now());
                }, 30000);
                
                showNotification('Conectado ao servidor de jogo!', 'success');
            });
            
            socket.on('disconnect', () => {
                console.log('Desconectado do servidor Socket.IO');
                serverStatus.innerHTML = '<strong>Status do Servidor:</strong> <span class="badge bg-danger">Offline</span>';
                
                // Limpar intervalo de ping
                if (pingInterval) {
                    clearInterval(pingInterval);
                }
                
                showNotification('Conexão com o servidor perdida. Tentando reconectar...', 'warning');
            });
            
            socket.on('players_count', (count) => {
                console.log(`Jogadores online: ${count}`);
                updateOnlineStatus(count);
            });
            
            socket.on('pong', (data) => {
                const latency = Date.now() - data;
                console.log(`Latência: ${latency}ms`);
            });
            
            socket.on('system_message', (data) => {
                showNotification(data.message, data.type || 'info');
            });
            
            socket.on('activity', (data) => {
                addActivityItem(data);
            });
            
            socket.on('login_notification', (data) => {
                showNotification(`${data.username} entrou no jogo.`, 'info');
            });
            
            socket.on('logout_notification', (data) => {
                showNotification(`${data.username} saiu do jogo.`, 'info');
            });
        });
        
        // Scripts para o formulário de alteração de senha
        document.addEventListener('DOMContentLoaded', function() {
            // Alternar visibilidade da senha
            const toggleButtons = document.querySelectorAll('.toggle-password');
            toggleButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const passwordInput = document.getElementById(targetId);
                    const icon = this.querySelector('i');
                    
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        icon.classList.remove('bi-eye');
                        icon.classList.add('bi-eye-slash');
                    } else {
                        passwordInput.type = 'password';
                        icon.classList.remove('bi-eye-slash');
                        icon.classList.add('bi-eye');
                    }
                });
            });
            
            // Verificar força da senha
            const newPassword = document.getElementById('new_password');
            const progressBar = document.querySelector('.password-strength .progress-bar');
            const strengthText = document.querySelector('.password-strength .strength-text');
            
            newPassword.addEventListener('input', function() {
                const strength = checkPasswordStrength(this.value);
                
                // Atualizar barra de progresso
                progressBar.style.width = `${strength.score * 25}%`;
                progressBar.setAttribute('aria-valuenow', strength.score * 25);
                
                // Remover classes anteriores
                progressBar.classList.remove('very-weak', 'weak', 'medium', 'strong', 'very-strong');
                
                // Adicionar classe apropriada
                progressBar.classList.add(strength.class);
                
                // Atualizar texto
                strengthText.textContent = `Força da senha: ${strength.text}`;
            });
            
            // Verificar se as senhas coincidem
            const confirmPassword = document.getElementById('confirm_password');
            const feedback = document.getElementById('password-match-feedback');
            
            confirmPassword.addEventListener('input', function() {
                if (this.value === newPassword.value) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                    feedback.textContent = '';
                } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                    feedback.textContent = 'As senhas não coincidem';
                    feedback.style.display = 'block';
                }
            });
            
            // Validar formulário antes de enviar
            const passwordForm = document.getElementById('password-form');
            passwordForm.addEventListener('submit', function(e) {
                if (newPassword.value !== confirmPassword.value) {
                    e.preventDefault();
                    confirmPassword.classList.add('is-invalid');
                    feedback.textContent = 'As senhas não coincidem';
                    feedback.style.display = 'block';
                    return false;
                }
                
                if (newPassword.value.length < 6) {
                    e.preventDefault();
                    newPassword.classList.add('is-invalid');
                    return false;
                }
                
                return true;
            });
        });
        
        // Função para verificar a força da senha
        function checkPasswordStrength(password) {
            let score = 0;
            
            // Comprimento da senha
            if (password.length >= 8) score++;
            if (password.length >= 10) score++;
            
            // Complexidade da senha
            if (/[A-Z]/.test(password)) score++; // Letras maiúsculas
            if (/[a-z]/.test(password)) score++; // Letras minúsculas
            if (/[0-9]/.test(password)) score++; // Números
            if (/[^A-Za-z0-9]/.test(password)) score++; // Caracteres especiais
            
            // Limitar o score a 4
            score = Math.min(score, 4);
            
            // Mapear score para texto e classe
            const strengthMap = [
                { text: 'Muito fraca', class: 'very-weak' },
                { text: 'Fraca', class: 'weak' },
                { text: 'Média', class: 'medium' },
                { text: 'Forte', class: 'strong' },
                { text: 'Muito forte', class: 'very-strong' }
            ];
            
            return {
                score: score,
                text: strengthMap[score].text,
                class: strengthMap[score].class
            };
        }
    </script>
</body>
</html> 