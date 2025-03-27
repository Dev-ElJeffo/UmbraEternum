<?php
// Incluir configurações
require_once 'config.php';

// Verificar se o usuário está autenticado
if (is_authenticated()) {
    $username = $_SESSION['username'];
    add_log("Logout iniciado para o usuário: $username", 'info');
    
    // Fazer requisição de logout para a API se tiver um refresh token
    if (isset($_SESSION['refresh_token'])) {
        $response = api_post_request('/auth/logout', [
            'refreshToken' => $_SESSION['refresh_token']
        ]);
        
        add_log("Resposta de logout da API: " . json_encode($response), 'debug');
    }
    
    // Destruir a sessão independentemente da resposta da API
    session_unset();
    session_destroy();
    
    add_log("Sessão destruída para o usuário: $username", 'info');
} else {
    add_log("Tentativa de logout sem usuário autenticado", 'warning');
}

// Redirecionar para a página de login
header('Location: login.php');
exit;
?> 