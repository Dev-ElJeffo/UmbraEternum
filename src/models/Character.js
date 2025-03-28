const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umbraeternum',
};

let dbPool;

/**
 * Inicializa a conexão com o banco de dados
 */
async function initDatabaseConnection() {
  if (!dbPool) {
    dbPool = mysql.createPool(dbConfig);

    // Verificar se a tabela characters existe
    const connection = await dbPool.getConnection();
    try {
      const [tables] = await connection.query('SHOW TABLES LIKE "characters"');
      if (tables.length === 0) {
        console.log('Tabela de personagens não encontrada, criando...');
        await connection.query(`
          CREATE TABLE IF NOT EXISTS characters (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            class VARCHAR(50) NOT NULL,
            level INT NOT NULL DEFAULT 1,
            experience INT NOT NULL DEFAULT 0,
            strength INT NOT NULL DEFAULT 10,
            dexterity INT NOT NULL DEFAULT 10,
            constitution INT NOT NULL DEFAULT 10,
            intelligence INT NOT NULL DEFAULT 10,
            wisdom INT NOT NULL DEFAULT 10,
            charisma INT NOT NULL DEFAULT 10,
            current_hp INT NOT NULL DEFAULT 100,
            max_hp INT NOT NULL DEFAULT 100,
            current_mana INT NOT NULL DEFAULT 50,
            max_mana INT NOT NULL DEFAULT 50,
            gold INT NOT NULL DEFAULT 0,
            position_x FLOAT NOT NULL DEFAULT 0,
            position_y FLOAT NOT NULL DEFAULT 0,
            position_z FLOAT NOT NULL DEFAULT 0,
            backstory TEXT,
            active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('Tabela de personagens criada com sucesso');
      } else {
        console.log('Tabela de personagens já existe');
      }
    } finally {
      connection.release();
    }
  }
  return dbPool;
}

// Inicializar conexão
initDatabaseConnection().catch(console.error);

class Character {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.name = data.name;
    this.class = data.class;
    this.level = data.level || 1;
    this.experience = data.experience || 0;
    this.strength = data.strength || 10;
    this.dexterity = data.dexterity || 10;
    this.constitution = data.constitution || 10;
    this.intelligence = data.intelligence || 10;
    this.wisdom = data.wisdom || 10;
    this.charisma = data.charisma || 10;
    this.currentHp = data.current_hp || 100;
    this.maxHp = data.max_hp || 100;
    this.currentMana = data.current_mana || 50;
    this.maxMana = data.max_mana || 50;
    this.gold = data.gold || 0;
    this.positionX = data.position_x || 0;
    this.positionY = data.position_y || 0;
    this.positionZ = data.position_z || 0;
    this.backstory = data.backstory || '';
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Busca um personagem pelo ID
   * @param {number} id - ID do personagem
   * @returns {Promise<Character|null>} - Retorna o personagem ou null se não for encontrado
   */
  static async findById(id) {
    try {
      const pool = await initDatabaseConnection();
      const [rows] = await pool.query('SELECT * FROM characters WHERE id = ? AND active = TRUE', [
        id,
      ]);

      if (rows.length === 0) {
        return null;
      }

      return new Character(rows[0]);
    } catch (error) {
      console.error('Erro ao buscar personagem por ID:', error);
      throw error;
    }
  }

  /**
   * Busca todos os personagens de um usuário
   * @param {number} userId - ID do usuário
   * @returns {Promise<Character[]>} - Lista de personagens
   */
  static async findByUserId(userId) {
    try {
      const pool = await initDatabaseConnection();
      const [rows] = await pool.query(
        'SELECT * FROM characters WHERE user_id = ? AND active = TRUE ORDER BY level DESC, name ASC',
        [userId]
      );

      return rows.map((row) => new Character(row));
    } catch (error) {
      console.error('Erro ao buscar personagens do usuário:', error);
      throw error;
    }
  }

  /**
   * Cria um novo personagem
   * @param {Object} data - Dados do personagem
   * @returns {Promise<Character>} - Personagem criado
   */
  static async create(data) {
    try {
      const pool = await initDatabaseConnection();

      // Calcular HP e Mana com base nas estatísticas
      const maxHp = (data.constitution || 10) * 10;
      const maxMana = (data.intelligence || 10) * 5;

      const [result] = await pool.query(
        `INSERT INTO characters (
          user_id, name, class, strength, dexterity, constitution, 
          intelligence, wisdom, charisma, current_hp, max_hp, 
          current_mana, max_mana, backstory
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.userId,
          data.name,
          data.class,
          data.strength || 10,
          data.dexterity || 10,
          data.constitution || 10,
          data.intelligence || 10,
          data.wisdom || 10,
          data.charisma || 10,
          maxHp,
          maxHp,
          maxMana,
          maxMana,
          data.backstory || '',
        ]
      );

      // Buscar o personagem criado
      return this.findById(result.insertId);
    } catch (error) {
      console.error('Erro ao criar personagem:', error);
      throw error;
    }
  }

  /**
   * Atualiza os dados do personagem
   * @param {Object} updates - Campos a serem atualizados
   * @returns {Promise<Character>} - Personagem atualizado
   */
  async update(updates) {
    try {
      const pool = await initDatabaseConnection();

      // Converter camelCase para snake_case para o banco de dados
      const dbUpdates = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.class) dbUpdates.class = updates.class;
      if (updates.level) dbUpdates.level = updates.level;
      if (updates.experience) dbUpdates.experience = updates.experience;
      if (updates.strength) dbUpdates.strength = updates.strength;
      if (updates.dexterity) dbUpdates.dexterity = updates.dexterity;
      if (updates.constitution) dbUpdates.constitution = updates.constitution;
      if (updates.intelligence) dbUpdates.intelligence = updates.intelligence;
      if (updates.wisdom) dbUpdates.wisdom = updates.wisdom;
      if (updates.charisma) dbUpdates.charisma = updates.charisma;
      if (updates.currentHp) dbUpdates.current_hp = updates.currentHp;
      if (updates.maxHp) dbUpdates.max_hp = updates.maxHp;
      if (updates.currentMana) dbUpdates.current_mana = updates.currentMana;
      if (updates.maxMana) dbUpdates.max_mana = updates.maxMana;
      if (updates.gold) dbUpdates.gold = updates.gold;
      if (updates.positionX) dbUpdates.position_x = updates.positionX;
      if (updates.positionY) dbUpdates.position_y = updates.positionY;
      if (updates.positionZ) dbUpdates.position_z = updates.positionZ;
      if (updates.backstory) dbUpdates.backstory = updates.backstory;
      if (updates.active !== undefined) dbUpdates.active = updates.active;

      // Construir a query de atualização
      if (Object.keys(dbUpdates).length === 0) {
        return this; // Nada a atualizar
      }

      const setClauses = Object.keys(dbUpdates)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(dbUpdates), this.id];

      await pool.query(`UPDATE characters SET ${setClauses} WHERE id = ?`, values);

      // Atualizar o objeto atual
      Object.assign(this, updates);

      return this;
    } catch (error) {
      console.error('Erro ao atualizar personagem:', error);
      throw error;
    }
  }

  /**
   * Desativa (soft delete) um personagem
   * @returns {Promise<void>}
   */
  async deactivate() {
    try {
      const pool = await initDatabaseConnection();
      await pool.query('UPDATE characters SET active = FALSE WHERE id = ?', [this.id]);
      this.active = false;
    } catch (error) {
      console.error('Erro ao desativar personagem:', error);
      throw error;
    }
  }
}

module.exports = Character;
