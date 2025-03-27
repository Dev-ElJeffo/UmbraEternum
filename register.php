<?php
// Incluir configurações
require_once 'config.php';

// Inicializar variáveis
$error_message = '';
$success_message = '';

// Verificar se o usuário já está autenticado
if (is_authenticated()) {
    add_log("Redirecionando usuário já autenticado da página de registro para account.php", 'info');
    header('Location: account.php');
    exit;
}

// Processar formulário de registro
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    add_log("Tentativa de registro iniciada", 'debug');
    
    // Verificar CSRF token
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        add_log("Falha na validação do token CSRF no registro", 'warning');
        $error_message = "Erro de segurança. Por favor, tente novamente.";
    } else {
        // Obter e validar dados do formulário
        $username = isset($_POST['username']) ? sanitize_input($_POST['username']) : '';
        $email = isset($_POST['email']) ? sanitize_input($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        $confirm_password = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';
        
        // Validar campos
        if (empty($username) || empty($email) || empty($password) || empty($confirm_password)) {
            add_log("Tentativa de registro com campos vazios", 'warning');
            $error_message = "Todos os campos são obrigatórios.";
        } elseif ($password !== $confirm_password) {
            add_log("Senhas não coincidem na tentativa de registro", 'warning');
            $error_message = "As senhas não coincidem.";
        } elseif (strlen($password) < 8) {
            add_log("Senha muito curta na tentativa de registro", 'warning');
            $error_message = "A senha deve ter pelo menos 8 caracteres.";
        } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', $password)) {
            add_log("Senha sem requisitos de complexidade na tentativa de registro", 'warning');
            $error_message = "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.";
        } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            add_log("Username com caracteres inválidos na tentativa de registro", 'warning');
            $error_message = "O nome de usuário pode conter apenas letras, números e sublinhado.";
        } elseif (strlen($username) < 3 || strlen($username) > 30) {
            add_log("Username com tamanho inválido na tentativa de registro", 'warning');
            $error_message = "O nome de usuário deve ter entre 3 e 30 caracteres.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            add_log("Email inválido na tentativa de registro: $email", 'warning');
            $error_message = "Por favor, forneça um endereço de email válido.";
        } else {
            add_log("Tentativa de registro para usuário: $username, email: $email", 'info');
            
            // Fazer requisição à API
            $response = api_post_request('/auth/register', [
                'username' => $username,
                'email' => $email,
                'password' => $password
            ]);
            
            // Debug detalhado da resposta
            add_log("Resposta da API de registro: " . json_encode($response), 'debug');
            
            // Verificar resposta
            if ($response['success'] === true) {
                // Registro bem-sucedido
                add_log("Registro bem-sucedido para usuário: $username", 'info');
                $success_message = "Registro concluído com sucesso! Agora você pode fazer login.";
                
                // Opcionalmente, fazer login automático após o registro
                // Para fazer login automático, descomente o código abaixo
                /*
                $login_response = api_post_request('/auth/login', [
                    'username' => $username,
                    'password' => $password
                ]);
                
                if ($login_response['success'] === true) {
                    $_SESSION['user_id'] = $login_response['user']['id'];
                    $_SESSION['username'] = $login_response['user']['username'];
                    $_SESSION['email'] = $login_response['user']['email'];
                    $_SESSION['role'] = $login_response['user']['role'];
                    $_SESSION['access_token'] = $login_response['accessToken'];
                    $_SESSION['refresh_token'] = $login_response['refreshToken'];
                    
                    header('Location: account.php');
                    exit;
                }
                */
                
            } else {
                // Registro falhou
                $error_message = $response['message'] ?? 'Erro ao registrar a conta. Por favor, tente novamente.';
                add_log("Falha no registro para usuário: $username - Motivo: $error_message", 'warning');
            }
        }
    }
}

// Gerar token CSRF
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// Título da página
$page_title = "Registro - UmbraEternum";
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
                        <a class="nav-link" href="login.php">
                            <i class="fas fa-sign-in-alt me-1"></i> Login
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="register.php">
                            <i class="fas fa-user-plus me-1"></i> Registrar
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Register Form -->
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="login-register-container">
                    <div class="card glass-card">
                        <div class="card-header">
                            <h2 class="text-center mb-0"><i class="fas fa-user-plus me-2"></i>Criar Conta</h2>
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
                                    <div class="mt-2">
                                        <a href="login.php" class="btn btn-sm btn-primary">
                                            <i class="fas fa-sign-in-alt me-1"></i> Ir para Login
                                        </a>
                                    </div>
                                </div>
                            <?php endif; ?>
                            
                            <?php if (empty($success_message)): ?>
                            <form method="POST" action="register.php" id="registerForm">
                                <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">
                                
                                <div class="mb-3">
                                    <label for="username" class="form-label">
                                        <i class="fas fa-user me-1"></i> Nome de Usuário
                                    </label>
                                    <input type="text" class="form-control" id="username" name="username" required
                                           pattern="[a-zA-Z0-9_]{3,30}" 
                                           title="O nome de usuário deve ter entre 3 e 30 caracteres e pode conter apenas letras, números e sublinhado">
                                    <small class="form-text text-muted">Entre 3 e 30 caracteres, apenas letras, números e sublinhado.</small>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="email" class="form-label">
                                        <i class="fas fa-envelope me-1"></i> E-mail
                                    </label>
                                    <input type="email" class="form-control" id="email" name="email" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="password" class="form-label">
                                        <i class="fas fa-lock me-1"></i> Senha
                                    </label>
                                    <input type="password" class="form-control" id="password" name="password" required
                                           minlength="8"
                                           pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$"
                                           title="A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número">
                                    <small class="form-text text-muted">Mínimo de 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.</small>
                                    <div class="password-strength mt-2">
                                        <div class="progress">
                                            <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                        </div>
                                        <small class="form-text text-muted">Força da senha: <span class="strength-text">Muito fraca</span></small>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="confirm_password" class="form-label">
                                        <i class="fas fa-lock me-1"></i> Confirmar Senha
                                    </label>
                                    <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                                    <small class="form-text text-muted">Digite a senha novamente para confirmar.</small>
                                </div>
                                
                                <button type="submit" class="btn btn-primary w-100">
                                    <i class="fas fa-user-plus me-1"></i> Criar Conta
                                </button>
                            </form>
                            <?php endif; ?>
                            
                            <div class="mt-4 text-center">
                                <p>Já tem uma conta? <a href="login.php" class="text-decoration-none">Faça login</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('registerForm');
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm_password');
            const progressBar = document.querySelector('.progress-bar');
            const strengthText = document.querySelector('.strength-text');

            // Função para verificar força da senha
            function checkPasswordStrength(password) {
                let strength = 0;
                if (password.length >= 8) strength++;
                if (password.match(/[a-z]/)) strength++;
                if (password.match(/[A-Z]/)) strength++;
                if (password.match(/[0-9]/)) strength++;
                if (password.match(/[^a-zA-Z0-9]/)) strength++;

                const strengthLevels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
                const strengthColors = ['#dc3545', '#ffc107', '#17a2b8', '#28a745', '#20c997'];
                const strengthWidths = ['20%', '40%', '60%', '80%', '100%'];

                return {
                    level: strengthLevels[strength - 1] || 'Muito fraca',
                    color: strengthColors[strength - 1] || '#dc3545',
                    width: strengthWidths[strength - 1] || '20%'
                };
            }

            // Atualizar força da senha em tempo real
            password.addEventListener('input', function() {
                const strength = checkPasswordStrength(this.value);
                progressBar.style.width = strength.width;
                progressBar.style.backgroundColor = strength.color;
                strengthText.textContent = strength.level;
            });

            // Validar confirmação de senha em tempo real
            confirmPassword.addEventListener('input', function() {
                if (this.value !== password.value) {
                    this.setCustomValidity('As senhas não coincidem');
                } else {
                    this.setCustomValidity('');
                }
            });

            // Validar formulário antes de enviar
            form.addEventListener('submit', function(e) {
                if (password.value !== confirmPassword.value) {
                    e.preventDefault();
                    alert('As senhas não coincidem');
                }
            });
        });
    </script>
</body>
</html> 