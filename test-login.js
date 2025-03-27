// Importar node-fetch versão 3
import fetch from 'node-fetch';

// As credenciais podem ser fornecidas via linha de comando
const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

async function testLogin() {
  try {
    console.log(`Testando login com usuário: ${username}`);
    
    const response = await fetch('http://localhost:34567/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });
    
    const data = await response.json();
    
    console.log('Status da resposta:', response.status);
    console.log('Resposta completa:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Login bem-sucedido!');
      console.log('Token:', data.accessToken);
      console.log('Usuário:', data.user.username);
      console.log('Função:', data.user.role);
      return {
        token: data.accessToken,
        userId: data.user.id
      };
    } else {
      console.log('❌ Falha no login:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Erro ao testar login:', error);
    return null;
  }
}

// Executar o teste
testLogin().then(result => {
  console.log('Teste de login concluído');
  if (result) {
    console.log('Use o token para autenticar requisições:');
    console.log(`- Authorization: Bearer ${result.token}`);
  }
}); 