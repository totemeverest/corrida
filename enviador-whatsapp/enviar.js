/**
 * Enviador de mensagens da Corrida Everest
 * Lê a lista exportada do painel (CSV) e envia uma mensagem para cada contato.
 *
 * Uso:  node enviar.js                       -> envia de verdade
 *       node enviar.js --teste               -> simula (não envia nada)
 *       node enviar.js --arquivo outra.csv   -> usa outro CSV
 */

const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ----------------- configuração -----------------
const args      = process.argv.slice(2);
const MODO_TESTE = args.includes('--teste');
const ARQ_CSV   = (args.includes('--arquivo') ? args[args.indexOf('--arquivo') + 1] : null)
                  || 'contatos-todos.csv';
const GRUPO     = (args.includes('--grupo') ? args[args.indexOf('--grupo') + 1] : 'todos').toLowerCase();
const ARQ_MSG   = 'mensagem.txt';
const ARQ_LOG   = 'enviados.json';

const ESPERA_MIN = 8000;      // espera mínima entre mensagens (8s)
const ESPERA_MAX = 20000;     // espera máxima entre mensagens (20s)
const TAMANHO_LOTE = 40;      // a cada 40 envios...
const PAUSA_LOTE   = 5 * 60 * 1000;  // ...descansa 5 minutos

// ----------------- utilidades -----------------
const espera = ms => new Promise(r => setTimeout(r, ms));
const aleatorio = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const soDigitos = s => String(s || '').replace(/\D/g, '');

function lerCSV(arquivo) {
  if (!fs.existsSync(arquivo)) {
    console.error(`\n❌ Não achei o arquivo "${arquivo}".`);
    console.error('   Baixe a lista no painel do site (aba WhatsApp → Baixar lista) e coloque nesta pasta.\n');
    process.exit(1);
  }
  const texto = fs.readFileSync(arquivo, 'utf8').replace(/^﻿/, '');
  const linhas = texto.split(/\r?\n/).filter(l => l.trim());
  const cab = linhas.shift().split(';').map(c => c.trim());
  return linhas.map(l => {
    const partes = l.split(';');
    const o = {};
    cab.forEach((c, i) => o[c] = (partes[i] || '').trim());
    return o;
  });
}

function lerMensagem() {
  if (!fs.existsSync(ARQ_MSG)) {
    fs.writeFileSync(ARQ_MSG,
      'Oi {nome}! Aqui é da Everest 💜\n\n' +
      'Sua inscrição na 2ª Corrida Everest está confirmada.\n' +
      'Protocolo: {protocolo} · Camiseta {camiseta}\n\n' +
      'Qualquer dúvida é só chamar por aqui!');
    console.log(`📝 Criei o arquivo "${ARQ_MSG}". Edite a mensagem e rode de novo.\n`);
    process.exit(0);
  }
  return fs.readFileSync(ARQ_MSG, 'utf8');
}

function montarMensagem(modelo, c) {
  const primeiro = (c.nome || '').trim().split(' ')[0] || '';
  return modelo
    .replaceAll('{nome}', primeiro)
    .replaceAll('{nomecompleto}', c.nome || '')
    .replaceAll('{protocolo}', c.protocolo || '')
    .replaceAll('{camiseta}', c.camiseta || '')
    .replaceAll('{status}', c.status || '');
}

const carregarLog = () => fs.existsSync(ARQ_LOG) ? JSON.parse(fs.readFileSync(ARQ_LOG, 'utf8')) : {};
const salvarLog = l => fs.writeFileSync(ARQ_LOG, JSON.stringify(l, null, 2));

// resolve o número no WhatsApp (trata o 9º dígito do Brasil)
async function resolverNumero(client, numero) {
  let d = soDigitos(numero);
  if (!d.startsWith('55')) d = '55' + d;
  let id = await client.getNumberId(d);
  if (id) return id._serialized;

  const ddd = d.slice(2, 4), resto = d.slice(4);
  const alt = (resto.length === 9 && resto[0] === '9') ? '55' + ddd + resto.slice(1)
            : (resto.length === 8) ? '55' + ddd + '9' + resto : null;
  if (alt) { id = await client.getNumberId(alt); if (id) return id._serialized; }
  return null;
}

// ----------------- programa -----------------
const contatos = lerCSV(ARQ_CSV);
const modelo = lerMensagem();
const log = carregarLog();

const NOMES_GRUPO = {
  todos:       'Todos',
  confirmados: 'Confirmados',
  pendentes:   'Falta pagar',
  semkit:      'Falta retirar o kit'
};

const fila = contatos.filter(c => {
  const n = soDigitos(c.numero);
  if (n.length < 12) return false;                                      // número inválido
  if (String(c.aceita_whatsapp).toLowerCase() === 'nao') return false;  // não autorizou
  if (log[n]) return false;                                             // já enviei antes

  const st = String(c.status || '').toLowerCase();
  const kit = String(c.kit_retirado || '').toLowerCase();
  if (GRUPO === 'confirmados') return st === 'confirmado';
  if (GRUPO === 'pendentes')   return st === 'pendente';
  if (GRUPO === 'semkit')      return st === 'confirmado' && kit !== 'sim';
  return st !== 'cancelado';
});

console.log('\n════════════════════════════════════════');
console.log('   ENVIADOR — CORRIDA EVEREST');
console.log('════════════════════════════════════════');
console.log(`Arquivo:        ${ARQ_CSV}`);
console.log(`Grupo:          ${NOMES_GRUPO[GRUPO] || GRUPO}`);
console.log(`Contatos:       ${contatos.length}`);
console.log(`Já enviados:    ${Object.keys(log).length}`);
console.log(`Vão receber:    ${fila.length}`);
if (MODO_TESTE) console.log('MODO TESTE — nada será enviado de verdade');
console.log('════════════════════════════════════════\n');

if (!fila.length) { console.log('Nada a enviar. 👌\n'); process.exit(0); }

const tempoMedio = ((fila.length * (ESPERA_MIN + ESPERA_MAX) / 2) + Math.floor(fila.length / TAMANHO_LOTE) * PAUSA_LOTE) / 60000;
console.log(`⏱  Tempo estimado: ~${Math.ceil(tempoMedio)} minutos (o envio é lento de propósito).\n`);

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'everest', dataPath: path.join(__dirname, 'sessao') }),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] }
});

client.on('qr', qr => {
  console.log('📱 Abra o WhatsApp → Aparelhos conectados → Conectar aparelho e escaneie:\n');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => console.log('\n✅ Autenticado.'));
client.on('auth_failure', () => console.error('\n❌ Falha na autenticação. Apague a pasta "sessao" e tente de novo.'));

client.on('ready', async () => {
  console.log(`\n🚀 Conectado como: ${client.info?.pushname || '—'}`);
  console.log('Começando em 5 segundos... (Ctrl+C para cancelar)\n');
  await espera(5000);

  let ok = 0, erro = 0;

  for (let i = 0; i < fila.length; i++) {
    const c = fila[i];
    const n = soDigitos(c.numero);
    const etiqueta = `[${i + 1}/${fila.length}] ${c.nome || n}`;

    try {
      const destino = await resolverNumero(client, n);
      if (!destino) { console.log(`⚠️  ${etiqueta} — número não existe no WhatsApp`); erro++; continue; }

      const texto = montarMensagem(modelo, c);

      if (MODO_TESTE) {
        console.log(`🧪 ${etiqueta} — (teste, não enviado)`);
      } else {
        await client.sendMessage(destino, texto, { linkPreview: false });
        log[n] = { nome: c.nome, protocolo: c.protocolo, em: new Date().toISOString() };
        salvarLog(log);
        console.log(`✅ ${etiqueta}`);
      }
      ok++;
    } catch (e) {
      console.log(`❌ ${etiqueta} — ${e.message}`);
      erro++;
    }

    if (i < fila.length - 1) {
      if ((i + 1) % TAMANHO_LOTE === 0) {
        console.log(`\n😴 ${TAMANHO_LOTE} enviadas. Pausa de ${PAUSA_LOTE / 60000} minutos para não levar bloqueio...\n`);
        await espera(PAUSA_LOTE);
      } else {
        await espera(aleatorio(ESPERA_MIN, ESPERA_MAX));
      }
    }
  }

  console.log('\n════════════════════════════════════════');
  console.log(`   FIM — ${ok} enviadas, ${erro} com problema`);
  console.log('════════════════════════════════════════\n');
  await client.destroy();
  process.exit(0);
});

client.initialize();
