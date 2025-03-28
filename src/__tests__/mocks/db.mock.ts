import { jest } from '@jest/globals';

// Interfaces para tipagem
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Character {
  id: number;
  user_id: number;
  name: string;
  class: string;
  level?: number;
  experience?: number;
  health?: number;
  mana?: number;
  strength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  gold?: number;
  inventory?: string;
  skills?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface QueryResult {
  affectedRows?: number;
  insertId?: number;
  changedRows?: number;
}

// Dados mockados
export let mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'hashed_password',
    role: 'admin',
    active: true,
    created_at: '2023-01-01 00:00:00',
    updated_at: '2023-01-01 00:00:00'
  },
  {
    id: 2,
    username: 'player1',
    email: 'player1@example.com',
    password: 'hashed_password',
    role: 'player',
    active: true,
    created_at: '2023-01-02 00:00:00',
    updated_at: '2023-01-02 00:00:00'
  },
  {
    id: 3,
    username: 'player2',
    email: 'player2@example.com',
    password: 'hashed_password',
    role: 'player',
    active: true,
    created_at: '2023-01-03 00:00:00',
    updated_at: '2023-01-03 00:00:00'
  }
];

export let mockCharacters: Character[] = [
  {
    id: 1,
    user_id: 1,
    name: 'Gandalf',
    class: 'Wizard',
    level: 20,
    experience: 10000,
    health: 150,
    mana: 300,
    strength: 12,
    dexterity: 14,
    constitution: 16,
    intelligence: 20,
    wisdom: 18,
    charisma: 16,
    gold: 1000,
    inventory: JSON.stringify(['Staff of Power', 'Spellbook', 'Ring of Protection']),
    skills: JSON.stringify(['Fireball', 'Lightning Bolt', 'Teleport']),
    active: true,
    created_at: '2023-01-01 00:00:00',
    updated_at: '2023-01-01 00:00:00'
  },
  {
    id: 2,
    user_id: 2,
    name: 'Aragorn',
    class: 'Ranger',
    level: 15,
    experience: 7500,
    health: 200,
    mana: 100,
    strength: 18,
    dexterity: 18,
    constitution: 18,
    intelligence: 14,
    wisdom: 16,
    charisma: 18,
    gold: 800,
    inventory: JSON.stringify(['Sword', 'Bow', 'Healing Potion']),
    skills: JSON.stringify(['Dual Wield', 'Tracking', 'Nature Bond']),
    active: true,
    created_at: '2023-01-02 00:00:00',
    updated_at: '2023-01-02 00:00:00'
  },
  {
    id: 3,
    user_id: 2,
    name: 'Frodo',
    class: 'Rogue',
    level: 10,
    experience: 5000,
    health: 120,
    mana: 80,
    strength: 12,
    dexterity: 18,
    constitution: 14,
    intelligence: 14,
    wisdom: 12,
    charisma: 16,
    gold: 500,
    inventory: JSON.stringify(['Dagger', 'Ring', 'Light Armor']),
    skills: JSON.stringify(['Sneak', 'Hide', 'Lockpick']),
    active: true,
    created_at: '2023-01-03 00:00:00',
    updated_at: '2023-01-03 00:00:00'
  },
  {
    id: 4,
    user_id: 3,
    name: 'Gimli',
    class: 'Fighter',
    level: 12,
    experience: 6000,
    health: 220,
    mana: 60,
    strength: 20,
    dexterity: 12,
    constitution: 20,
    intelligence: 10,
    wisdom: 12,
    charisma: 10,
    gold: 700,
    inventory: JSON.stringify(['Axe', 'Shield', 'Heavy Armor']),
    skills: JSON.stringify(['Cleave', 'Bash', 'Mountain Strength']),
    active: true,
    created_at: '2023-01-04 00:00:00',
    updated_at: '2023-01-04 00:00:00'
  },
  {
    id: 5,
    user_id: 3,
    name: 'Legolas',
    class: 'Archer',
    level: 14,
    experience: 7000,
    health: 160,
    mana: 120,
    strength: 14,
    dexterity: 20,
    constitution: 14,
    intelligence: 16,
    wisdom: 16,
    charisma: 16,
    gold: 600,
    inventory: JSON.stringify(['Longbow', 'Elven Dagger', 'Elven Cloak']),
    skills: JSON.stringify(['Rapid Shot', 'Eagle Eye', 'Elven Grace']),
    active: true,
    created_at: '2023-01-05 00:00:00',
    updated_at: '2023-01-05 00:00:00'
  }
];

// Mock do pool de conexão
export const mockPool = {
  query: jest.fn((sql: string, params?: any[]) => {
    // Retornar uma promessa para simular o comportamento assíncrono do mysql2
    return new Promise((resolve) => {
      // SELECT query
      if (sql.match(/^SELECT/i)) {
        if (sql.match(/FROM users/i)) {
          let users = [...mockUsers];
          
          // Filtrar por ID se especificado
          if (params && params.length > 0 && sql.match(/WHERE id = \?/i)) {
            users = users.filter(user => user.id === params[0]);
          }
          
          resolve(users);
        } else if (sql.match(/FROM characters/i)) {
          let characters = [...mockCharacters];
          
          // Filtrar por ID se especificado
          if (params && params.length > 0) {
            if (sql.match(/WHERE id = \?/i)) {
              characters = characters.filter(char => char.id === params[0]);
            } else if (sql.match(/WHERE user_id = \?/i)) {
              characters = characters.filter(char => char.user_id === params[0]);
            }
          }
          
          resolve(characters);
        }
      }
      // INSERT query
      else if (sql.match(/^INSERT/i)) {
        if (sql.match(/INTO users/i)) {
          const newUser: User = {
            id: mockUsers.length + 1,
            username: params?.[0] || 'default_username',
            email: params?.[1] || 'default@example.com',
            password: params?.[2] || 'default_password',
            role: 'player',
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          mockUsers.push(newUser);
          resolve({ insertId: newUser.id, affectedRows: 1 });
        } else if (sql.match(/INTO characters/i)) {
          const newCharacter: Character = {
            id: mockCharacters.length + 1,
            user_id: params?.[0] || 1,
            name: params?.[1] || 'Default Character',
            class: params?.[2] || 'Warrior',
            level: 1,
            experience: 0,
            health: 100,
            mana: 100,
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            gold: 0,
            inventory: JSON.stringify([]),
            skills: JSON.stringify([]),
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          mockCharacters.push(newCharacter);
          resolve({ insertId: newCharacter.id, affectedRows: 1 });
        }
      }
      // UPDATE query
      else if (sql.match(/^UPDATE/i)) {
        if (sql.match(/users/i)) {
          const userId = params?.[params.length - 1];
          const userIndex = mockUsers.findIndex(user => user.id === userId);
          
          if (userIndex !== -1) {
            // Update role
            if (sql.match(/SET role = \?/i)) {
              mockUsers[userIndex].role = params?.[0];
            }
            // Soft delete
            else if (sql.match(/SET active = false/i)) {
              mockUsers[userIndex].active = false;
            }
            
            mockUsers[userIndex].updated_at = new Date().toISOString();
            resolve({ affectedRows: 1, changedRows: 1 });
          } else {
            resolve({ affectedRows: 0, changedRows: 0 });
          }
        } else if (sql.match(/characters/i)) {
          const charId = params?.[params.length - 1];
          const charIndex = mockCharacters.findIndex(char => char.id === charId);
          
          if (charIndex !== -1) {
            // Update character properties
            if (sql.match(/SET name = \?, class = \?, level = \?/i)) {
              mockCharacters[charIndex].name = params?.[0];
              mockCharacters[charIndex].class = params?.[1];
              mockCharacters[charIndex].level = params?.[2];
            }
            // Soft delete
            else if (sql.match(/SET active = false/i)) {
              mockCharacters[charIndex].active = false;
            }
            
            mockCharacters[charIndex].updated_at = new Date().toISOString();
            resolve({ affectedRows: 1, changedRows: 1 });
          } else {
            resolve({ affectedRows: 0, changedRows: 0 });
          }
        }
      }
      // DELETE query
      else if (sql.match(/^DELETE/i)) {
        if (sql.match(/FROM characters/i)) {
          if (sql.match(/WHERE user_id = \?/i)) {
            const userId = params?.[0];
            const initialLength = mockCharacters.length;
            const charactersToRemove = mockCharacters.filter(char => char.user_id === userId).length;
            
            // Filtrar personagens por user_id usando o splice ou filter
            for (let i = mockCharacters.length - 1; i >= 0; i--) {
              if (mockCharacters[i].user_id === userId) {
                mockCharacters.splice(i, 1);
              }
            }
            
            resolve({ affectedRows: charactersToRemove });
          } else if (sql.match(/WHERE id = \?/i)) {
            const charId = params?.[0];
            const initialLength = mockCharacters.length;
            
            // Filtrar personagens por id usando o splice ou filter
            for (let i = mockCharacters.length - 1; i >= 0; i--) {
              if (mockCharacters[i].id === charId) {
                mockCharacters.splice(i, 1);
              }
            }
            
            resolve({ affectedRows: initialLength - mockCharacters.length });
          }
        }
      }
      
      // Default fallback
      resolve([]);
    });
  }),
  
  getConnection: jest.fn(() => ({
    beginTransaction: jest.fn(() => Promise.resolve()),
    commit: jest.fn(() => Promise.resolve()),
    rollback: jest.fn(() => Promise.resolve()),
    release: jest.fn(),
    query: jest.fn((sql: string, params?: any[]) => mockPool.query(sql, params))
  })),
  
  end: jest.fn(() => Promise.resolve())
}; 