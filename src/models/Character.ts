import { pool } from '../config/database';
import logger from '../config/logger';

export interface Character {
  id?: number;
  user_id: number;
  name: string;
  class: string;
  level?: number;
  experience?: number;
  health?: number;
  mana?: number;
  stamina?: number;
  strength?: number;
  dexterity?: number;
  intelligence?: number;
  wisdom?: number;
  constitution?: number;
  charisma?: number;
  created_at?: Date;
  updated_at?: Date;
  last_active?: Date | null;
  status?: 'active' | 'inactive' | 'dead';
}

class CharacterModel {
  /**
   * Cria um novo personagem
   */
  async create(characterData: Character): Promise<Character> {
    try {
      // Valores padrão
      const defaultValues = {
        level: 1,
        experience: 0,
        health: 100,
        mana: 100,
        stamina: 100,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
        wisdom: 10,
        constitution: 10,
        charisma: 10,
        status: 'active'
      };
      
      // Mesclar valores padrão com os fornecidos
      const data = { ...defaultValues, ...characterData };
      
      const [result] = await pool.query(
        `INSERT INTO characters (
          user_id, name, class, level, experience, health, mana, stamina,
          strength, dexterity, intelligence, wisdom, constitution, charisma, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.user_id, data.name, data.class, data.level, data.experience,
          data.health, data.mana, data.stamina, data.strength, data.dexterity,
          data.intelligence, data.wisdom, data.constitution, data.charisma, data.status
        ]
      );
      
      // @ts-ignore - Acessando o insertId do MySQL
      const characterId = result.insertId;
      
      // Buscar o personagem recém-criado
      const [characters]: any = await pool.query(
        'SELECT * FROM characters WHERE id = ?',
        [characterId]
      );
      
      return characters[0] as Character;
    } catch (error) {
      logger.error('Erro ao criar personagem:', error);
      throw error;
    }
  }

  /**
   * Busca um personagem pelo ID
   */
  async findById(id: number): Promise<Character | null> {
    try {
      const [characters]: any = await pool.query(
        'SELECT * FROM characters WHERE id = ?',
        [id]
      );
      
      return characters.length > 0 ? characters[0] as Character : null;
    } catch (error) {
      logger.error('Erro ao buscar personagem por ID:', error);
      throw error;
    }
  }

  /**
   * Busca todos os personagens de um usuário
   */
  async findByUserId(userId: number): Promise<Character[]> {
    try {
      const [characters]: any = await pool.query(
        'SELECT * FROM characters WHERE user_id = ?',
        [userId]
      );
      
      return characters as Character[];
    } catch (error) {
      logger.error('Erro ao buscar personagens do usuário:', error);
      throw error;
    }
  }

  /**
   * Atualiza as informações do personagem
   */
  async update(id: number, characterData: Partial<Character>): Promise<Character | null> {
    try {
      // Construir a query dinamicamente
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(characterData).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'user_id' && value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      // Adicionar ID no final dos valores
      values.push(id);
      
      // Executar a atualização
      await pool.query(
        `UPDATE characters SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      // Retornar o personagem atualizado
      return await this.findById(id);
    } catch (error) {
      logger.error('Erro ao atualizar personagem:', error);
      throw error;
    }
  }

  /**
   * Atualiza o último acesso do personagem
   */
  async updateLastActive(id: number): Promise<void> {
    try {
      await pool.query(
        'UPDATE characters SET last_active = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      logger.error('Erro ao atualizar último acesso do personagem:', error);
      throw error;
    }
  }

  /**
   * Remove um personagem
   */
  async delete(id: number): Promise<boolean> {
    try {
      const [result]: any = await pool.query(
        'DELETE FROM characters WHERE id = ?',
        [id]
      );
      
      // @ts-ignore - Acessando o affectedRows do MySQL
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erro ao remover personagem:', error);
      throw error;
    }
  }
}

export default new CharacterModel(); 