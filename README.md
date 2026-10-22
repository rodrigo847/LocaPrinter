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
Para abrir a prévia sem backend, mantenha `VITE_DEMO_MODE=true`. Para usar documentos,
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

A prévia não salva clientes no banco. Antes de usar dados reais, implemente
autenticação, persistência e políticas de acesso por empresa no Supabase. Nunca
configure a chave `service_role` ou a senha do banco em variáveis `VITE_`.

## Funcionalidades

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
