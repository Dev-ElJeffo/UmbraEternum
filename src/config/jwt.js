const dotenv = require('dotenv');

dotenv.config();

const jwtConfig = {
  secret: process.env.JWT_SECRET || 'umbraeternum_secret_key_ultra_segura',
  expiresIn: process.env.JWT_EXPIRATION || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
};

console.log('Configuração JWT carregada:');
console.log(`- Secret: ${jwtConfig.secret.substring(0, 3)}${'*'.repeat(10)}`);
console.log(`- Expires In: ${jwtConfig.expiresIn}`);
console.log(`- Refresh Expires In: ${jwtConfig.refreshExpiresIn}`);

module.exports = { jwtConfig };
