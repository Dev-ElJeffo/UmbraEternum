# UmbraEternum

Um MMORPG desenvolvido com Node.js, Express, Socket.IO e Unreal Engine 5. O sistema é composto por um servidor backend robusto que gerencia autenticação, personagens, comunicação em tempo real e administração, integrando-se com um cliente Unreal Engine 5 para a experiência do jogador.

## Visão Geral do Sistema

### Arquitetura
- **Backend**: Servidor Node.js com Express e Socket.IO
- **Frontend**: Cliente Unreal Engine 5
- **Banco de Dados**: MySQL
- **Comunicação**: REST API + WebSocket
- **Autenticação**: JWT (JSON Web Tokens)

### Componentes Principais
1. **Servidor de Jogo**
   - Gerenciamento de sessões
   - Lógica de jogo
   - Comunicação em tempo real
   - Sistema de chat
   - Contagem de jogadores

2. **Sistema de Autenticação**
   - Registro de usuários
   - Login/Logout
   - Recuperação de senha
   - Proteção contra ataques

3. **Gerenciamento de Personagens**
   - Criação e personalização
   - Atributos e estatísticas
   - Sistema de classes
   - Inventário

4. **Interface Administrativa**
   - Painel de controle
   - Moderação
   - Estatísticas
   - Gerenciamento de usuários

## Requisitos do Sistema

### Hardware Recomendado
- CPU: Intel i5/AMD Ryzen 5 ou superior
- RAM: 8GB mínimo, 16GB recomendado
- GPU: NVIDIA GTX 1060/AMD RX 580 ou superior
- Armazenamento: 50GB de espaço livre

### Software Necessário
- **Node.js**: v18.x ou superior
- **MySQL**: v8.x ou superior
- **Unreal Engine**: v5.3 ou superior
- **WAMP/XAMPP**: Para ambiente de desenvolvimento
- **Git**: Para controle de versão

### Dependências do Projeto
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "mysql2": "^3.6.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express-validator": "^7.0.1",
    "winston": "^3.11.0"
  }
}
```

## Instalação

### 1. Preparação do Ambiente

1. Instale o Node.js:
   ```bash
   # Windows: Baixe e instale do site oficial
   # Linux:
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Instale o MySQL:
   ```bash
   # Windows: Baixe e instale o MySQL Server
   # Linux:
   sudo apt-get install mysql-server
   ```

3. Instale o WAMP/XAMPP:
   - Baixe e instale do site oficial
   - Inicie os serviços Apache e MySQL

### 2. Configuração do Projeto

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/UmbraEternum.git
   cd UmbraEternum
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o banco de dados:
   ```sql
   CREATE DATABASE umbraeternum_new;
   ```

4. Configure as variáveis de ambiente:
   ```bash
   # Crie um arquivo .env na raiz do projeto
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_NAME=umbraeternum_new
   JWT_SECRET=seu_segredo_jwt
   PORT=34567
   ```

### 3. Inicialização

1. Inicie o servidor:
   ```bash
   # Modo desenvolvimento
   npm run dev

   # Modo produção
   npm start
   ```

2. Verifique o status:
   ```bash
   curl http://localhost:34567/api/status
   ```

## Integração com Git

### 1. Configuração Inicial

1. **Instalação do Git**
   ```bash
   # Windows: Baixe e instale do site oficial
   # Linux:
   sudo apt-get install git
   ```

2. **Configuração do Git**
   ```bash
   # Configurar nome e email
   git config --global user.name "Seu Nome"
   git config --global user.email "seu.email@exemplo.com"

   # Configurar editor padrão (opcional)
   git config --global core.editor "code --wait"  # Para VS Code
   ```

3. **Inicializar Repositório**
   ```bash
   # Criar novo repositório
   git init

   # Adicionar arquivos
   git add .

   # Primeiro commit
   git commit -m "Commit inicial"
   ```

### 2. Trabalhando com Repositório Remoto

1. **Conectar com GitHub**
   ```bash
   # Adicionar repositório remoto
   git remote add origin https://github.com/seu-usuario/UmbraEternum.git

   # Verificar remotos
   git remote -v
   ```

2. **Enviar Código**
   ```bash
   # Enviar para o repositório remoto
   git push -u origin main

   # Em caso de erro de autenticação, use:
   git push -u origin main --force
   ```

3. **Atualizar Código**
   ```bash
   # Buscar alterações
   git fetch origin

   # Atualizar código local
   git pull origin main
   ```

### 3. Fluxo de Trabalho

1. **Criar Nova Branch**
   ```bash
   # Criar e mudar para nova branch
   git checkout -b feature/nova-funcionalidade

   # Ou criar e mudar separadamente
   git branch feature/nova-funcionalidade
   git checkout feature/nova-funcionalidade
   ```

2. **Desenvolvimento**
   ```bash
   # Verificar status
   git status

   # Adicionar arquivos
   git add arquivo.js
   git add .  # Adicionar todos os arquivos

   # Criar commit
   git commit -m "Descrição das alterações"
   ```

3. **Enviar Alterações**
   ```bash
   # Enviar branch para o remoto
   git push origin feature/nova-funcionalidade
   ```

### 4. Resolução de Conflitos

1. **Identificar Conflitos**
   ```bash
   # Tentar fazer pull
   git pull origin main

   # Se houver conflitos, resolver manualmente
   # Depois adicionar e commitar
   git add .
   git commit -m "Resolve conflitos"
   ```

2. **Abortar Operação**
   ```bash
   # Em caso de problemas
   git merge --abort
   git rebase --abort
   ```

### 5. Comandos Úteis

1. **Visualização**
   ```bash
   # Ver histórico
   git log
   git log --oneline
   git log --graph

   # Ver diferenças
   git diff
   git diff arquivo.js
   ```

2. **Gerenciamento de Branches**
   ```bash
   # Listar branches
   git branch
   git branch -a  # Inclui remotos

   # Mudar de branch
   git checkout nome-da-branch

   # Deletar branch
   git branch -d nome-da-branch
   git branch -D nome-da-branch  # Forçar deleção
   ```

3. **Desfazer Alterações**
   ```bash
   # Desfazer último commit
   git reset --soft HEAD~1

   # Desfazer alterações em arquivo
   git checkout -- arquivo.js

   # Desfazer todos os commits não enviados
   git reset --hard origin/main
   ```

### 6. Boas Práticas

1. **Commits**
   - Faça commits frequentes e pequenos
   - Use mensagens descritivas
   - Siga o padrão: "tipo: descrição"
   - Exemplo: "feat: adiciona sistema de login"

2. **Branches**
   - `main`: Código de produção
   - `develop`: Código em desenvolvimento
   - `feature/*`: Novas funcionalidades
   - `bugfix/*`: Correções de bugs
   - `hotfix/*`: Correções urgentes

3. **Pull Requests**
   - Crie PRs pequenos e focados
   - Descreva as mudanças
   - Adicione screenshots se necessário
   - Solicite revisão de código

### 7. Scripts Git Úteis

1. **Configurar Aliases**
   ```bash
   # Adicionar ao .gitconfig
   [alias]
     st = status
     co = checkout
     br = branch
     ci = commit
     lg = log --graph --oneline --all
   ```

2. **Hooks Git**
   ```bash
   # Criar hook de pre-commit
   touch .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

### 8. Backup e Segurança

1. **Backup do Repositório**
   ```bash
   # Criar backup completo
   git bundle create backup.bundle --all

   # Restaurar backup
   git clone backup.bundle
   ```

2. **Proteção de Dados**
   - Não commite arquivos sensíveis
   - Use .gitignore
   - Considere usar git-crypt

## Operação do Sistema

### Comandos Principais

```bash
# Iniciar servidor
npm run dev

# Executar testes
npm run test

# Verificar logs
npm run logs

# Backup do banco
npm run backup

# Atualizar sistema
npm run update
```

### Scripts Disponíveis

- `npm run dev`: Inicia o servidor em modo desenvolvimento
- `npm run test`: Executa os testes automatizados
- `npm run lint`: Verifica o código com ESLint
- `npm run format`: Formata o código com Prettier
- `npm run backup`: Realiza backup do banco de dados
- `npm run restore`: Restaura backup do banco de dados
- `npm run logs`: Exibe logs em tempo real
- `npm run update`: Atualiza o sistema

### Monitoramento

1. **Logs do Sistema**
   ```bash
   # Visualizar logs em tempo real
   tail -f logs/activity_*.log
   tail -f logs/error_*.log
   tail -f logs/security_*.log
   ```

2. **Status do Servidor**
   ```bash
   # Verificar status
   curl http://localhost:34567/api/status

   # Verificar métricas
   curl http://localhost:34567/api/admin/metrics
   ```

3. **Monitoramento de Recursos**
   ```bash
   # CPU e Memória
   top -p $(pgrep -f "node src/index-for-now.js")

   # Uso do Banco
   mysql -u root -p -e "SHOW PROCESSLIST;"
   ```

### Manutenção

1. **Backup Regular**
   ```bash
   # Backup do banco
   mysqldump -u root -p umbraeternum_new > backup_$(date +%Y%m%d).sql

   # Backup dos logs
   tar -czf logs_backup_$(date +%Y%m%d).tar.gz logs/
   ```

2. **Limpeza de Logs**
   ```bash
   # Remover logs antigos
   find logs/ -name "*.log" -mtime +30 -delete
   ```

3. **Atualização do Sistema**
   ```bash
   # Atualizar código
   git pull origin main

   # Atualizar dependências
   npm install

   # Reiniciar servidor
   npm run dev
   ```

## Segurança

### Boas Práticas

1. **Senhas**
   - Mínimo 8 caracteres
   - Incluir maiúsculas, minúsculas e números
   - Trocar regularmente
   - Não reutilizar senhas

2. **Acesso**
   - Usar HTTPS em produção
   - Implementar rate limiting
   - Manter tokens JWT seguros
   - Validar inputs

3. **Backup**
   - Realizar backups diários
   - Manter múltiplas cópias
   - Testar restauração
   - Criptografar dados sensíveis

### Monitoramento de Segurança

1. **Logs de Segurança**
   ```bash
   # Verificar tentativas de login
   grep "login attempt" logs/security_*.log

   # Verificar acessos suspeitos
   grep "suspicious" logs/security_*.log
   ```

2. **Alertas**
   - Configurar notificações para:
     - Tentativas de força bruta
     - Acessos não autorizados
     - Erros críticos
     - Uso excessivo de recursos

## Suporte

### Canais de Suporte

1. **Documentação**
   - [README.md](README.md)
   - [README_API.md](README_API.md)
   - [Documentação Técnica](docs/)

2. **Comunidade**
   - [Discord](https://discord.gg/seu-servidor)
   - [Fórum](https://forum.umbraeternum.com)
   - [GitHub Issues](https://github.com/seu-usuario/UmbraEternum/issues)

3. **Suporte Técnico**
   - Email: suporte@umbraeternum.com
   - Ticket System: [Sistema de Tickets](https://tickets.umbraeternum.com)

### Procedimentos de Suporte

1. **Problemas Comuns**
   - Verificar logs
   - Consultar documentação
   - Testar em ambiente isolado
   - Documentar solução

2. **Escalação**
   - Identificar urgência
   - Notificar equipe técnica
   - Manter registro
   - Acompanhar resolução

## Contribuição

### Como Contribuir

1. **Preparação**
   ```bash
   # Fork o repositório
   git clone https://github.com/seu-usuario/UmbraEternum.git
   cd UmbraEternum

   # Crie uma branch
   git checkout -b feature/nova-feature
   ```

2. **Desenvolvimento**
   - Siga as convenções de código
   - Escreva testes
   - Documente mudanças
   - Teste localmente

3. **Submissão**
   ```bash
   # Commit mudanças
   git commit -am 'Adiciona nova feature'

   # Push para o fork
   git push origin feature/nova-feature

   # Criar Pull Request
   ```

### Padrões de Código

1. **JavaScript/TypeScript**
   - Usar ESLint
   - Seguir Airbnb Style Guide
   - Documentar funções
   - Testar código

2. **Banco de Dados**
   - Usar migrations
   - Otimizar queries
   - Manter índices
   - Documentar schema

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

- Email: contato@umbraeternum.com
- Discord: [Link do Discord](https://discord.gg/seu-servidor)
- Website: [www.umbraeternum.com](https://www.umbraeternum.com)
- GitHub: [github.com/seu-usuario/UmbraEternum](https://github.com/seu-usuario/UmbraEternum)

## Estrutura do Projeto

```
UmbraEternum/
├── src/
│   ├── config/         # Configurações do sistema
│   ├── middlewares/    # Middlewares Express
│   ├── models/         # Modelos de dados
│   ├── routes/         # Rotas da API
│   └── index-for-now.js # Servidor principal
├── logs/               # Logs do sistema
├── tests/              # Testes automatizados
└── docs/               # Documentação
```

## Funcionalidades

### Autenticação
- Registro de usuários
- Login/Logout
- Tokens JWT
- Proteção contra ataques de força bruta

### Personagens
- Criação de personagens
- Atributos e estatísticas
- Sistema de classes
- Inventário

### Comunicação em Tempo Real
- WebSocket para atualizações em tempo real
- Chat global
- Sistema de notificações
- Contagem de jogadores online

### Administração
- Painel administrativo
- Gerenciamento de usuários
- Moderação
- Estatísticas do sistema

## Segurança

- Autenticação JWT
- Senhas hasheadas com bcrypt
- Proteção contra SQL injection
- Rate limiting
- Validação e sanitização de inputs
- CORS configurado
- Logs de segurança

## Desenvolvimento

### Scripts Disponíveis

- `npm run dev`: Inicia o servidor em modo desenvolvimento
- `npm run test`: Executa os testes
- `npm run lint`: Verifica o código com ESLint
- `npm run format`: Formata o código com Prettier

### Testes

O sistema inclui testes automatizados para:
- APIs RESTful
- Conexões WebSocket
- Autenticação
- Validações
- Segurança

### Logs

Os logs são salvos em arquivos diários no diretório `logs/`:
- `activity_YYYY-MM-DD.log`: Atividades do sistema
- `error_YYYY-MM-DD.log`: Erros e exceções
- `security_YYYY-MM-DD.log`: Eventos de segurança

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

- Email: seu-email@exemplo.com
- Discord: [Link do Discord](https://discord.gg/seu-servidor)
- Website: [www.umbraeternum.com](https://www.umbraeternum.com)

## Documentação Detalhada

Para documentação detalhada de todas as APIs disponíveis, consulte o arquivo [README_API.md](README_API.md).

## Scripts de Teste

O sistema inclui vários scripts para testar as funcionalidades:

- `node test-api.js` - Teste geral das APIs
- `node create-admin.js` - Cria um usuário administrador
- `node test-admin-login.js` - Testa o login do administrador
- `node update-admin-role.js` - Atualiza a role do usuário admin para "admin"
- `node create-character.js` - Cria um personagem mago
- `node create-warrior.js` - Cria um personagem guerreiro
- `node update-character.js` - Atualiza um personagem existente
- `node delete-character.js` - Exclui um personagem
- `node summary.js` - Mostra um resumo do sistema (usuários e personagens)

## Teste Completo do Sistema

Para executar todos os testes em sequência e ver todas as funcionalidades em ação:

```bash
node all-in-one-test.js
```

Este script irá:
1. Limpar a base de dados
2. Verificar o status da API
3. Criar usuários (admin e player)
4. Testar login de usuários
5. Criar personagens diferentes (mago e guerreiro)
6. Listar personagens
7. Atualizar um personagem
8. Excluir um personagem
9. Verificar a lista após a exclusão

## Integração com Unreal Engine 5

O sistema foi projetado para integração com a Unreal Engine 5, fornecendo:

### APIs RESTful
- Autenticação de usuários
- Gerenciamento de personagens
- Atualização de status
- Comunicação com o servidor

### WebSocket
- Atualizações em tempo real
- Posicionamento de personagens
- Chat e comunicação
- Eventos do sistema

Para exemplos de código de integração, consulte a seção "Integração com Unreal Engine 5" no [README_API.md](README_API.md).

## Base de Dados

### Estrutura

O sistema utiliza MySQL com as seguintes tabelas principais:

- `users`: Usuários do sistema
- `characters`: Personagens dos jogadores
- `inventory`: Inventário dos personagens
- `skills`: Habilidades e magias
- `quests`: Missões e objetivos
- `logs`: Registro de atividades

### Backup

É recomendado fazer backup regular do banco de dados:

```bash
# Backup do banco de dados
mysqldump -u root -p umbraeternum_new > backup_$(date +%Y%m%d).sql

# Restaurar backup
mysql -u root -p umbraeternum_new < backup_20240327.sql
```

## Monitoramento

O sistema inclui ferramentas de monitoramento:

### Logs
- Logs de atividade
- Logs de erro
- Logs de segurança
- Logs de performance

### Métricas
- Jogadores online
- Uso de CPU/Memória
- Latência
- Taxa de erros

### Alertas
- Notificações de erro
- Alertas de segurança
- Avisos de performance
- Status do servidor

## Manutenção

### Atualizações
1. Faça backup do banco de dados
2. Atualize o código
3. Execute as migrações
4. Teste as funcionalidades
5. Reinicie o servidor

### Limpeza
- Limpeza de logs antigos
- Otimização do banco de dados
- Limpeza de tokens expirados
- Manutenção de arquivos temporários

## Suporte

Para suporte técnico:
1. Verifique a documentação
2. Consulte os logs
3. Entre em contato com a equipe de desenvolvimento
4. Abra uma issue no GitHub

## Roadmap

### Próximas Funcionalidades
- Sistema de guildas
- PvP
- Sistema de crafting
- Missões dinâmicas
- Sistema de achievements

### Melhorias Planejadas
- Otimização de performance
- Interface administrativa
- Sistema de moderação
- Analytics avançado 