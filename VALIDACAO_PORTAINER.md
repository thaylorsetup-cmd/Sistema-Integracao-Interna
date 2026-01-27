# 🚀 Tutorial de Validação no Portainer

Como subimos alterações críticas (banco de dados e autenticação), precisamos garantir que o Portainer baixe a versão mais recente do código e recrie os containers corretamente.

## Passo 1: Atualizar a Stack no Portainer

O primeiro passo é forçar o Portainer a pegar as alterações que acabamos de enviar para o GitHub.

1.  Acesse seu Portainer: **[https://portainer.bbttransportes.com.br](https://portainer.bbttransportes.com.br)**
2.  No menu lateral esquerdo, clique em **Stacks**.
3.  Localize e clique na stack do projeto (provavelmente chamada `bbt-connect` ou `sistema-integracao`).
4.  No topo da página da stack, clique na aba **Editor**.
5.  Você verá o botão **"Update the stack"** (geralmente azul, no final da página).
6.  ⚠️ **MUITO IMPORTANTE**: Antes de clicar em Update, **ative a opção "Re-pull image and redeploy"** (ou "Git Repository" > "Re-pull"). Isso garante que ele baixe o código novo do Git.
7.  Clique em **Update**.

*Aguarde alguns instantes. O Portainer vai parar os containers antigos, baixar o novo código e subir os novos.*

---

## Passo 2: Verificar os Logs do Backend

Precisamos confirmar se a automação que criei (Auto-Migrate) funcionou e criou a coluna de senha no banco.

1.  Ainda no Portainer, vá no menu **Containers**.
2.  Procure pelo container do backend (ex: `bbt-connect-backend-1` ou similar).
3.  Clique no ícone de "página" ou "lista" na coluna **Quick Actions** para ver os **Logs** (ou clique no nome e depois em "Logs").
4.  Role até o final e procure por mensagens assim:
    *   `Iniciando migracoes do banco de dados...`
    *   `Executando migracao: 008_simple_password_auth.sql`
    *   `Migracoes concluidas com sucesso!`
    *   `BBT Connect Backend v1.0.0` (indicando que o servidor subiu).

*Se você ver essas mensagens, significa que o banco de dados foi atualizado com sucesso.*

---

## Passo 3: Testar o Login na Aplicação

Agora a validação funcional.

1.  Acesse a aplicação: **[https://control.bbttransportes.com.br](https://control.bbttransportes.com.br)**
2.  **Verificação Visual**:
    *   A tela de login deve ter mudado.
    *   **Antes**: Apenas campo "Email" e botão "Enviar Código".
    *   **Agora**: Campos **Email** E **Senha**.
3.  **Teste de Acesso**:
    Use uma das credenciais padrão que configuramos:

    | Perfil | Email | Senha |
    | :--- | :--- | :--- |
    | **Admin** | `admin@bbt.com` | `admin123` |
    | **Gestor** | `gestor@bbt.com` | `bbt123` |
    | **Operador** | `operador@bbt.com` | `bbt123` |

4.  Se o login for bem sucedido e você for redirecionado para o Dashboard, **Parabéns! O sistema está validado.** 🏆

---

### Solução de Problemas Comuns

**Problema 1: A tela de login ainda pede código (versão antiga).**
*   **Causa**: O navegador está com cache antigo do Frontend.
*   **Solução**: Pressione `CTRL + SHIFT + R` (ou `Cmd + Shift + R` no Mac) na página de login para forçar atualização.

**Problema 2: Erro 500 ou "Erro de conexão" ao tentar logar.**
*   **Causa**: O container do backend pode não ter reiniciado corretamente ou o banco ainda está subindo.
*   **Solução**: Volte no Portainer > Containers e reinicie manualmente o container `backend`. Verifique os logs novamente.
