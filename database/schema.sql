-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'player', 'game_master') NOT NULL DEFAULT 'player',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de personagens
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
  max_hp INT NOT NULL DEFAULT 10,
  current_hp INT NOT NULL DEFAULT 10,
  max_mana INT NOT NULL DEFAULT 10,
  current_mana INT NOT NULL DEFAULT 10,
  gold INT NOT NULL DEFAULT 0,
  backstory TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de itens
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type ENUM('weapon', 'armor', 'potion', 'accessory', 'quest', 'misc') NOT NULL,
  rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') NOT NULL DEFAULT 'common',
  value INT NOT NULL DEFAULT 0,
  weight FLOAT NOT NULL DEFAULT 0,
  attributes JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de inventário dos personagens (relação M:N entre personagens e itens)
CREATE TABLE IF NOT EXISTS character_inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  character_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  equipped BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Tabela de habilidades
CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type ENUM('attack', 'defense', 'healing', 'utility', 'passive') NOT NULL,
  mana_cost INT NOT NULL DEFAULT 0,
  cooldown INT NOT NULL DEFAULT 0,
  attributes JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de habilidades dos personagens (relação M:N entre personagens e habilidades)
CREATE TABLE IF NOT EXISTS character_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  character_id INT NOT NULL,
  skill_id INT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Tabela de quests
CREATE TABLE IF NOT EXISTS quests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  min_level INT NOT NULL DEFAULT 1,
  reward_exp INT NOT NULL DEFAULT 0,
  reward_gold INT NOT NULL DEFAULT 0,
  reward_items JSON,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de progresso das quests dos personagens
CREATE TABLE IF NOT EXISTS character_quests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  character_id INT NOT NULL,
  quest_id INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'not_started',
  progress JSON,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
); 