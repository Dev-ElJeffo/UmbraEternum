const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '!Mister4126',
  database: process.env.DB_NAME || 'umbraeternum_new'
};

console.log('Configurações do banco de dados:');
console.log('- Host:', dbConfig.host);
console.log('- Port:', dbConfig.port);
console.log('- User:', dbConfig.user);
console.log('- Database:', dbConfig.database);

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

// Função para obter informações dos usuários e personagens
async function generateSummary() {
  console.log('=== RESUMO DO SISTEMA UMBRA ETERNUM ===');
  console.log('Data do relatório:', formatDate(new Date()));
  console.log('=====================================\n');
  
  let connection;
  
  try {
    // Conectar ao banco de dados
    console.log('Tentando conectar ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado ao banco de dados com sucesso');
    
    // 1. Contagem total de usuários
    console.log('Buscando contagem de usuários...');
    const [userRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM users'
    );
    const totalUsers = userRows[0].count;
    console.log(`Encontrados ${totalUsers} usuários`);
    
    // 2. Contagem total de personagens
    const [charRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM characters WHERE active = TRUE'
    );
    const totalCharacters = charRows[0].count;
    
    // 3. Contagem de usuários por role
    const [roleRows] = await connection.execute(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );
    
    // 4. Buscar todos os usuários com seus personagens
    const [users] = await connection.execute(
      `SELECT u.id, u.username, u.email, u.role, u.created_at, 
       u.last_login_at, COUNT(c.id) as char_count
       FROM users u
       LEFT JOIN characters c ON u.id = c.user_id AND c.active = TRUE
       GROUP BY u.id
       ORDER BY u.id`
    );
    
    // Exibir informações gerais
    console.log('ESTATÍSTICAS GERAIS:');
    console.log(`Total de Usuários: ${totalUsers}`);
    console.log(`Total de Personagens Ativos: ${totalCharacters}`);
    console.log('\nDISTRIBUIÇÃO DE USUÁRIOS POR ROLE:');
    
    roleRows.forEach(row => {
      console.log(`- ${row.role}: ${row.count} usuários`);
    });
    
    // Exibir detalhes dos usuários e seus personagens
    console.log('\nDETALHES DOS USUÁRIOS:');
    console.log('=====================================');
    
    for (const user of users) {
      console.log(`\nUsuário #${user.id}: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Criado em: ${formatDate(user.created_at)}`);
      console.log(`Último login: ${user.last_login_at ? formatDate(user.last_login_at) : 'Nunca'}`);
      console.log(`Total de personagens: ${user.char_count}`);
      
      if (user.char_count > 0) {
        // Buscar detalhes dos personagens deste usuário
        const [characters] = await connection.execute(
          `SELECT id, name, class, level, strength, intelligence, 
           dexterity, current_hp, max_hp, current_mana, max_mana, created_at
           FROM characters
           WHERE user_id = ? AND active = TRUE
           ORDER BY level DESC, name ASC`,
          [user.id]
        );
        
        console.log('\nPERSONAGENS:');
        characters.forEach((char, index) => {
          console.log(`  ${index + 1}. ${char.name} (Nível ${char.level}) - ${char.class}`);
          console.log(`     FOR: ${char.strength} | INT: ${char.intelligence} | DEX: ${char.dexterity}`);
          console.log(`     HP: ${char.current_hp}/${char.max_hp} | Mana: ${char.current_mana}/${char.max_mana}`);
          console.log(`     Criado em: ${formatDate(char.created_at)}`);
        });
      }
      
      console.log('-------------------------------------');
    }
    
    // 5. Estatísticas de classes de personagens
    const [classStats] = await connection.execute(
      `SELECT class, COUNT(*) as count, AVG(level) as avg_level
       FROM characters
       WHERE active = TRUE
       GROUP BY class
       ORDER BY count DESC, class ASC`
    );
    
    console.log('\nESTATÍSTICAS DE CLASSES:');
    classStats.forEach(stat => {
      console.log(`- ${stat.class}: ${stat.count} personagens (Nível médio: ${Number(stat.avg_level).toFixed(1)})`);
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar resumo:', error.message);
    console.error('Stack de erro:', error.stack);
    
    // Verificar se é um erro de conexão
    if (error.code) {
      console.error('Código de erro:', error.code);
      console.error('Número do erro SQL:', error.errno);
      console.error('SQL State:', error.sqlState);
    }
    
    return false;
  } finally {
    // Fechar conexão com o banco de dados
    if (connection) {
      await connection.end();
      console.log('\nConexão com o banco de dados fechada');
    }
  }
}

// Executar geração de resumo
generateSummary()
  .then(() => {
    console.log('\nResumo gerado com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro inesperado:', error);
    process.exit(1);
  }); 