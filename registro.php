<?php
/**
 * UmbraEternum - Página de Registro
 */

// Define o título da página
$page_title = 'Registrar';
// Incluir arquivo de inicialização
require_once 'config.php';

// Verificar se o usuário já está logado
if (isset($_SESSION['user']) && isset($_SESSION['token'])) {
    redirect('account.php');
    exit; // Certifica que o script termina após redirecionamento
}

$errors = [];

// Processa o formulário de registro
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validação básica
    $username = htmlspecialchars(trim($_POST['username'] ?? ''));
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    // Verificações
    if (empty($username) || empty($email) || empty($password) || empty($confirm_password)) {
        $error_message = 'Por favor, preencha todos os campos.';
    } elseif ($password !== $confirm_password) {
        $error_message = 'As senhas não coincidem.';
    } elseif (strlen($password) < 6) {
        $error_message = 'A senha deve ter pelo menos 6 caracteres.';
    } else {
        // Dados para enviar ao API
        $data = [
            'username' => $username,
            'email' => $email,
            'password' => $password
        ];
        
        // Envia requisição POST para API de registro
        $api_url = API_URL . API_REGISTER_ENDPOINT;
        $response = curl_post_request($api_url, $data);
        
        // Debug (apenas em modo de desenvolvimento)
        if (ENVIRONMENT === 'development') {
            error_log("API Register Response: " . print_r($response, true));
        }
        
        // Verifica se a resposta foi bem-sucedida
        if (isset($response['success']) && $response['success'] === true) {
            // Define mensagem de sucesso
            setFlashMessage('Registro realizado com sucesso! Faça login para continuar.', 'success');
            // Redireciona para a página de login
            redirect('login.php');
            exit; // Certifica que o script termina após redirecionamento
        } else {
            // Exibe a mensagem de erro da API ou uma mensagem genérica
            $error_message = isset($response['message']) 
                ? $response['message'] 
                : 'Falha no registro. Por favor, tente novamente.';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro - UmbraEternum</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <?php require_once 'includes/header.php'; ?>
    
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
                                <div class="message-box message-error">
                                    <i class="fas fa-exclamation-circle me-2"></i><?php echo htmlspecialchars($error_message); ?>
                                </div>
                            <?php endif; ?>
                            
                            <form method="POST" action="register.php">
                                <div class="mb-3">
                                    <label for="username" class="form-label">
                                        <i class="fas fa-user me-1"></i> Nome de Usuário
                                    </label>
                                    <input type="text" class="form-control" id="username" name="username" 
                                           value="<?php echo isset($username) ? htmlspecialchars($username) : ''; ?>" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="email" class="form-label">
                                        <i class="fas fa-envelope me-1"></i> Email
                                    </label>
                                    <input type="email" class="form-control" id="email" name="email" 
                                           value="<?php echo isset($email) ? htmlspecialchars($email) : ''; ?>" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="password" class="form-label">
                                        <i class="fas fa-lock me-1"></i> Senha
                                    </label>
                                    <input type="password" class="form-control" id="password" name="password" required>
                                    <small class="form-text text-muted">A senha deve ter pelo menos 6 caracteres.</small>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="confirm_password" class="form-label">
                                        <i class="fas fa-lock me-1"></i> Confirmar Senha
                                    </label>
                                    <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary btn-pulse">
                                        <i class="fas fa-user-plus me-2"></i>Registrar
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div class="card-footer text-center">
                            <p>Já tem uma conta? <a href="login.php">Faça Login</a></p>
                        </div>
                    </div>
                </div>
                
                <?php if (ENVIRONMENT === 'development'): ?>
                <!-- Informações de debug - apenas visíveis em ambiente de desenvolvimento -->
                <div class="card glass-card mt-4">
                    <div class="card-header bg-secondary text-white">
                        <h5 class="mb-0"><i class="fas fa-bug me-2"></i>Informações de Debug</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>API URL:</strong> <?php echo API_URL . API_REGISTER_ENDPOINT; ?></p>
                        <p><strong>Formato esperado dos dados:</strong></p>
                        <pre class="bg-light p-3 rounded">
{
    "username": "seu_nome_usuario",
    "email": "seu_email@exemplo.com",
    "password": "sua_senha"
}
                        </pre>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html> 