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

// Listar personagens
async function listCharacters(token) {
  console.log('Listando personagens...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 34567,
      path: '/api/characters',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('Enviando request para:', options.hostname, options.port, options.path);
    const response = await makeRequest(options);
    console.log(`Status da listagem de personagens: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.data.success) {
      return {
        success: true,
        data: response.data.data
      };
    } else {
      console.log('Falha ao listar personagens:', response.data);
      return {
        success: false,
        data: []
      };
    }
  } catch (error) {
    console.error('Erro ao listar personagens:', error.message);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

// Atualizar personagem
async function updateCharacter(token, characterId, updateData) {
  console.log(`Atualizando personagem ID ${characterId}...`);
  
  try {
    const options = {
      hostname: 'localhost',
      port: 34567,
      path: `/api/characters/${characterId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('Enviando request para:', options.hostname, options.port, options.path);
    console.log('Dados de atualização:', updateData);
    
    const response = await makeRequest(options, updateData);
    console.log(`Status da atualização de personagem: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return {
      success: response.statusCode === 200,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao atualizar personagem:', error.message);
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
  
  // Listar personagens para obter o ID do guerreiro
  console.log('\n=== Buscando personagens ===');
  const charactersResult = await listCharacters(adminToken);
  
  if (!charactersResult.success) {
    console.error('Não foi possível listar os personagens.');
    return;
  }
  
  // Encontrar o personagem guerreiro pelo nome
  const warrior = charactersResult.data.find(char => char.name === 'Thorkell' && char.class === 'Warrior');
  
  if (!warrior) {
    console.error('Personagem guerreiro não encontrado.');
    return;
  }
  
  console.log('Personagem guerreiro encontrado:');
  console.log(`- ID: ${warrior.id}`);
  console.log(`- Nome: ${warrior.name}`);
  console.log(`- Classe: ${warrior.class}`);
  console.log(`- Nível: ${warrior.level}`);
  
  // Atualizar o personagem guerreiro
  console.log('\n=== Atualizando personagem guerreiro ===');
  const updateData = {
    level: 2,
    strength: 20, // Aumentar força
    constitution: 18, // Aumentar constituição
    backstory: warrior.backstory + ' Após completar sua primeira missão, ganhou experiência e ficou mais forte.'
  };
  
  const updateResult = await updateCharacter(adminToken, warrior.id, updateData);
  
  if (updateResult.success) {
    console.log('Personagem guerreiro atualizado com sucesso!');
  } else {
    console.error('Falha ao atualizar personagem guerreiro.');
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