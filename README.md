# LocaPrinter

Sistema de gestão para locação de impressoras e equipamentos, com suporte a múltiplas empresas, gestão de clientes, equipamentos e relatórios de contadores.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/) (recomendado)

## Configuração do Ambiente

1. **Clone o repositório:**
```bash
git clone https://github.com/rodrigo847/LocaPrinter.git
cd LocaPrinter
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente (PowerShell):**
```powershell
Copy-Item .env.example .env.local
```
Para abrir a prévia sem backend, mantenha `VITE_DEMO_MODE=true`. Para usar a gestão online,
defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e altere o modo para `false`.

4. **Opcional — inicie os serviços Docker necessários ao backend:**
```bash
docker-compose up -d
```

5. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`. O frontend pode ser aberto
sem iniciar o Docker quando `VITE_DEMO_MODE=true`.

## Publicação na Vercel

- Conecte o repositório `rodrigo847/LocaPrinter` e a branch `main`.
- Utilize o preset Vite, o comando `npm run build` e a pasta de saída `dist`.
- Para a prévia, configure `VITE_DEMO_MODE=true` nas variáveis de ambiente da Vercel.
- Alterações nas variáveis exigem um novo deploy.
- O arquivo `vercel.json` permite acessar e atualizar as rotas internas diretamente,
  sem retornar 404. Arquivos em `/assets/` continuam sendo servidos como arquivos estáticos.

A prévia não salva clientes no banco. Para usar dados reais, siga a configuração
de autenticação, tabelas e políticas de acesso abaixo. Nunca
configure a chave `service_role` ou a senha do banco em variáveis `VITE_`.

## Empresas e clientes no banco

A primeira integração real utiliza `companies` e `clients`. O SQL versionado em
`supabase/migrations/202610220001_companies_clients.sql` cria tabelas, validações,
índices e políticas RLS. A migração deve ser aplicada uma única vez. O teste em
`supabase/tests/companies_clients.sql` verifica CRUD, restrições e isolamento entre
usuários em uma transação revertida, sem deixar cadastros de teste.

Para habilitar a gestão online:

1. No Supabase Auth, desative **Allow new users to sign up** e mantenha logins
   anônimos desativados. Autorize o usuário em **Authentication → Users**.
2. Configure **Site URL** com a URL exata da aplicação publicada.
3. Conecte o banco ao projeto da Vercel. O build aceita `SUPABASE_URL` e
   `SUPABASE_ANON_KEY` da integração, expondo somente esses dois valores públicos
   nos nomes `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. As variáveis `VITE_`
   explícitas têm prioridade; nenhuma senha ou chave administrativa é exposta.
4. Altere `VITE_DEMO_MODE=false` e publique novamente.
5. No primeiro acesso, abra o convite recebido no e-mail autorizado. Cada link
   funciona uma única vez; um novo envio pode invalidar o anterior.
6. Dentro da aplicação, use **Definir/alterar senha** para escolher sua senha
   (mínimo de 12 caracteres). Depois, entre com e-mail e senha em outros aparelhos,
   sem depender de novos e-mails. **Primeiro acesso ou esqueci minha senha**
   continua disponível para solicitar um link, sujeito aos limites do provedor.
7. Cadastre a empresa
   antes de cadastrar clientes. Cada conta só acessa empresas das quais é
   proprietária; convites e equipes compartilhadas ainda não estão implementados.

O envio de e-mails depende dos limites e das regras do provedor de e-mail do
Supabase. O provedor padrão pode restringir destinatários aos membros da
organização; para outros destinatários ou uso contínuo, configure SMTP próprio.

Somente empresas e clientes têm persistência nesta etapa. Equipamentos,
documentos e relatórios exibem um aviso no modo online para não simular
operações que ainda não são salvas.

## Funcionalidades previstas

A lista abaixo descreve o escopo planejado. A disponibilidade real nesta etapa
está descrita em **Empresas e clientes no banco**.

### Dashboard
- Estatísticas em tempo real
- Gráficos de evolução de equipamentos
- Visualização de manutenções pendentes

### Gestão de Clientes
- Cadastro e edição de clientes
- Gerenciamento de departamentos
- Histórico de locações

### Gestão de Equipamentos
- Cadastro de impressoras e equipamentos
- Monitoramento de status
- Histórico de manutenções
- Relatórios de contadores

### Relatórios
- Geração de relatórios customizados
- Exportação em múltiplos formatos
- Análise de dados históricos

### Suporte Técnico
- Abertura de chamados
- Acompanhamento de status
- Base de conhecimento

## Tecnologias Utilizadas

- React com TypeScript
- Material-UI para interface
- Node.js para backend
- PostgreSQL para banco de dados
- Redis para cache
- MinIO para armazenamento de arquivos
- Docker para containerização

## Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
