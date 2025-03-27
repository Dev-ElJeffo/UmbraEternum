// Importar node-fetch versão 3
import fetch from 'node-fetch';

async function testRegister() {
  try {
    // Gerar um nome de usuário único baseado no timestamp
    const timestamp = Date.now();
    const username = `user_${timestamp}`;
    const email = `user_${timestamp}@test.com`;
    
    console.log(`Testando registro com usuário: ${username}, email: ${email}`);
    
    const response = await fetch('http://localhost:34567/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        email,
        password: 'Senha123'
      })
    });
    
    const data = await response.json();
    
    console.log('Status da resposta:', response.status);
    console.log('Resposta completa:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Registro bem-sucedido!');
      console.log('Token:', data.accessToken);
      console.log('ID do usuário:', data.user.id);
      return {
        username,
        password: 'Senha123',
        token: data.accessToken,
        userId: data.user.id
      };
    } else {
      console.log('❌ Falha no registro:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Erro ao testar registro:', error);
    return null;
  }
}

// Executar o teste
testRegister().then(result => {
  console.log('Teste de registro concluído');
  if (result) {
    console.log('Credenciais para login:');
    console.log(`- Usuário: ${result.username}`);
    console.log(`- Senha: Senha123`);
  }
}); 