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

// Criar usuário admin
async function createAdmin() {
  console.log('Criando usuário admin...');
  
  try {
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
      username: 'admin',
      email: 'admin@umbraeternum.com',
      password: 'admin123'
    };
    
    const response = await makeRequest(options, data);
    console.log(`Status da criação de admin: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return {
      success: response.statusCode === 201,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao criar admin:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar criação do admin
createAdmin()
  .then(result => {
    if (result.success) {
      console.log('Usuário admin criado com sucesso!');
    } else {
      console.log('Falha ao criar usuário admin. Provavelmente já existe.');
    }
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
  }); 