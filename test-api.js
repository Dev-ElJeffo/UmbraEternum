const http = require('http');

// Função para fazer uma requisição HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Testar o status da API
async function testStatus() {
  console.log('Testando o status da API...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 34567,
      path: '/api/status',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    console.log(`Status da API: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Erro ao testar o status da API:', error.message);
    return null;
  }
}

// Testar o registro de usuário
async function testRegister() {
  console.log('\nTestando o registro de usuário...');
  
  try {
    const timestamp = Date.now();
    const username = `user_${timestamp}`;
    const email = `user_${timestamp}@test.com`;
    const password = 'Senha123';
    
    console.log(`Registrando usuário: ${username}, email: ${email}`);
    
    const options = {
      hostname: 'localhost',
      port: 34567,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const data = {
      username,
      email,
      password
    };
    
    const response = await makeRequest(options, data);
    console.log(`Status do registro: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return {
      success: response.statusCode === 201,
      username,
      password,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao testar o registro:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Testar o login de usuário
async function testLogin(username = 'admin', password = 'admin123') {
  console.log('\nTestando o login de usuário...');
  console.log(`Fazendo login com: ${username}`);
  
  try {
    const options = {
      hostname: 'localhost',
      port: 34567,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const data = {
      username,
      password
    };
    
    const response = await makeRequest(options, data);
    console.log(`Status do login: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return {
      success: response.statusCode === 200,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao testar o login:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('Executando todos os testes de API...');
  
  // Testar status
  const statusResult = await testStatus();
  
  // Testar registro
  const registerResult = await testRegister();
  
  // Testar login com usuário padrão (admin)
  const adminLoginResult = await testLogin();
  
  // Se o registro foi bem-sucedido, testar login com o novo usuário
  if (registerResult.success) {
    await testLogin(registerResult.username, registerResult.password);
  }
  
  console.log('\n=== Resumo dos Testes ===');
  console.log(`Status da API: ${statusResult ? 'OK' : 'Falha'}`);
  console.log(`Registro de usuário: ${registerResult.success ? 'OK' : 'Falha'}`);
  console.log(`Login de admin: ${adminLoginResult.success ? 'OK' : 'Falha'}`);
  console.log('=======================');
}

// Executar todos os testes
runAllTests(); 