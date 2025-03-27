<!-- Arquivo header.php - Navbar padrão para todo o site -->
<?php
// Verificar se a sessão já foi iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar se há mensagens flash para exibir
$flash_message = $_SESSION['flash_message'] ?? '';
$flash_type = $_SESSION['flash_type'] ?? 'info';

// Limpar mensagens flash após obter seu valor
if (isset($_SESSION['flash_message'])) {
    unset($_SESSION['flash_message']);
    unset($_SESSION['flash_type']);
}

// Determinar se o usuário está logado
$is_logged_in = isset($_SESSION['user_id']) && isset($_SESSION['access_token']);
$is_admin = $is_logged_in && isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
$current_page = basename($_SERVER['PHP_SELF']);
?>

<!-- Notificações -->
<?php if (!empty($flash_message)): ?>
<div class="message-box message-<?php echo $flash_type; ?>" role="alert">
    <div class="container">
        <?php echo $flash_message; ?>
        <button type="button" class="btn-close float-end" data-bs-dismiss="alert" aria-label="Fechar"></button>
    </div>
</div>
<?php endif; ?>

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
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'index.php' ? 'active' : ''; ?>" href="index.php">
                        <i class="fas fa-home me-1"></i> Início
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'news.php' ? 'active' : ''; ?>" href="news.php">
                        <i class="fas fa-newspaper me-1"></i> Notícias
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'guide.php' ? 'active' : ''; ?>" href="guide.php">
                        <i class="fas fa-book me-1"></i> Guia
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'about.php' ? 'active' : ''; ?>" href="about.php">
                        <i class="fas fa-info-circle me-1"></i> Sobre
                    </a>
                </li>
            </ul>
            
            <ul class="navbar-nav ms-auto">
                <?php if ($is_logged_in): ?>
                    <li class="nav-item">
                        <a class="nav-link <?php echo $current_page === 'account.php' ? 'active' : ''; ?>" href="account.php">
                            <i class="fas fa-user me-1"></i> Minha Conta
                        </a>
                    </li>
                    <?php if ($is_admin): ?>
                    <li class="nav-item">
                        <a class="nav-link <?php echo $current_page === 'admin_tools.php' ? 'active' : ''; ?>" href="admin_tools.php">
                            <i class="fas fa-shield-alt me-1"></i> <span class="text-danger">Painel Admin</span>
                        </a>
                    </li>
                    <?php endif; ?>
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php">
                            <i class="fas fa-sign-out-alt me-1"></i> Sair
                        </a>
                    </li>
                <?php else: ?>
                    <li class="nav-item">
                        <a class="nav-link <?php echo $current_page === 'login.php' ? 'active' : ''; ?>" href="login.php">
                            <i class="fas fa-sign-in-alt me-1"></i> Entrar
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?php echo $current_page === 'register.php' ? 'active' : ''; ?>" href="register.php">
                            <i class="fas fa-user-plus me-1"></i> Registrar
                        </a>
                    </li>
                <?php endif; ?>
            </ul>
        </div>
    </div>
</nav> 