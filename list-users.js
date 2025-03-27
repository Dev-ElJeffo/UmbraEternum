const mysql = require('mysql2/promise');
require('dotenv').config();

async function listUsers() {
  console.log('Listando todos os usuários...');
  
  // Configuração do banco de dados
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'umbraeternum'
  };
  
  let connection;
  
  try {
    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado ao banco de dados');
    
    // Buscar todos os usuários
    const [rows] = await connection.execute(
      'SELECT id, username, email, role, created_at, last_login_at FROM users ORDER BY id'
    );
    
    if (rows.length > 0) {
      console.log(`Total de usuários: ${rows.length}`);
      console.log('Lista de usuários:');
      
      // Formatar cada usuário para exibição
      rows.forEach((user, index) => {
        console.log(`\nUsuário #${index + 1}:`);
        console.log(`ID: ${user.id}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Criado em: ${formatDate(user.created_at)}`);
        console.log(`Último login: ${user.last_login_at ? formatDate(user.last_login_at) : 'Nunca'}`);
        console.log('--------------------------------------');
      });
      
      return true;
    } else {
      console.log('Nenhum usuário encontrado no banco de dados.');
      return false;
    }
  } catch (error) {
    console.error('Erro ao listar usuários:', error.message);
    return false;
  } finally {
    // Fechar conexão com o banco de dados
    if (connection) {
      await connection.end();
      console.log('Conexão com o banco de dados fechada');
    }
  }
}

// Função para formatar data
function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Executar listagem
listUsers()
  .then(() => {
    console.log('Processo de listagem concluído.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
    process.exit(1);
  }); 