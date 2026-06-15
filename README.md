# Catálogo de Eletrônicos — Front-end (Google AI Studio) + n8n + Google Sheets

Sistema de catálogo de produtos eletrônicos com CRUD completo (criar, listar, editar, excluir), onde a planilha do Google Sheets funciona como banco de dados, o n8n funciona como API/backend, e o front-end (gerado no Google AI Studio) consome essa API com atualização automática (polling).

## Arquitetura

```
Front-end (React, localhost:3000)
        |  HTTP (fetch)
        v
n8n (localhost:5678)  -->  Google Sheets API  -->  Planilha (banco de dados)
```

- O front-end nunca acessa a planilha diretamente.
- O n8n expõe 4 "endpoints" (webhooks), um para cada operação do CRUD.
- O front-end faz polling (a cada poucos segundos) no endpoint de listagem para refletir mudanças feitas direto na planilha.

---

## Pré-requisitos

- Node.js instalado (para rodar `npx n8n` e o front-end)
- Uma conta Google
- Projeto exportado do Google AI Studio (rodando localmente via `npm run dev`)

---

## 1. Planilha do Google Sheets

Crie uma planilha nova com uma aba contendo, na primeira linha, exatamente estes cabeçalhos:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| id | nome | categoria | preco | estoque | descricao |

Cada linha abaixo representa um produto. **O `id` deve ser único e numérico** para cada produto (evite duplicatas e células vazias na coluna `id`).

---

## 2. Configurar credenciais do Google (OAuth)

1. Acesse [console.cloud.google.com](https://console.cloud.google.com) e crie um novo projeto.
2. Em **APIs e Serviços → Biblioteca**, ative:
   - **Google Sheets API**
   - **Google Drive API**
3. Vá em **Google Auth Platform** (antiga "Tela de consentimento OAuth"):
   - **Branding/Overview**: clique em "Primeiros Passos", escolha **Externo**, preencha nome do app e seu e-mail.
   - **Público-alvo (Audience)**: adicione seu próprio e-mail como "usuário de teste".
   - **Clientes (Clients)**: clique em "Criar cliente OAuth" → tipo **Aplicativo da Web**.
4. Você vai precisar do **Redirect URI** do n8n (`http://localhost:5678/rest/oauth2-credential/callback`) — adicione-o em "URIs de redirecionamento autorizados" ao criar o cliente.
5. Copie o **Client ID** e **Client Secret** gerados (use o botão "Baixar JSON" se necessário).

---

## 3. Instalar e rodar o n8n

```bash
npx n8n
```

Aguarde a mensagem `Editor is now accessible via: http://localhost:5678`, abra essa URL e crie sua conta local.

### Conectar Google Sheets

Ao adicionar o primeiro nó "Google Sheets", crie uma credencial:
- Cole o **Client ID** e **Client Secret** obtidos no passo 2.
- Clique em **"Sign in with Google"** e autorize (pode aparecer um aviso de "app não verificado" — clique em "Avançado" → "Acessar [app] (não seguro)", é normal para apps em modo de teste).

---

## 4. Workflows do n8n

Todos os workflows abaixo ficam no **mesmo workflow do n8n** (vários Webhooks separados). Depois de configurar todos, clique em **"Publish"** para ativar as URLs de produção.

⚠️ **Lembre-se**: toda vez que editar qualquer nó, é preciso clicar em **"Publish"** novamente para a mudança valer nas chamadas reais do front-end.

### 4.1 Listar produtos — `GET /produtos`

| Nó | Configuração |
|---|---|
| Webhook | Method: `GET`, Path: `produtos`, Respond: `When Last Node Finishes`, Response Data: `All Entries`, Allowed Origins (CORS): `*` |
| Google Sheets | Operation: `Get Row(s)`, Document/Sheet: sua planilha |

### 4.2 Criar produto — `POST /produtos/criar`

| Nó | Configuração |
|---|---|
| Webhook | Method: `POST`, Path: `produtos/criar`, Respond: `When Last Node Finishes`, Response Data: `All Entries`, CORS: `*` |
| Edit Fields | `id` (Number) = `{{ $now.toMillis() }}` <br> `nome` (String) = `{{ $json.body.nome }}` <br> `categoria` (String) = `{{ $json.body.categoria }}` <br> `preco` (Number) = `{{ $json.body.preco }}` <br> `estoque` (Number) = `{{ $json.body.estoque }}` <br> `descricao` (String) = `{{ $json.body.descricao }}` |
| Google Sheets | Operation: `Append Row`, Mapping: Manual — cada coluna = `{{ $json.<campo> }}` (sem `.body`, pois vem do Edit Fields) |

### 4.3 Editar produto — `PUT /produtos/editar`

| Nó | Configuração |
|---|---|
| Webhook | Method: `PUT`, Path: `produtos/editar`, Respond: `When Last Node Finishes`, Response Data: `All Entries`, CORS: `*` |
| Edit Fields | Mesmos 6 campos do item 4.2, mas `id` (Number) = `{{ $json.body.id }}` (não gera novo id, usa o existente) |
| Google Sheets | Operation: `Update Row`, **Column to Match On**: `id` <br> "Values to Update" → `id (using to match)` = `{{ $json.id }}`, demais campos = `{{ $json.<campo> }}` |

### 4.4 Excluir produto — `DELETE /produtos/deletar`

| Nó | Configuração |
|---|---|
| Webhook | Method: `DELETE`, Path: `produtos/deletar`, Respond: `When Last Node Finishes`, Response Data: `First Entry JSON`, CORS: `*` |
| Edit Fields | `id` (Number) = `{{ $json.body.id }}` |
| Google Sheets (1) | Operation: `Get Row(s)`, Filtro: coluna `id` = `{{ $json.id }}` (retorna `row_number`) |
| Google Sheets (2) | Operation: `Delete Rows or Columns from Sheet`, To Delete: `Rows`, Start Index: `{{ $json.row_number - 1 }}`, Number of Rows: `1` |

---

## 5. Front-end (Google AI Studio)

No arquivo principal (`App.tsx`), confirme a constante:

```javascript
const API_BASE_URL = "http://localhost:5678/webhook";
```

Rodar localmente:

```bash
npm install
npm run dev
```

Acesse a URL exibida no terminal (geralmente `http://localhost:3000`).

### Dashboard com gráficos (Recharts)

O topo do catálogo exibe um painel (`src/components/DashboardCharts.tsx`) montado com a biblioteca [Recharts](https://recharts.org/):

- **Faixa de KPIs**: Total de Produtos, Valor do Inventário, Categorias Ativas e Estoque Crítico (≤3).
- **Produtos por Categoria** (gráfico de barras horizontal).
- **Valor do Inventário** por categoria (gráfico de pizza/rosca, soma de `preco × estoque`).
- **Distribuição de Estoque** em faixas: Crítico (≤3), Baixo (4–10) e Saudável (>10).

Todas as agregações são calculadas a partir da lista de produtos vinda do n8n, então o painel se atualiza junto com o polling.

> A dependência `recharts` é instalada automaticamente pelo `npm install`. Caso esteja partindo de uma versão antiga do projeto, rode `npm install recharts`.

### Robustez de dados (busca e ordenação)

A busca e a ordenação em `App.tsx` são tolerantes a dados imperfeitos vindos da planilha:

- Campos de texto são normalizados com `String(value ?? '')` antes de `.toLowerCase()` / `.localeCompare()`, evitando erros quando uma célula está vazia ou o `id` chega como número.
- Campos numéricos (`preco`, `estoque`) usam `Number(value) || 0`, evitando `NaN` na ordenação quando a célula está vazia ou inválida.

---

## 6. Como rodar o projeto (rotina de uso)

1. Terminal 1 → `npx n8n` → aguardar "Editor is now accessible via..."
2. Terminal 2 → dentro da pasta do front-end → `npm run dev`
3. Abrir `http://localhost:3000`

Os workflows do n8n permanecem publicados entre reinicializações (dados salvos localmente). Basta os dois processos estarem rodando.

Para parar: `Ctrl+C` em cada terminal.

---

## 7. Problemas comuns (lições aprendidas)

- **CORS**: cada nó Webhook precisa ter "Allowed Origins (CORS)" = `*` (ou a origem do front).
- **Mudanças não refletidas**: sempre clicar em **Publish** após editar qualquer nó.
- **`{{ $json.body.X }}` vs `{{ $json.X }}`**: logo após o Webhook, os dados ficam em `$json.body.X`. Depois de um nó "Edit Fields", os campos já ficam "soltos" (`$json.X`, sem `.body`).
- **`$execution.id` ≠ `$json.id`**: `$execution.id` é o ID interno da execução do workflow, não o ID do produto. Não usar isso para "Column to Match On".
- **"Column to Match On" obrigatório**: na operação "Update Row", sempre selecionar a coluna (`id`) e preencher o valor de match (`{{ $json.id }}`).
- **IDs únicos**: cada produto precisa de um `id` único na planilha. IDs duplicados ou vazios causam comportamento inesperado no editar/excluir.
- **Tipos número vs texto**: o `id` vem como número da planilha. No front-end, sempre converter com `String(product.id)` antes de usar métodos de string (`.substring()`, `.toLowerCase()`, etc.).
- **Publish ≠ Save**: o n8n salva automaticamente (rascunho), mas só o botão "Publish" coloca a versão em produção (URLs `/webhook/...`, sem "-test").
