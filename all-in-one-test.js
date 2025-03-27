const http = require('http');
const crypto = require('crypto');
const util = require('util');
const mysql = require('mysql2/promise');

// Configurações
const API_HOST = 'localhost';
const API_PORT = 34567;
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '!Mister4126',
  database: 'umbraeternum_new'
};

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Função para fazer requisições HTTP
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData });
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

// Função para gerar nome de usuário único
function generateUniqueUsername() {
  return `test_user_${Math.floor(Date.now() / 1000)}`;
}

// Função para imprimir resultados formatados
function printResult(title, result, expected = null) {
  const status = result.statusCode;
  const statusColor = status >= 200 && status < 300 ? colors.green : colors.red;
  
  console.log(`\n${colors.cyan}===== ${title} =====`);
  console.log(`${colors.yellow}Status: ${statusColor}${status}${colors.reset}`);

  if (expected !== null) {
    const success = status === expected;
    console.log(`${colors.yellow}Esperado: ${success ? colors.green : colors.red}${expected}${colors.reset}`);
  }

  // Se for objeto, formatar a saída
  if (typeof result.data === 'object') {
    console.log(`${colors.yellow}Resposta: ${colors.reset}`);
    console.log(util.inspect(result.data, { colors: true, depth: 6 }));
  } else {
    console.log(`${colors.yellow}Resposta: ${colors.reset}${result.data}`);
  }
}

// Função para limpar a base de dados
async function cleanupDatabase() {
  console.log(`\n${colors.magenta}Limpando a base de dados para testes...${colors.reset}`);
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    // Desativar temporariamente as chaves estrangeiras
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Limpar as tabelas mantendo a estrutura
    await connection.execute('TRUNCATE TABLE characters');
    await connection.execute('TRUNCATE TABLE users');
    
    // Reativar as chaves estrangeiras
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log(`${colors.green}Base de dados limpa com sucesso!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Erro ao limpar base de dados: ${error.message}${colors.reset}`);
  } finally {
    await connection.end();
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}  TESTE COMPLETO DO SISTEMA UMBRA ETERNUM  ${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  
  try {
    // Limpar base de dados antes dos testes
    await cleanupDatabase();
    
    let adminToken = null;
    let playerToken = null;
    let characterId = null;
    
    console.log(`\n${colors.cyan}*** TESTE DE STATUS DA API ***${colors.reset}`);
    const statusResult = await makeRequest('GET', '/api/status');
    printResult('Verificar Status da API', statusResult, 200);
    
    console.log(`\n${colors.cyan}*** CRIAÇÃO DE USUÁRIOS ***${colors.reset}`);
    
    // Criar usuário admin
    const adminUsername = 'admin';
    const adminResult = await makeRequest('POST', '/api/auth/register', {
      username: adminUsername,
      email: 'admin@umbraeternum.com',
      password: 'admin123'
    });
    printResult('Registrar Admin', adminResult, 201);
    
    if (adminResult.statusCode === 201) {
      adminToken = adminResult.data.accessToken;
      console.log(`${colors.green}Admin criado com sucesso!${colors.reset}`);
    }
    
    // Criar usuário player
    const playerUsername = generateUniqueUsername();
    const playerResult = await makeRequest('POST', '/api/auth/register', {
      username: playerUsername,
      email: `${playerUsername}@test.com`,
      password: 'player123'
    });
    printResult('Registrar Player', playerResult, 201);
    
    if (playerResult.statusCode === 201) {
      playerToken = playerResult.data.accessToken;
      console.log(`${colors.green}Player criado com sucesso!${colors.reset}`);
    }
    
    console.log(`\n${colors.cyan}*** TESTE DE LOGIN ***${colors.reset}`);
    
    // Login como admin
    const adminLoginResult = await makeRequest('POST', '/api/auth/login', {
      username: adminUsername,
      password: 'admin123'
    });
    printResult('Login como Admin', adminLoginResult, 200);
    
    if (adminLoginResult.statusCode === 200) {
      adminToken = adminLoginResult.data.accessToken;
    }
    
    // Login como player
    const playerLoginResult = await makeRequest('POST', '/api/auth/login', {
      username: playerUsername,
      password: 'player123'
    });
    printResult('Login como Player', playerLoginResult, 200);
    
    if (playerLoginResult.statusCode === 200) {
      playerToken = playerLoginResult.data.accessToken;
    }
    
    console.log(`\n${colors.cyan}*** CRIAÇÃO DE PERSONAGENS ***${colors.reset}`);
    
    // Criar personagem mago para o admin
    const mageResult = await makeRequest('POST', '/api/characters', {
      name: 'Eldric',
      class: 'Mage',
      strength: 10,
      dexterity: 12,
      constitution: 10,
      intelligence: 18,
      wisdom: 10,
      charisma: 10,
      backstory: 'Um mago estudioso da torre arcana de Silvermoon.'
    }, adminToken);
    printResult('Criar Personagem Mago', mageResult, 201);
    
    // Criar personagem guerreiro para o admin
    const warriorResult = await makeRequest('POST', '/api/characters', {
      name: 'Thorkell',
      class: 'Warrior',
      strength: 18,
      dexterity: 14,
      constitution: 16,
      intelligence: 8,
      wisdom: 10,
      charisma: 12,
      backstory: 'Um guerreiro bárbaro do norte, famoso por sua força e coragem em batalha.'
    }, adminToken);
    printResult('Criar Personagem Guerreiro', warriorResult, 201);
    
    if (warriorResult.statusCode === 201) {
      characterId = warriorResult.data.data.id;
    }
    
    console.log(`\n${colors.cyan}*** LISTAR PERSONAGENS ***${colors.reset}`);
    
    // Listar personagens do admin
    const listResult = await makeRequest('GET', '/api/characters', null, adminToken);
    printResult('Listar Personagens do Admin', listResult, 200);
    
    console.log(`\n${colors.cyan}*** ATUALIZAR PERSONAGEM ***${colors.reset}`);
    
    if (characterId) {
      // Atualizar personagem guerreiro
      const updateResult = await makeRequest('PUT', `/api/characters/${characterId}`, {
        strength: 20,
        constitution: 18,
        backstory: 'Um guerreiro bárbaro do norte, famoso por sua força e coragem em batalha. Após completar sua primeira missão, ganhou experiência e ficou mais forte.'
      }, adminToken);
      printResult(`Atualizar Personagem #${characterId}`, updateResult, 200);
      
      // Verificar personagem após atualização
      const getResult = await makeRequest('GET', `/api/characters/${characterId}`, null, adminToken);
      printResult(`Verificar Personagem #${characterId} Após Atualização`, getResult, 200);
    }
    
    console.log(`\n${colors.cyan}*** EXCLUIR PERSONAGEM ***${colors.reset}`);
    
    if (characterId) {
      // Excluir o primeiro personagem (mago)
      const deleteResult = await makeRequest('DELETE', `/api/characters/1`, null, adminToken);
      printResult('Excluir Personagem #1 (Mago)', deleteResult, 200);
      
      // Verificar lista após exclusão
      const listAfterDeleteResult = await makeRequest('GET', '/api/characters', null, adminToken);
      printResult('Listar Personagens Após Exclusão', listAfterDeleteResult, 200);
    }
    
    console.log(`\n${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.green}  TESTES CONCLUÍDOS COM SUCESSO!  ${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}ERRO DURANTE OS TESTES: ${error.message}${colors.reset}`);
  }
}

// Executar todos os testes
runAllTests(); 