# Enviador de WhatsApp — Corrida Everest

Manda a mesma mensagem para um grupo de inscritos de uma vez só, conectando pelo QR code.

---

## Como funciona (resumo)

1. No painel do site → aba **WhatsApp** → escolhe o grupo → **Baixar lista (CSV)**
2. Coloca o arquivo baixado nesta pasta
3. Escreve o texto no `mensagem.txt`
4. Roda o programa, escaneia o QR e ele envia sozinho

---

## Instalar (só na primeira vez)

1. Instale o **Node.js**: https://nodejs.org (versão LTS, é só ir clicando em avançar)
2. Abra esta pasta, clique na barra de endereço, digite `cmd` e dê Enter
3. Digite:

```
npm install
```

Baixa uns 300 MB (um navegador interno). Só acontece uma vez.

---

## Os 4 grupos

O painel exporta cada grupo separado. O programa também sabe filtrar sozinho:

| Grupo | Quem recebe | Serve para |
|---|---|---|
| **Todos** | todo mundo que se inscreveu | avisos gerais, "tá chegando a hora" |
| **Confirmados** | quem já pagou | instruções do dia da prova |
| **Falta pagar** | preencheu mas não confirmou | lembrete de pagamento |
| **Falta retirar o kit** | confirmados sem retirar | "corre que o kit te espera" |

```
node enviar.js --arquivo contatos-semkit.csv
```

Ou deixe o programa filtrar:

```
node enviar.js --arquivo lista.csv --grupo semkit
```

Grupos aceitos: `todos`, `confirmados`, `pendentes`, `semkit`.

---

## A mensagem

Abra `mensagem.txt` e escreva. Pode usar:

| Etiqueta | Vira |
|---|---|
| `{nome}` | primeiro nome |
| `{nomecompleto}` | nome completo |
| `{protocolo}` | protocolo da inscrição |
| `{camiseta}` | tamanho da camiseta |

**Exemplos prontos:**

> Falta pagar:
> `Oi {nome}! Sua vaga na Corrida Everest ainda está aguardando pagamento. Protocolo {protocolo}. Quer que eu te mande o PIX?`

> Falta retirar o kit:
> `Oi {nome}! Seu kit já está te esperando na recepção da Everest. É só levar um documento com foto. Não deixa pra última hora!`

> Véspera:
> `Oi {nome}! Amanhã é dia! Largada às 6h na Rua São José, 59. Chega cedo, hidrata bem e bora pro topo! 🏔`

---

## Testar antes (não envia nada)

```
node enviar.js --teste
```

Mostra quantos vão receber e simula tudo.

## Enviar de verdade

```
node enviar.js
```

Aparece o QR no terminal. No celular: **WhatsApp → Aparelhos conectados → Conectar aparelho**.
Escaneou, ele começa.

---

## Como ele evita bloqueio

- Espera **8 a 20 segundos** entre mensagens (tempo aleatório)
- A cada **40 mensagens**, descansa **5 minutos**
- Só envia pra quem **autorizou** na inscrição
- Guarda quem já recebeu no `enviados.json` — travou ou fechou? Roda de novo que ele
  **continua de onde parou** e nunca manda duas vezes pra mesma pessoa

Por isso é lento de propósito: 300 pessoas levam umas 2 horas. É o preço de não ter o
número bloqueado.

---

## Avisos

**Use um chip dedicado.** Automação de WhatsApp não é oficial. Se usar o número principal
da academia e cair denúncia de spam, ele pode ser bloqueado.

**Mande só o que a pessoa espera.** Aviso da corrida em que ela se inscreveu: ótimo.
Propaganda que ela não pediu: gera denúncia, e denúncia gera bloqueio.

---

## Arquivos

| Arquivo | Serve para |
|---|---|
| `enviar.js` | o programa |
| `mensagem.txt` | o texto enviado |
| `contatos-*.csv` | a lista baixada do painel |
| `enviados.json` | quem já recebeu (não apague no meio de um envio) |
| `sessao/` | seu login. Apagou = escaneia o QR de novo |

## Problemas comuns

**"Não achei o arquivo"** — baixe a lista no painel e coloque nesta pasta (ou use `--arquivo nome.csv`).

**QR não aparece / falha de autenticação** — apague a pasta `sessao` e rode de novo.

**Quero mandar de novo pra todo mundo** — apague o `enviados.json`.
