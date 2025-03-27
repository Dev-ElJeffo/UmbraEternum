<?php
// Iniciar sessão
session_start();

// Verificar se estamos em ambiente de desenvolvimento ou produção
if ($_SERVER['SERVER_NAME'] === 'localhost' || $_SERVER['SERVER_NAME'] === '127.0.0.1') {
    // Ambiente de desenvolvimento
    define('AMBIENTE', 'desenvolvimento');
    define('DEBUG', true);
    define('API_URL', 'http://localhost:34567/api');
    define('SOCKET_URL', 'http://localhost:34567');
} else {
    // Ambiente de produção
    define('AMBIENTE', 'producao');
    define('DEBUG', false);
    define('API_URL', 'https://api.umbraeternum.com/api');
    define('SOCKET_URL', 'https://api.umbraeternum.com');
}

// Outras configurações
define('NOME_JOGO', 'Umbra Eternum');
define('VERSAO', '0.1.0');
define('EMAIL_CONTATO', 'contato@umbraeternum.com');

// Configurações de banco de dados (caso seja necessário)
// Lendo as configurações do arquivo .env para manter consistência
$env_file = __DIR__ . '/.env';
$db_config = [];

if (file_exists($env_file)) {
    $env_content = file_get_contents($env_file);
    $lines = explode("\n", $env_content);
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        list($key, $value) = explode('=', $line, 2) + [null, null];
        if ($key && $value) {
            $db_config[trim($key)] = trim($value);
        }
    }
}

define('DB_HOST', $db_config['DB_HOST'] ?? 'localhost');
define('DB_USER', $db_config['DB_USER'] ?? 'root');
define('DB_PASS', $db_config['DB_PASSWORD'] ?? '!Mister4126');
define('DB_NAME', $db_config['DB_NAME'] ?? 'umbraeternum_new');

// Diretório para logs
define('LOG_DIR', __DIR__ . '/logs');

// Criar diretório de logs se não existir
if (!file_exists(LOG_DIR)) {
    mkdir(LOG_DIR, 0755, true);
}

/**
 * Função para adicionar entradas no log
 * 
 * @param string $message Mensagem para o log
 * @param string $level Nível do log (info, error, debug, etc)
 * @return void
 */
function add_log($message, $level = 'info')
{
    if (!DEBUG && $level === 'debug') {
        return;
    }

    $log_file = LOG_DIR . '/app_' . date('Y-m-d') . '.log';
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] [$level] $message" . PHP_EOL;
    
    file_put_contents($log_file, $log_entry, FILE_APPEND);
    
    // Também exibir em modo de debug se for um erro
    if (DEBUG && ($level == 'error' || $level == 'debug')) {
        error_log($log_entry);
    }
}

/**
 * Realiza uma requisição POST para a API
 * 
 * @param string $endpoint Endpoint da API
 * @param array $data Dados para enviar
 * @param array $headers Cabeçalhos adicionais
 * @return array Resposta da API
 */
function api_post_request($endpoint, $data = [], $headers = [])
{
    $url = API_URL . $endpoint;
    
    // Inicializar cURL
    $ch = curl_init($url);
    
    // Configurar requisição
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // Timeout de conexão em segundos
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Timeout total da operação em segundos
    
    // Adicionar cabeçalhos padrão
    $default_headers = [
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    
    // Adicionar token de autorização, se disponível
    if (isset($_SESSION['access_token'])) {
        $default_headers[] = 'Authorization: Bearer ' . $_SESSION['access_token'];
    }
    
    // Mesclar cabeçalhos padrão com cabeçalhos adicionais
    $all_headers = array_merge($default_headers, $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $all_headers);
    
    // Debug log
    add_log("Enviando requisição POST para: $url", 'debug');
    add_log("Dados: " . json_encode($data), 'debug');
    add_log("Cabeçalhos: " . json_encode($all_headers), 'debug');
    
    // Executar requisição
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    $curl_errno = curl_errno($ch);
    
    // Fechar conexão
    curl_close($ch);
    
    // Verificar erros de conexão
    if ($response === false) {
        add_log("Erro na requisição cURL ($curl_errno): $curl_error", 'error');
        
        // Mensagens de erro mais específicas
        $error_message = 'Erro na conexão com o servidor';
        if ($curl_errno == CURLE_COULDNT_CONNECT) {
            $error_message = 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando.';
            
            // Verificar se podemos conectar ao banco de dados diretamente
            if (function_exists('mysqli_connect')) {
                $db_connection = @mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
                if (!$db_connection) {
                    $error_message .= ' Também não foi possível conectar ao banco de dados. ' . mysqli_connect_error();
                } else {
                    mysqli_close($db_connection);
                    $error_message .= ' No entanto, a conexão com o banco de dados está funcionando.';
                }
            }
        } elseif ($curl_errno == CURLE_OPERATION_TIMEDOUT) {
            $error_message = 'A conexão com o servidor atingiu o tempo limite. Tente novamente mais tarde.';
        }
        
        return [
            'success' => false,
            'message' => $error_message,
            'http_code' => $http_code,
            'curl_error' => $curl_error,
            'curl_errno' => $curl_errno
        ];
    }
    
    // Decodificar resposta
    $decoded_response = json_decode($response, true);
    
    // Debug log
    add_log("Resposta recebida (HTTP $http_code): " . substr($response, 0, 500) . (strlen($response) > 500 ? '...' : ''), 'debug');
    
    // Verificar se a resposta é válida
    if ($decoded_response === null) {
        add_log("Erro ao decodificar resposta JSON. HTTP Code: $http_code, Resposta: " . substr($response, 0, 1000), 'error');
        
        // Verificar tipos comuns de erro
        if ($http_code >= 500) {
            $message = 'Erro interno do servidor. Por favor, tente novamente mais tarde.';
        } elseif ($http_code == 404) {
            $message = 'API não encontrada. Verifique se o servidor está configurado corretamente.';
        } elseif ($http_code == 401 || $http_code == 403) {
            $message = 'Não autorizado. Verifique suas credenciais.';
        } else {
            $message = 'Resposta inválida do servidor. Detalhes: ' . substr($response, 0, 100);
        }
        
        return [
            'success' => false,
            'message' => $message,
            'http_code' => $http_code,
            'raw_response' => $response
        ];
    }
    
    // Adicionar código HTTP à resposta
    $decoded_response['http_code'] = $http_code;
    
    // Se o código HTTP for de erro, mas a resposta não tem um campo 'success', adicione-o
    if ($http_code >= 400 && !isset($decoded_response['success'])) {
        $decoded_response['success'] = false;
    }
    
    return $decoded_response;
}

/**
 * Realiza uma requisição GET para a API
 * 
 * @param string $endpoint Endpoint da API
 * @param array $params Parâmetros de consulta
 * @param array $headers Cabeçalhos adicionais
 * @return array Resposta da API
 */
function api_get_request($endpoint, $params = [], $headers = [])
{
    $url = API_URL . $endpoint;
    
    // Adicionar parâmetros à URL, se houver
    if (!empty($params)) {
        $url .= '?' . http_build_query($params);
    }
    
    // Inicializar cURL
    $ch = curl_init($url);
    
    // Configurar requisição
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // Timeout de conexão em segundos
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // Timeout total da operação em segundos
    
    // Adicionar cabeçalhos padrão
    $default_headers = [
        'Accept: application/json'
    ];
    
    // Adicionar token de autorização, se disponível
    if (isset($_SESSION['access_token'])) {
        $default_headers[] = 'Authorization: Bearer ' . $_SESSION['access_token'];
    }
    
    // Mesclar cabeçalhos padrão com cabeçalhos adicionais
    $all_headers = array_merge($default_headers, $headers);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $all_headers);
    
    // Debug log
    add_log("Enviando requisição GET para: $url", 'debug');
    add_log("Cabeçalhos: " . json_encode($all_headers), 'debug');
    
    // Executar requisição
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    
    // Fechar conexão
    curl_close($ch);
    
    // Verificar erros
    if ($response === false) {
        add_log("Erro na requisição cURL: $curl_error", 'error');
        return [
            'success' => false,
            'message' => 'Erro na conexão com o servidor: ' . $curl_error,
            'http_code' => $http_code
        ];
    }
    
    // Decodificar resposta
    $decoded_response = json_decode($response, true);
    
    // Debug log
    add_log("Resposta recebida (HTTP $http_code): " . substr($response, 0, 500) . (strlen($response) > 500 ? '...' : ''), 'debug');
    
    // Verificar se a resposta é válida
    if ($decoded_response === null) {
        add_log("Erro ao decodificar resposta JSON: $response", 'error');
        return [
            'success' => false,
            'message' => 'Resposta inválida do servidor',
            'http_code' => $http_code,
            'raw_response' => $response
        ];
    }
    
    // Adicionar código HTTP à resposta
    $decoded_response['http_code'] = $http_code;
    
    return $decoded_response;
}

/**
 * Sanitiza uma string para uso seguro
 * 
 * @param string $input String para sanitizar
 * @return string String sanitizada
 */
function sanitize_input($input)
{
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Verifica se o usuário está autenticado
 * 
 * @return bool Verdadeiro se o usuário estiver autenticado
 */
function is_authenticated()
{
    return isset($_SESSION['user_id']) && isset($_SESSION['access_token']);
}

/**
 * Redireciona para a página de login se o usuário não estiver autenticado
 * 
 * @return void
 */
function require_authentication()
{
    if (!is_authenticated()) {
        add_log("Tentativa de acesso a página restrita sem autenticação", 'warning');
        header('Location: login.php');
        exit;
    }
}

/**
 * Atualiza o token de acesso usando o token de atualização
 * 
 * @return bool Verdadeiro se o token foi atualizado com sucesso
 */
function refresh_token()
{
    if (!isset($_SESSION['refresh_token'])) {
        add_log("Tentativa de atualizar token sem refresh_token", 'error');
        return false;
    }
    
    $response = api_post_request('/auth/refresh-token', [
        'refreshToken' => $_SESSION['refresh_token']
    ]);
    
    if ($response['success'] === true && isset($response['accessToken'])) {
        $_SESSION['access_token'] = $response['accessToken'];
        add_log("Token de acesso atualizado com sucesso", 'info');
        return true;
    }
    
    add_log("Falha ao atualizar token de acesso: " . ($response['message'] ?? 'Erro desconhecido'), 'error');
    return false;
}

/**
 * Função auxiliar para redirecionar com mensagem
 * 
 * @param string $url URL para redirecionar
 * @param string $message Mensagem para exibir
 * @param string $type Tipo da mensagem (error, success, info)
 * @return void
 */
function redirect($url, $message = '', $type = 'error')
{
    if (!empty($message)) {
        $_SESSION['flash_message'] = $message;
        $_SESSION['flash_type'] = $type;
    }
    
    header("Location: $url");
    exit;
}

// Configuração de fuso horário
date_default_timezone_set('America/Sao_Paulo');

// Exibir todas as mensagens de erro em ambiente de desenvolvimento
if (DEBUG) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
}

// Registrar início da aplicação
add_log("Aplicação iniciada - " . AMBIENTE . " - API: " . API_URL, 'info');

// Verificar conectividade com a API no carregamento
$api_status = api_get_request('/status');
if ($api_status['success']) {
    add_log("Conexão com a API estabelecida: " . API_URL, 'info');
    if (isset($api_status['database'])) {
        add_log("Status do banco de dados: " . $api_status['database'], 'info');
    }
    if (isset($api_status['onlinePlayers'])) {
        add_log("Jogadores online: " . $api_status['onlinePlayers'], 'info');
    }
} else {
    add_log("Falha na conexão com a API: " . ($api_status['message'] ?? 'Erro desconhecido'), 'error');
}

/**
 * Altera a senha do usuário
 * 
 * @param string $current_password Senha atual
 * @param string $new_password Nova senha
 * @return array Resultado da operação
 */
function change_user_password($current_password, $new_password)
{
    add_log("Tentando alterar senha do usuário", 'debug');
    
    $result = api_post_request('/users/change-password', [
        'currentPassword' => $current_password,
        'newPassword' => $new_password
    ]);
    
    if ($result['success'] === true) {
        add_log("Senha alterada com sucesso", 'info');
    } else {
        add_log("Falha ao alterar senha: " . ($result['message'] ?? 'Erro desconhecido'), 'error');
    }
    
    return $result;
} 