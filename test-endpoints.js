// Importar node-fetch versão 3
import fetch from 'node-fetch';

async function testEndpoints() {
  try {
    // Verificar endpoints disponíveis
    console.log('Verificando endpoints disponíveis...');
    const endpointsResponse = await fetch('http://localhost:34567/api/endpoints');
    const endpointsData = await endpointsResponse.json();
    
    console.log('Endpoints disponíveis:');
    if (endpointsData.success) {
      endpointsData.endpoints.forEach(endpoint => {
        console.log(`- ${endpoint.method} ${endpoint.path}: ${endpoint.description}`);
      });
    } else {
      console.log('Erro ao listar endpoints:', endpointsData.message);
    }
    
    // Verificar status do servidor
    console.log('\nVerificando status do servidor...');
    const statusResponse = await fetch('http://localhost:34567/api/status');
    const statusData = await statusResponse.json();
    
    console.log('Status do servidor:');
    console.log(`- Status: ${statusData.status}`);
    console.log(`- Versão: ${statusData.version}`);
    console.log(`- Jogadores online: ${statusData.onlinePlayers}`);
    console.log(`- Banco de dados: ${statusData.database}`);
    console.log(`- Timestamp: ${statusData.timestamp}`);
    
    return {
      endpoints: endpointsData.endpoints || [],
      serverStatus: statusData
    };
  } catch (error) {
    console.error('Erro ao testar endpoints:', error);
    return null;
  }
}

// Executar o teste
testEndpoints().then(result => {
  if (result) {
    console.log('\nTeste de endpoints concluído com sucesso');
  } else {
    console.log('\nFalha no teste de endpoints');
  }
}); 