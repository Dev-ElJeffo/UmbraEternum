# Integração Contínua (CI) e Entrega Contínua (CD)

Este documento descreve o processo de Integração Contínua e Entrega Contínua implementado para o projeto UmbraEternum.

## Integração Contínua

O projeto utiliza GitHub Actions para automação de testes e verificação de qualidade do código.

### Workflows

#### `tests.yml`

Este workflow executa automaticamente todos os testes após cada push ou pull request para as branches `main` e `develop`.

**Etapas:**

1. **Configuração do ambiente:**
   - Cria um serviço MySQL para testes
   - Configura versões do Node.js (16.x e 18.x)
   
2. **Preparação:**
   - Instala dependências
   - Configura variáveis de ambiente para testes
   - Inicializa o banco de dados de teste
   
3. **Testes:**
   - Executa os testes básicos (`npm run test:basic`)
   - Executa todos os testes exceto o banco de dados (`npm run test:all`)
   
4. **Relatórios:**
   - Arquiva os resultados da cobertura de código

### Benefícios

- **Detecção antecipada de problemas:** Problemas são identificados imediatamente após o commit
- **Testes consistentes:** Testes são executados em um ambiente limpo e padronizado
- **Múltiplas versões do Node.js:** Garante compatibilidade com diferentes versões
- **Banco de dados isolado:** Testes utilizam um banco de dados dedicado e isolado

## Como funciona

1. Desenvolvedor faz um push para o repositório ou abre um Pull Request
2. GitHub Actions inicia automaticamente o workflow `tests.yml`
3. Os testes são executados em um ambiente Linux com Node.js e MySQL
4. Resultados são exibidos no GitHub
5. Se algum teste falhar, todos os colaboradores são notificados

## Boas práticas

1. **Verifique localmente antes de enviar:**
   ```bash
   npm test
   ```

2. **Mantenha os testes rápidos:** Testes lentos prejudicam o desenvolvimento

3. **Não ignore falhas:** Corrija imediatamente testes com falha

4. **Mantenha alta cobertura:** Adicione testes para cada nova funcionalidade

## Próximos passos

- Implementar verificação de qualidade de código (ESLint, Prettier)
- Adicionar verificação de segurança (vulnerabilidades em dependências)
- Configurar deploy automático para ambientes de teste/produção

## Visualizando resultados

Os resultados dos testes podem ser visualizados na aba "Actions" do repositório GitHub.

A cobertura de código pode ser acessada como um artefato da execução do workflow. 