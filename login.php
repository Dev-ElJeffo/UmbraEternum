<?php
// Incluir configurações
require_once 'config.php';

// Inicializar variáveis
$error_message = '';
$success_message = '';

// Verificar se o usuário já está autenticado
if (is_authenticated()) {
    add_log("Redirecionando usuário já autenticado da página de login para account.php", 'info');
    header('Location: account.php');
    exit;
}

// Processar formulário de login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    add_log("Tentativa de login iniciada", 'debug');
    
    // Verificar CSRF token (implementação básica)
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        add_log("Falha na validação do token CSRF", 'warning');
        $error_message = "Erro de segurança. Por favor, tente novamente.";
    } else {
        // Obter e validar dados do formulário
        $username = isset($_POST['username']) ? sanitize_input($_POST['username']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        
        // Validar campos
        if (empty($username) || empty($password)) {
            add_log("Tentativa de login com campos vazios", 'warning');
            $error_message = "Todos os campos são obrigatórios.";
        } else {
            add_log("Tentativa de login para usuário: $username", 'info');
            
            // Fazer requisição à API
            $response = api_post_request('/auth/login', [
                'username' => $username,
                'password' => $password
            ]);
            
            // Verificar resposta
            if ($response['success'] === true) {
                // Login bem-sucedido
                add_log("Login bem-sucedido para usuário: $username", 'info');
                
                // Armazenar tokens e informações do usuário na sessão
                $_SESSION['user_id'] = $response['user']['id'];
                $_SESSION['username'] = $response['user']['username'];
                $_SESSION['email'] = $response['user']['email'];
                $_SESSION['role'] = $response['user']['role'];
                $_SESSION['access_token'] = $response['accessToken'];
                $_SESSION['refresh_token'] = $response['refreshToken'];
                
                // Redirecionar para a conta do usuário
                header('Location: account.php');
                exit;
            } else {
                // Login falhou
                $error_message = $response['message'] ?? 'Erro ao fazer login. Credenciais inválidas.';
                add_log("Falha no login para usuário: $username - Motivo: $error_message", 'warning');
            }
        }
    }
}

// Gerar token CSRF
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// Título da página
$page_title = "Login - UmbraEternum";
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark">
        <div class="container">
            <a class="navbar-brand" href="index.php">
                <i class="fas fa-moon me-2"></i>UmbraEternum
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="index.php">
                            <i class="fas fa-home me-1"></i> Início
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="login.php">
                            <i class="fas fa-sign-in-alt me-1"></i> Login
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="register.php">
                            <i class="fas fa-user-plus me-1"></i> Registrar
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Login Form -->
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="login-register-container">
                    <div class="card glass-card">
                        <div class="card-header">
                            <h2 class="text-center mb-0"><i class="fas fa-key me-2"></i>Login</h2>
                        </div>
                        <div class="card-body">
                            <?php if (!empty($error_message)): ?>
                                <div class="message-box message-error" role="alert">
                                    <i class="fas fa-exclamation-circle me-2"></i><?php echo $error_message; ?>
                                </div>
                            <?php endif; ?>
                            
                            <?php if (!empty($success_message)): ?>
                                <div class="message-box message-success" role="alert">
                                    <i class="fas fa-check-circle me-2"></i><?php echo $success_message; ?>
                                </div>
                            <?php endif; ?>
                            
                            <form method="POST" action="login.php">
                                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                                
                                <div class="mb-3">
                                    <label for="username" class="form-label">
                                        <i class="fas fa-user me-1"></i> Nome de Usuário
                                    </label>
                                    <input type="text" class="form-control" id="username" name="username" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="password" class="form-label">
                                        <i class="fas fa-lock me-1"></i> Senha
                                    </label>
                                    <input type="password" class="form-control" id="password" name="password" required>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary btn-pulse">
                                        <i class="fas fa-sign-in-alt me-2"></i>Entrar
                                    </button>
                                </div>
                            </form>
                            
                            <div class="mt-4 text-center">
                                <p>Não tem uma conta? <a href="register.php" class="text-decoration-none">Registre-se</a></p>
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