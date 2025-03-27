<?php
// Verificar se estamos em modo de manutenção
$maintenance_mode = false;
$current_page = isset($_GET['p']) ? $_GET['p'] : 'home';

// Incluir arquivos de configuração
require_once 'config.php';

// Verificar se o usuário já está autenticado
$is_logged_in = is_authenticated();

// Log de acesso à página inicial
add_log("Acesso à página inicial. Usuário autenticado: " . ($is_logged_in ? 'Sim' : 'Não'), 'info');

// Título da página
$page_title = "UmbraEternum - RPG Online";
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?></title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/style.css">
    
    <!-- Socket.IO -->
    <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
</head>
<body class="bg-dark text-light">
    <?php if ($maintenance_mode): ?>
        <div class="maintenance-mode">
            <div class="container text-center py-5">
                <h1 class="display-3 mb-4"><i class="fas fa-wrench me-3"></i>Manutenção em Andamento</h1>
                <p class="lead">Estamos realizando atualizações para melhorar sua experiência.</p>
                <p>Voltaremos em breve. Obrigado pela compreensão.</p>
                <div class="mt-4">
                    <a href="https://discord.gg/umbraeternum" class="btn btn-outline-light btn-lg" target="_blank">
                        <i class="fab fa-discord me-2"></i> Acompanhe no Discord
                    </a>
                </div>
            </div>
        </div>
    <?php else: ?>
        <!-- Incluir o cabeçalho -->
        <?php include 'views/header.php'; ?>
        
        <!-- Conteúdo Principal -->
        <main class="main-content">
            <?php
            switch ($current_page) {
                case 'home':
                    include 'views/home.php';
                    break;
                    
                case 'about':
                    include 'views/about.php';
                    break;
                    
                case 'news':
                    include 'views/news.php';
                    break;
                    
                case 'guide':
                    include 'views/guide.php';
                    break;
                    
                case 'login':
                    include 'login.php';
                    break;
                    
                case 'register':
                    include 'register.php';
                    break;
                    
                case 'account':
                    if (isset($_SESSION['user_id'])) {
                        include 'account.php';
                    } else {
                        include 'login.php';
                    }
                    break;
                    
                default:
                    include 'views/home.php';
            }
            ?>
        </main>
        
        <!-- Incluir o rodapé -->
        <?php include 'views/footer.php'; ?>
    <?php endif; ?>
    
    <!-- Scripts JavaScript -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Verificar status do servidor
            fetch('<?php echo API_URL; ?>/status')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Atualizar status do servidor
                        const serverStatusElement = document.getElementById('serverStatus');
                        if (serverStatusElement) {
                            serverStatusElement.innerHTML = `
                                <p class="mb-0">
                                    <span class="badge bg-success me-2">Online</span>
                                    <span class="text-light">Servidor operacional</span>
                                </p>
                                <p class="text-muted small mb-0">Última atualização: ${new Date().toLocaleTimeString()}</p>
                            `;
                        }
                        
                        // Atualizar contagem de jogadores online
                        const onlinePlayersElement = document.getElementById('onlinePlayers');
                        if (onlinePlayersElement) {
                            onlinePlayersElement.innerHTML = `
                                <p class="mb-0">
                                    <span class="badge bg-primary me-2">${data.onlinePlayers}</span>
                                    <span class="text-light">Jogadores online</span>
                                </p>
                            `;
                        }
                    } else {
                        // Servidor offline
                        const serverStatusElement = document.getElementById('serverStatus');
                        if (serverStatusElement) {
                            serverStatusElement.innerHTML = `
                                <p class="mb-0">
                                    <span class="badge bg-danger me-2">Offline</span>
                                    <span class="text-light">Servidor indisponível</span>
                                </p>
                                <p class="text-muted small mb-0">Última verificação: ${new Date().toLocaleTimeString()}</p>
                            `;
                        }
                    }
                })
                .catch(error => {
                    console.error('Erro ao verificar status do servidor:', error);
                    // Atualizar status do servidor como offline em caso de erro
                    const serverStatusElement = document.getElementById('serverStatus');
                    if (serverStatusElement) {
                        serverStatusElement.innerHTML = `
                            <p class="mb-0">
                                <span class="badge bg-danger me-2">Offline</span>
                                <span class="text-light">Não foi possível verificar o status</span>
                            </p>
                            <p class="text-muted small mb-0">Última verificação: ${new Date().toLocaleTimeString()}</p>
                        `;
                    }
                });
        });
    </script>
</body>
</html> 