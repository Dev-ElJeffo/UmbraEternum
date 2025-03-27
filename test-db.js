const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('Testando conexão com o banco de dados...');
  
  // Configuração do banco de dados
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'umbraeternum_new'
  };
  
  console.log('Configurações:');
  console.log('- Host:', dbConfig.host);
  console.log('- Port:', dbConfig.port);
  console.log('- User:', dbConfig.user);
  console.log('- Password:', dbConfig.password ? '******' : '[vazio]');
  console.log('- Database:', dbConfig.database);
  
  try {
    // Tentar conectar ao banco de dados
    console.log('\nTentando conectar...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Conexão estabelecida com sucesso!');
    
    // Testar consulta simples
    console.log('\nExecutando consulta para listar tabelas...');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length > 0) {
      console.log(`\nTabelas encontradas (${tables.length}):`);
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`  ${index + 1}. ${tableName}`);
      });
    } else {
      console.log('\nNenhuma tabela encontrada no banco de dados.');
    }
    
    // Fechar conexão
    await connection.end();
    console.log('\nConexão fechada com sucesso.');
    
    return true;
  } catch (error) {
    console.error('\nERRO AO CONECTAR AO BANCO DE DADOS:');
    console.error('Mensagem:', error.message);
    
    if (error.code) {
      console.error('Código de erro:', error.code);
      console.error('Número do erro:', error.errno);
      
      // Mostrar sugestões com base no código de erro
      switch (error.code) {
        case 'ECONNREFUSED':
          console.error('\nSugestão: O servidor MySQL parece estar offline ou o host/porta estão incorretos.');
          console.error('Verifique se o servidor MySQL está rodando e se as configurações de host e porta estão corretas.');
          break;
        case 'ER_ACCESS_DENIED_ERROR':
          console.error('\nSugestão: Usuário ou senha incorretos.');
          console.error('Verifique as credenciais de acesso ao banco de dados.');
          break;
        case 'ER_BAD_DB_ERROR':
          console.error('\nSugestão: O banco de dados especificado não existe.');
          console.error(`Verifique se o banco de dados '${dbConfig.database}' foi criado.`);
          console.error('Você pode criá-lo com o comando: CREATE DATABASE ' + dbConfig.database);
          break;
        default:
          console.error('\nSugestão: Erro desconhecido. Verifique os detalhes acima.');
      }
    }
    
    return false;
  }
}

// Executar o teste
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\nTeste de conexão concluído com sucesso!');
    } else {
      console.error('\nTeste de conexão falhou. Verifique os erros acima.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
    process.exit(1);
  }); 