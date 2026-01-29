# Checklist de Validacao - BBT Connect

Use este checklist para validar o sistema antes de liberar para producao.

---

## 1. Autenticacao

- [ ] Login com credenciais validas funciona
- [ ] Login com credenciais invalidas mostra erro claro
- [ ] Logout funciona e redireciona para login
- [ ] Sessao expira apos tempo de inatividade
- [ ] Usuario bloqueado nao consegue acessar

---

## 2. Envio de Documentos (Operador)

- [ ] Arrastar e soltar documentos funciona
- [ ] Clicar para selecionar documentos funciona
- [ ] Classificacao de tipo de documento funciona
- [ ] Upload mostra barra de progresso
- [ ] Botao "Enviar" cria submission com sucesso
- [ ] Notificacao de sucesso aparece
- [ ] Documentos aparecem na lista de "Minhas Corridas"

---

## 3. Minhas Corridas (Operador)

- [ ] Lista todos os cadastros do operador logado
- [ ] Filtros por status funcionam (Pendente, Em Analise, Aprovado, Devolvido, Rejeitado)
- [ ] Busca por motorista/placa/CPF funciona
- [ ] Expandir card mostra detalhes completos
- [ ] Documentos sao listados ao expandir
- [ ] Clicar em documento abre modal de preview
- [ ] **Para devolvidos:** botao "Adicionar" documento aparece
- [ ] **Para devolvidos:** upload de novo documento funciona
- [ ] **Para devolvidos:** excluir documento funciona
- [ ] Botao "Reenviar para Analise" muda status para pendente

---

## 4. Cadastro GR (Analista)

- [ ] Fila de pendentes carrega corretamente
- [ ] Clicar em item abre modal de detalhes
- [ ] Visualizar documentos funciona
- [ ] Pode aprovar cadastro
- [ ] Pode devolver com motivo obrigatorio
- [ ] Pode rejeitar com motivo obrigatorio
- [ ] Acoes atualizam fila em tempo real (WebSocket)
- [ ] Notificacao e enviada para operador ao devolver

---

## 5. Visualizacao de Documentos

- [ ] Imagens carregam corretamente
- [ ] Zoom in/out funciona
- [ ] PDFs carregam corretamente
- [ ] Navegacao de paginas funciona (para PDFs multipaginas)
- [ ] Timeout aparece apos 30s se falhar (nao fica em loop infinito)
- [ ] Botao "Tentar novamente" funciona
- [ ] Botao "Baixar arquivo" funciona como fallback
- [ ] Download do arquivo funciona

---

## 6. WebSocket / Tempo Real

- [ ] Indicador "Tempo Real" fica verde quando conectado
- [ ] Indicador mostra "Reconectando..." quando desconectado
- [ ] Atualizacoes de status aparecem sem precisar dar refresh
- [ ] Reconexao automatica funciona apos queda de conexao

---

## 7. Dashboard Gestao

- [ ] KPIs carregam corretamente
- [ ] Graficos renderizam
- [ ] Filtros por data funcionam
- [ ] Dados sao consistentes com a realidade

---

## 8. TV Display

- [ ] Pagina carrega sem necessidade de login
- [ ] Atualiza automaticamente (polling ou WebSocket)
- [ ] Mostra dados em tempo real
- [ ] Layout adaptado para tela grande

---

## 9. Performance

- [ ] Paginas carregam em menos de 3 segundos
- [ ] Nao ha erros no console do navegador
- [ ] API responde em menos de 2 segundos
- [ ] Upload de arquivos grandes (>5MB) funciona
- [ ] Lista com muitos itens nao trava

---

## 10. Mobile / Responsivo

- [ ] Layout responsivo funciona em celular
- [ ] Menu hamburguer abre e fecha
- [ ] Upload de documentos funciona via camera do celular
- [ ] Modal de preview funciona em tela pequena
- [ ] Botoes tem tamanho adequado para toque

---

## 11. Seguranca

- [ ] Rotas protegidas redirecionam para login
- [ ] Usuario sem permissao nao acessa areas restritas
- [ ] Sessao invalida redireciona para login
- [ ] Cookies de sessao estao configurados corretamente

---

## 12. Erros e Excecoes

- [ ] Erro de conexao mostra mensagem amigavel
- [ ] API indisponivel mostra tela de erro
- [ ] Arquivo corrompido mostra erro ao tentar visualizar
- [ ] Formularios validam campos obrigatorios

---

## Comandos de Deploy

### Apos validar localmente:

```bash
git add -A
git commit -m "release: versao pronta para producao"
git push origin main
```

### No servidor (Portainer ou SSH):

```bash
cd /opt/bbt-connect
git pull origin main
docker compose -f docker-compose.simple.yml down
docker compose -f docker-compose.simple.yml build --no-cache
docker compose -f docker-compose.simple.yml up -d
```

### Verificar logs:

```bash
docker compose -f docker-compose.simple.yml logs -f
```

---

## Notas de Versao

### v1.1.0 - Correcoes de Visualizacao e Documentos

- **PreviewModal**: Adicionado timeout de 30s para PDFs e 15s para imagens
- **PreviewModal**: Adicionado botao "Tentar novamente" em caso de erro
- **PreviewModal**: Adicionado fallback para download quando preview falha
- **Minhas Corridas**: Operador pode visualizar documentos de qualquer cadastro
- **Minhas Corridas**: Operador pode adicionar documentos em cadastros devolvidos
- **Minhas Corridas**: Operador pode excluir documentos em cadastros devolvidos
- **Minhas Corridas**: Interface melhorada para gerenciamento de documentos
