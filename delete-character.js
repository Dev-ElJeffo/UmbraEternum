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

// Excluir personagem
async function deleteCharacter(token, characterId) {
  console.log(`Excluindo personagem ID ${characterId}...`);
  
  try {
    const options = {
      hostname: 'localhost',
      port: 34567,
      path: `/api/characters/${characterId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('Enviando request para:', options.hostname, options.port, options.path);
    
    const response = await makeRequest(options);
    console.log(`Status da exclusão de personagem: ${response.statusCode}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return {
      success: response.statusCode === 200,
      data: response.data
    };
  } catch (error) {
    console.error('Erro ao excluir personagem:', error.message);
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
  
  // Listar personagens
  console.log('\n=== Buscando personagens ===');
  const charactersResult = await listCharacters(adminToken);
  
  if (!charactersResult.success) {
    console.error('Não foi possível listar os personagens.');
    return;
  }
  
  // Mostrar todos os personagens
  console.log('\nLista de personagens:');
  charactersResult.data.forEach((char, index) => {
    console.log(`${index + 1}. ID: ${char.id} - ${char.name} (Nível ${char.level}) - ${char.class}`);
  });
  
  // Para este exemplo, vamos excluir um dos magos (Eldric)
  // Encontrar o primeiro mago Eldric
  const eldric = charactersResult.data.find(char => char.name === 'Eldric' && char.class === 'Mage');
  
  if (!eldric) {
    console.error('Personagem mago Eldric não encontrado.');
    return;
  }
  
  console.log('\nPersonagem a ser excluído:');
  console.log(`- ID: ${eldric.id}`);
  console.log(`- Nome: ${eldric.name}`);
  console.log(`- Classe: ${eldric.class}`);
  console.log(`- Nível: ${eldric.level}`);
  
  // Confirmar com o usuário
  console.log('\nATENÇÃO: Este personagem será DESATIVADO (soft delete).');
  console.log('Prosseguindo com a exclusão...');
  
  // Excluir personagem
  console.log('\n=== Excluindo personagem ===');
  const deleteResult = await deleteCharacter(adminToken, eldric.id);
  
  if (deleteResult.success) {
    console.log('Personagem excluído com sucesso!');
  } else {
    console.error('Falha ao excluir personagem.');
  }
  
  // Listar personagens novamente para confirmar a exclusão
  console.log('\n=== Listando personagens após exclusão ===');
  const afterDeleteResult = await listCharacters(adminToken);
  
  if (afterDeleteResult.success) {
    console.log('\nLista de personagens após exclusão:');
    afterDeleteResult.data.forEach((char, index) => {
      console.log(`${index + 1}. ID: ${char.id} - ${char.name} (Nível ${char.level}) - ${char.class}`);
    });
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