# 2ª Corrida Everest — site de inscrições

Site de inscrição da 2ª Corrida Everest (Gravatá/PE — 20/09/2026).
Tudo roda em um único arquivo: `index.html` (HTML + CSS + JS, com as logos embutidas).

**Site publicado:** https://darlissondarlan.github.io/corridaeverest/

---

## Como funciona

1. O corredor escolhe o tamanho da camiseta e preenche os dados.
2. Escolhe a forma de pagamento:
   - **PIX** → recebe a chave e envia o comprovante no WhatsApp.
   - **Cartão** → vai pro WhatsApp da Everest com os dados prontos e recebe o link de pagamento (até 3x sem juros).
   - **Dinheiro** → paga presencialmente na recepção.
3. A inscrição entra como **aguardando pagamento**.
4. O organizador confirma no painel → **só então o estoque da camiseta baixa** e a vaga fica garantida.

## Painel do organizador

- Acesse pelo link "Área do organizador" no rodapé, ou adicione `#admin` na URL.
- Abas: **Inscrições** (confirmar/cancelar), **Ajustes & estoque** (lotes, preços, estoque, kit) e **Divulgação** (gerar QR code).

## Onde editar as informações

Abra o `index.html` e procure o bloco `const CONFIG = {` (logo no começo do `<script>`).
Lá ficam: dados do evento, lotes e preços, estoque de camisetas, kit, programação, regras, FAQ, chave PIX e WhatsApp.

> Ao alterar preços ou estoque no CONFIG, aumente o número em `settingsVersao`.
> Isso faz o site reaplicar os valores novos (senão ele mantém o que já estava salvo no banco).

## Estado atual

O site está em **modo demo**: as inscrições ficam salvas no navegador de quem acessa.
Para funcionar de verdade, é preciso preencher `CONFIG.firebase` com os dados de um projeto Firebase (Firestore) e configurar as regras de segurança.

## Pendências

- [ ] Conectar o Firebase (sair do modo demo)
- [ ] Traçado do percurso
- [ ] Premiação
- [ ] Idade mínima
- [ ] Fotos da 1ª edição (galeria)
- [ ] Logos dos patrocinadores
