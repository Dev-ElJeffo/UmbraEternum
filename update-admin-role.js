const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateAdminRole() {
  console.log('Atualizando role do usuário admin...');
  
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
    
    // Atualizar a role do usuário admin
    const [updateResult] = await connection.execute(
      'UPDATE users SET role = ? WHERE username = ?',
      ['admin', 'admin']
    );
    
    if (updateResult.affectedRows > 0) {
      console.log('Role do usuário admin atualizada com sucesso!');
      
      // Verificar se a atualização foi bem-sucedida
      const [rows] = await connection.execute(
        'SELECT id, username, email, role FROM users WHERE username = ?',
        ['admin']
      );
      
      if (rows.length > 0) {
        console.log('Informações do usuário admin:');
        console.log(JSON.stringify(rows[0], null, 2));
      } else {
        console.log('Usuário admin não encontrado após atualização.');
      }
      
      return true;
    } else {
      console.log('Nenhum usuário admin encontrado para atualizar.');
      return false;
    }
  } catch (error) {
    console.error('Erro ao atualizar role do admin:', error.message);
    return false;
  } finally {
    // Fechar conexão com o banco de dados
    if (connection) {
      await connection.end();
      console.log('Conexão com o banco de dados fechada');
    }
  }
}

// Executar atualização
updateAdminRole()
  .then(success => {
    if (success) {
      console.log('Processo de atualização concluído com sucesso.');
    } else {
      console.log('Falha no processo de atualização.');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
    process.exit(1);
  }); 