/**
 * Script de teste para APIs RESTful do UmbraEternum
 */

const axios = require('axios');

// Configurações
const API_URL = 'http://localhost:34567/api';
const TEST_USER = {
  username: `api_tester_${Date.now()}`,
  email: `api_tester_${Date.now()}@test.com`,
  password: 'Test123!'
};

// Armazenar tokens e dados para usar nas requisições
const testData = {
  accessToken: null,
  refreshToken: null,
  userId: null
};

// Auxiliar para fazer log com timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Função para imprimir resultados de testes
function printResponse(name, status, data) {
  log(`==== ${name} ====`);
  log(`Status: ${status}`);
  log(`Resposta: ${JSON.stringify(data, null, 2)}`);
  log('=================\n');
}

// Função para testar registro
async function testRegister(data) {
    try {
        console.log('\nTestando registro com dados:', JSON.stringify(data, null, 2));
        const response = await axios.post(`${API_URL}/auth/register`, data);
        console.log('Resposta de sucesso:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('Erro recebido:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            code: error.response?.data?.code
        });
    }
}

// Executar testes
async function runTests() {
    console.log('=== Iniciando testes de registro ===\n');

    // Teste 1: Campos vazios
    console.log('Teste 1: Campos vazios');
    await testRegister({});

    // Teste 2: Username muito curto
    console.log('\nTeste 2: Username muito curto');
    await testRegister({
        username: 'ab',
        email: 'test@example.com',
        password: 'Senha123'
    });

    // Teste 3: Username muito longo
    console.log('\nTeste 3: Username muito longo');
    await testRegister({
        username: 'a'.repeat(31),
        email: 'test@example.com',
        password: 'Senha123'
    });

    // Teste 4: Username com caracteres inválidos
    console.log('\nTeste 4: Username com caracteres inválidos');
    await testRegister({
        username: 'test@user',
        email: 'test@example.com',
        password: 'Senha123'
    });

    // Teste 5: Email inválido
    console.log('\nTeste 5: Email inválido');
    await testRegister({
        username: 'testuser',
        email: 'invalid-email',
        password: 'Senha123'
    });

    // Teste 6: Senha muito curta
    console.log('\nTeste 6: Senha muito curta');
    await testRegister({
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
    });

    // Teste 7: Senha sem maiúscula
    console.log('\nTeste 7: Senha sem maiúscula');
    await testRegister({
        username: 'testuser',
        email: 'test@example.com',
        password: 'senha123'
    });

    // Teste 8: Senha sem minúscula
    console.log('\nTeste 8: Senha sem minúscula');
    await testRegister({
        username: 'testuser',
        email: 'test@example.com',
        password: 'SENHA123'
    });

    // Teste 9: Senha sem número
    console.log('\nTeste 9: Senha sem número');
    await testRegister({
        username: 'testuser',
        email: 'test@example.com',
        password: 'SenhaTeste'
    });

    // Teste 10: Registro válido
    console.log('\nTeste 10: Registro válido');
    await testRegister({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Senha123'
    });

    // Teste 11: Tentativa de registro com username já existente
    console.log('\nTeste 11: Username já existente');
    await testRegister({
        username: 'testuser',
        email: 'test2@example.com',
        password: 'Senha123'
    });

    // Teste 12: Tentativa de registro com email já existente
    console.log('\nTeste 12: Email já existente');
    await testRegister({
        username: 'testuser2',
        email: 'test@example.com',
        password: 'Senha123'
    });
}

// Teste específico para validação de username e senha
async function testInvalidRegistration() {
    console.log('\n=== Teste de Validação de Registro ===\n');

    // Teste com username inválido (jogg)
    console.log('Testando registro com username inválido (jogg)');
    await testRegister({
        username: 'jogg',
        email: 'test@example.com',
        password: 'Senha123'
    });

    // Teste com senha inválida (sen123)
    console.log('\nTestando registro com senha inválida (sen123)');
    await testRegister({
        username: 'testuser',
        email: 'test@example.com',
        password: 'sen123'
    });

    // Teste com ambos inválidos
    console.log('\nTestando registro com username e senha inválidos');
    await testRegister({
        username: 'jogg',
        email: 'test@example.com',
        password: 'sen123'
    });
}

// Executar todos os testes de API
async function runApiTests() {
  try {
    await testServerStatus();
    
    // Registrar usuário de teste
    await testRegister(TEST_USER);
    
    // Aguardar um momento antes de tentar login
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testLogin();
    
    // Testes que requerem autenticação
    if (testData.accessToken) {
      await testAuthenticatedEndpoints();
    }
    
    // Finaliza o teste
    log('Todos os testes concluídos com sucesso!');
  } catch (error) {
    log('Erro durante a execução dos testes:');
    if (error.response) {
      console.error('Resposta da API:', error.response.status, error.response.data);
    } else {
      console.error(error);
    }
  }
}

// Verificar status do servidor
async function testServerStatus() {
  try {
    log('Testando status do servidor...');
    const response = await axios.get(`${API_URL}/status`);
    printResponse('Status do Servidor', response.status, response.data);
    return response;
  } catch (error) {
    log('Erro ao verificar status do servidor');
    throw error;
  }
}

// Login de usuário
async function testLogin() {
  try {
    log(`Testando login com usuário: ${TEST_USER.username}`);
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password
    });
    
    printResponse('Login de Usuário', response.status, response.data);
    
    // Atualizar tokens
    if (response.data.accessToken) {
      testData.accessToken = response.data.accessToken;
      testData.refreshToken = response.data.refreshToken;
    }
    
    return response;
  } catch (error) {
    log('Erro ao fazer login');
    throw error;
  }
}

// Testar endpoints que requerem autenticação
async function testAuthenticatedEndpoints() {
  // Configurar cabeçalho de autenticação
  const authHeader = {
    headers: {
      Authorization: `Bearer ${testData.accessToken}`
    }
  };
  
  // Testar atualização de token
  try {
    log('Testando renovação de token...');
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refreshToken: testData.refreshToken
    });
    
    printResponse('Renovação de Token', response.status, response.data);
    
    // Atualizar tokens novamente
    if (response.data.accessToken) {
      testData.accessToken = response.data.accessToken;
      testData.refreshToken = response.data.refreshToken;
    }
  } catch (error) {
    log('Erro ao renovar token (este endpoint pode não existir)');
    console.error(error.message);
  }
  
  // Testar logout
  try {
    log('Testando logout...');
    const response = await axios.post(`${API_URL}/auth/logout`, {
      refreshToken: testData.refreshToken
    }, authHeader);
    
    printResponse('Logout', response.status, response.data || 'Sem conteúdo (esperado)');
  } catch (error) {
    log('Erro ao fazer logout (este endpoint pode não existir)');
    console.error(error.message);
  }
}

// Executar os testes
log('Iniciando testes de API RESTful...');
runApiTests().catch(console.error); 