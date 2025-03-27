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
          console.log('Erro ao parsear resposta:', responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Erro na requisição:', error);
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Fazer login para obter token
async function login(username, password) {
  console.log(`Fazendo login como ${username}...`);
  
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
    
    const data = { username, password };
    
    console.log('Enviando request para:', options.hostname, options.port, options.path);
    const response = await makeRequest(options, data);
    console.log('Status do login:', response.statusCode);
    
    if (response.statusCode === 200 && response.data.accessToken) {
      console.log('Login realizado com sucesso!');
      return response.data.accessToken;
    } else {
      console.log('Falha no login. Resposta:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error.message);
    return null;
  }
}

// Criar personagem guerreiro
async function createWarrior(token, characterData) {
  console.log('Criando personagem guerreiro...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 34567,
      path: '/api/characters',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('Enviando request para:', options.hostname, options.port, options.path);
    console.log('Dados do personagem:', characterData);
    
    const response = await makeRequest(options, characterData);
    console.log(`Status da criação de personagem: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return {
      success: response.statusCode === 201,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao criar personagem:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função principal
async function main() {
  // Fazer login como admin
  const adminToken = await login('admin', 'admin123');
  if (!adminToken) {
    console.error('Não foi possível continuar sem token de autenticação.');
    return;
  }
  
  console.log('Token obtido:', adminToken.substring(0, 20) + '...');
  
  // Criar um personagem guerreiro para o admin
  console.log('\n=== Criando personagem guerreiro ===');
  const characterData = {
    name: 'Thorkell',
    class: 'Warrior',
    level: 1,
    strength: 18,
    dexterity: 14,
    constitution: 16,
    intelligence: 8,
    wisdom: 10,
    charisma: 12,
    backstory: 'Um guerreiro bárbaro do norte, famoso por sua força e coragem em batalha.'
  };
  
  const createResult = await createWarrior(adminToken, characterData);
  
  if (createResult.success) {
    console.log('Personagem guerreiro criado com sucesso!');
  } else {
    console.error('Falha ao criar personagem guerreiro.');
  }
}

// Executar o programa
main()
  .then(() => {
    console.log('\nPrograma concluído.');
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
  }); 