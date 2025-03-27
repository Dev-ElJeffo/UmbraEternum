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

// Testar login do admin
async function testAdminLogin() {
  console.log('Testando login do admin...');
  
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
      username: 'admin',
      password: 'admin123'
    };
    
    const response = await makeRequest(options, data);
    console.log(`Status do login: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return {
      success: response.statusCode === 200,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar teste de login
testAdminLogin()
  .then(result => {
    if (result.success) {
      console.log('Login do admin realizado com sucesso!');
    } else {
      console.log('Falha no login do admin.');
    }
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
  }); 