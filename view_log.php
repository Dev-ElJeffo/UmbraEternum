<?php
// session_start(); // Removido pois a sessão já é iniciada em config.php
require_once('config.php');

// Verificar se o usuário está logado e é administrador
if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403); // Acesso proibido
    echo "Acesso não autorizado";
    exit;
}

// Verificar se um arquivo foi especificado
if (!isset($_GET['file']) || empty($_GET['file'])) {
    echo "Nenhum arquivo especificado";
    exit;
}

// Obter o nome do arquivo
$file = $_GET['file'];

// Por segurança, verificar se o arquivo está na pasta de logs
$logsDir = 'logs/';
$fullPath = realpath($file);
$logsPath = realpath($logsDir);

// Verificar se o arquivo existe e está dentro do diretório de logs
if (!$fullPath || strpos($fullPath, $logsPath) !== 0 || !is_file($fullPath)) {
    echo "Arquivo inválido ou não encontrado";
    exit;
}

// Verificar extensão do arquivo
$extension = pathinfo($fullPath, PATHINFO_EXTENSION);
if ($extension !== 'log') {
    echo "Tipo de arquivo inválido";
    exit;
}

// Registrar atividade
$logFile = 'logs/admin_activity.log';
// Verificar se o diretório de logs existe, se não, criar
$logDir = dirname($logFile);
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}
$timestamp = date('Y-m-d H:i:s');
$username = isset($_SESSION['username']) ? $_SESSION['username'] : 'Desconhecido';
$ip = $_SERVER['REMOTE_ADDR'];
$logMessage = "[$timestamp] $username ($ip): Visualizou arquivo de log - $file\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);

// Ler e exibir o conteúdo do arquivo (últimas 100 linhas)
$content = file($fullPath, FILE_IGNORE_NEW_LINES);
if ($content === false) {
    echo "Erro ao ler o arquivo";
    exit;
}

// Obter as últimas 100 linhas
$lines = array_slice($content, -100);

// Formatar linhas para facilitar leitura
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visualização de Log - Umbra Eternum</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>Visualização de Log</h1>
        <div class="admin-card">
            <h3>Arquivo: <?php echo basename($file); ?></h3>
            <div class="log-preview">
            <?php
            if (empty($lines)) {
                echo "Arquivo de log vazio";
            } else {
                foreach ($lines as $line) {
                    // Destacar timestamps e tipos de mensagem com cores legíveis
                    $line = preg_replace('/\[([\d-]+T[\d:.]+Z)\]/', '<span style="color:#6a0dad">[$1]</span>', $line);
                    $line = preg_replace('/\[ATIVIDADE\]/', '<span style="color:#237804">[ATIVIDADE]</span>', $line);
                    $line = preg_replace('/\[ERROR\]/', '<span style="color:#a8071a">[ERROR]</span>', $line);
                    
                    echo htmlspecialchars($line) . "<br>";
                }
            }
            ?>
            </div>
            <div style="margin-top: 20px">
                <a href="admin_tools.php" class="btn">Voltar para o Painel Admin</a>
            </div>
        </div>
    </div>
</body>
</html> 