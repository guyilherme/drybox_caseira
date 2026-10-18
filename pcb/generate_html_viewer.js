const fs = require('fs');
const path = require('path');

const zipBuffer = fs.readFileSync('pcb/drybox_motherboard_gerber.zip');
const zipBase64 = zipBuffer.toString('base64');

console.log('ZIP loaded, base64 length:', zipBase64.length);

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Placa Mãe / Carrier Shield PCB - Drybox 60L Pro</title>
  <style>
    :root {
      --bg-dark: #070b14;
      --bg-card: #0d1527;
      --bg-surface: #131f38;
      --border-color: #1e293b;
      --border-focus: #38bdf8;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --copper-top: #ef4444;
      --copper-bottom: #3b82f6;
      --copper-pad: #f59e0b;
      --silk-white: #ffffff;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 24px;
      background: var(--bg-dark);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.5;
    }

    header {
      width: 100%;
      max-width: 1400px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .badge-bar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    .pill-green {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border-color: rgba(34, 197, 94, 0.3);
    }

    .pill-gold {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border-color: rgba(245, 158, 11, 0.3);
    }

    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }

    header p {
      color: var(--text-muted);
      font-size: 1.05rem;
      margin: 0;
      max-width: 1100px;
    }

    /* BANNER DE AÇÃO PRINCIPAL */
    .action-banner {
      width: 100%;
      max-width: 1400px;
      background: linear-gradient(135deg, #0c2340 0%, #1e1b4b 100%);
      border: 1px solid #38bdf8;
      border-radius: 14px;
      padding: 20px 26px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      box-shadow: 0 10px 30px rgba(56, 189, 248, 0.15);
    }

    .action-text h2 {
      margin: 0 0 6px 0;
      font-size: 1.3rem;
      color: #fff;
    }

    .action-text p {
      margin: 0;
      color: #bae6fd;
      font-size: 0.95rem;
    }

    .btn-download {
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
      color: #fff;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 6px 16px rgba(2, 132, 199, 0.4);
    }

    .btn-download:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 22px rgba(2, 132, 199, 0.6);
      background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
    }

    /* PAINEL DO VISUALIZADOR DA PCB */
    .viewer-layout {
      width: 100%;
      max-width: 1400px;
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 24px;
      margin-bottom: 35px;
    }

    @media (max-width: 1050px) {
      .viewer-layout { grid-template-columns: 1fr; }
    }

    .pcb-card {
      background: #090e1a;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.7);
    }

    .pcb-toolbar {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .toolbar-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .layer-toggles {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .toggle-chip {
      background: #1e293b;
      border: 1px solid #334155;
      color: #94a3b8;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      user-select: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .toggle-chip.active {
      color: #fff;
      border-color: #38bdf8;
      background: #0369a1;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot-top { background: var(--copper-top); }
    .dot-bottom { background: var(--copper-bottom); }
    .dot-silk { background: #fff; }
    .dot-pad { background: var(--copper-pad); }

    /* SVG DA PLACA (ESCALA REAL 100x100mm) */
    .pcb-frame {
      width: 100%;
      max-width: 720px;
      aspect-ratio: 1/1;
      background: #000;
      border-radius: 12px;
      padding: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: inset 0 0 40px rgba(0,0,0,0.9);
      border: 1px solid #334155;
    }

    svg.pcb-render {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 15px 30px rgba(0,0,0,0.8));
    }

    /* PAINEL LATERAL DE INSPEÇÃO DE COMPONENTES */
    .sidebar-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .panel-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .panel-card h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #38bdf8;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .comp-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 9px 12px;
      background: var(--bg-surface);
      border-radius: 8px;
      border: 1px solid #1e293b;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .comp-item:hover {
      border-color: #38bdf8;
      background: #1e293b;
    }

    .comp-tag {
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 0.8rem;
      background: #0284c7;
      color: #fff;
    }

    .comp-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .comp-title {
      font-weight: 700;
      font-size: 0.92rem;
      color: #f1f5f9;
    }

    .comp-desc {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    /* TABELA DE CONFIGURAÇÃO PCBWAY */
    .specs-card {
      width: 100%;
      max-width: 1400px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 26px;
      margin-bottom: 30px;
    }

    .specs-card h3 {
      margin-top: 0;
      font-size: 1.3rem;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 0.92rem;
    }

    th {
      background: #1e293b;
      color: #38bdf8;
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      border-bottom: 1px solid #334155;
    }

    td {
      padding: 11px 16px;
      border-bottom: 1px solid #1e293b;
      color: #cbd5e1;
    }

    tr:hover td {
      background: rgba(56, 189, 248, 0.04);
    }

    .tag-val {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-family: monospace;
      font-size: 0.88rem;
      background: #0f172a;
      border: 1px solid #334155;
      color: #4ade80;
    }

    footer {
      width: 100%;
      max-width: 1400px;
      text-align: center;
      padding: 24px 0;
      color: #64748b;
      font-size: 0.85rem;
      border-top: 1px solid #1e293b;
      margin-top: 30px;
    }
  </style>
</head>
<body>

  <header>
    <div class="badge-bar">
      <span class="pill pill-green">✓ Fabricação Pronta PCBWay / JLCPCB</span>
      <span class="pill">Dimensões: 100.0 x 100.0 mm</span>
      <span class="pill pill-gold">2 Camadas (FR4 1.6mm • 1oz Cu)</span>
      <span class="pill">Furação M3 nos 4 Cantos</span>
    </div>
    <h1>Placa Mãe / Carrier Shield PCB • Drybox 60L Pro</h1>
    <p>Placa de circuito impresso unificada projetada para eliminar 100% da fiação solta do sistema. Todos os locais de componentes possuem serigrafia clara e explícita indicando onde soldar cada peça, pinagens e polaridades.</p>
  </header>

  <!-- BANNER DE DOWNLOAD DIRETO DO ZIP GERBER -->
  <div class="action-banner">
    <div class="action-text">
      <h2>📦 Pacote Oficial Gerber RS-274X Pronto</h2>
      <p>Arquivo ZIP padronizado contendo Cobre (Top/Bottom), Máscara de Solda, Serigrafia com todas as marcações escritas, Contorno e Furação Excellon (.drl).</p>
    </div>
    <a id="downloadBtn" class="btn-download" href="data:application/zip;base64,${zipBase64}" download="drybox_motherboard_gerber.zip">
      <span>⬇️ Baixar Arquivo Gerber (.ZIP)</span>
    </a>
  </div>

  <!-- VISUALIZADOR DA PCB -->
  <div class="viewer-layout">
    <div class="pcb-card">
      <div class="pcb-toolbar">
        <div class="toolbar-title">
          <span>🔬 <strong>Visualizador Interativo com Serigrafia Escrita</strong></span>
        </div>
        <div class="layer-toggles">
          <div class="toggle-chip active" onclick="toggleLayer('layer-top', this)">
            <span class="dot dot-top"></span> Top Copper (F.Cu)
          </div>
          <div class="toggle-chip active" onclick="toggleLayer('layer-bottom', this)">
            <span class="dot dot-bottom"></span> Bottom Copper (B.Cu)
          </div>
          <div class="toggle-chip active" onclick="toggleLayer('layer-pads', this)">
            <span class="dot dot-pad"></span> Ilhoses / Pads (PTH)
          </div>
          <div class="toggle-chip active" onclick="toggleLayer('layer-silk', this)">
            <span class="dot dot-silk"></span> Serigrafia Escrita (F.SilkS)
          </div>
        </div>
      </div>

      <div class="pcb-frame">
        <svg class="pcb-render" viewBox="-2 -2 104 104" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="pcbShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.8"/>
            </filter>
            <!-- Gradiente da máscara de solda da PCB (Preto Fosco Industrial / Matte Black) -->
            <radialGradient id="pcbSubstrate" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stop-color="#141c2e"/>
              <stop offset="100%" stop-color="#090f1a"/>
            </radialGradient>
          </defs>

          <!-- 1. SUBSTRATO FR4 DA PLACA (100x100mm com cantos arredondados R=2.5mm) -->
          <rect x="0" y="0" width="100" height="100" rx="2.5" fill="url(#pcbSubstrate)" stroke="#38bdf8" stroke-width="0.3" filter="url(#pcbShadow)"/>

          <!-- 2. CAMADA BOTTOM COPPER (B.Cu - Azul Translúcido) -->
          <g id="layer-bottom" opacity="0.55">
            <line x1="15" y1="90" x2="30" y2="90" stroke="#3b82f6" stroke-width="3.0" stroke-linecap="round"/>
            <line x1="37.5" y1="90" x2="52" y2="68" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="52" y1="68" x2="52" y2="44" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="52" y1="68" x2="90" y2="72" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="62.16" y1="68" x2="90" y2="51.92" stroke="#3b82f6" stroke-width="3.0" stroke-linecap="round"/>
            <line x1="37.4" y1="72.92" x2="72.62" y2="8" stroke="#60a5fa" stroke-width="0.5"/>
            <line x1="37.4" y1="70.38" x2="70.08" y2="8" stroke="#93c5fd" stroke-width="0.5"/>
          </g>

          <!-- 3. CAMADA TOP COPPER (F.Cu - Vermelho / Cobre Brilhante) -->
          <g id="layer-top" opacity="0.85">
            <line x1="15" y1="90" x2="30" y2="90" stroke="#ef4444" stroke-width="3.0" stroke-linecap="round"/>
            <line x1="37.5" y1="90" x2="50" y2="95" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="37.5" y1="90" x2="52" y2="68" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="52" y1="68" x2="52" y2="44" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="52" y1="68" x2="90" y2="72" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="90" y1="72" x2="90" y2="42" stroke="#ef4444" stroke-width="2.0" stroke-linecap="round"/>
            <line x1="90" y1="42" x2="90" y2="27" stroke="#ef4444" stroke-width="2.0" stroke-linecap="round"/>
            <line x1="90" y1="66.92" x2="90" y2="57.0" stroke="#ef4444" stroke-width="3.0" stroke-linecap="round"/>
            <line x1="62.16" y1="68" x2="90" y2="51.92" stroke="#f97316" stroke-width="3.0" stroke-linecap="round"/>
            <line x1="62.16" y1="44" x2="90" y2="21.92" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="88" y1="95" x2="40" y2="95" stroke="#ec4899" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="40" y1="95" x2="37.4" y2="78" stroke="#ec4899" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="37.4" y1="44.98" x2="42" y2="44.98" stroke="#a855f7" stroke-width="1.0"/>
            <line x1="42" y1="44.98" x2="42" y2="15" stroke="#a855f7" stroke-width="1.0"/>
            <line x1="42" y1="15" x2="37.78" y2="8" stroke="#a855f7" stroke-width="1.0"/>
            <line x1="42" y1="15" x2="80" y2="8" stroke="#a855f7" stroke-width="0.8"/>
            <line x1="37.4" y1="67.84" x2="52" y2="58" stroke="#22c55e" stroke-width="0.6"/>
            <line x1="37.4" y1="65.3" x2="52" y2="34" stroke="#4ade80" stroke-width="0.6"/>
          </g>

          <!-- 4. PADS E ILHOSES PTH (Ouro / Prata ENIG) -->
          <g id="layer-pads">
            <!-- 4 Furos M3 -->
            <circle cx="5" cy="5" r="3.0" fill="#f59e0b" stroke="#fff" stroke-width="0.2"/>
            <circle cx="5" cy="5" r="1.6" fill="#000"/>
            <circle cx="95" cy="5" r="3.0" fill="#f59e0b" stroke="#fff" stroke-width="0.2"/>
            <circle cx="95" cy="5" r="1.6" fill="#000"/>
            <circle cx="5" cy="95" r="3.0" fill="#f59e0b" stroke="#fff" stroke-width="0.2"/>
            <circle cx="5" cy="95" r="1.6" fill="#000"/>
            <circle cx="95" cy="95" r="3.0" fill="#f59e0b" stroke="#fff" stroke-width="0.2"/>
            <circle cx="95" cy="95" r="1.6" fill="#000"/>

            <!-- J1 Entrada 24V -->
            <rect x="13.7" y="88.7" width="2.6" height="2.6" fill="#f59e0b" rx="0.3"/>
            <circle cx="15.0" cy="90.0" r="0.65" fill="#000"/>
            <circle cx="20.08" cy="90.0" r="1.3" fill="#f59e0b"/>
            <circle cx="20.08" cy="90.0" r="0.65" fill="#000"/>

            <!-- F1 Fusível 10A -->
            <rect x="28.6" y="88.6" width="2.8" height="2.8" fill="#f59e0b" rx="0.3"/>
            <circle cx="30.0" cy="90.0" r="0.65" fill="#000"/>
            <circle cx="37.5" cy="90.0" r="1.4" fill="#f59e0b"/>
            <circle cx="37.5" cy="90.0" r="0.65" fill="#000"/>

            <!-- Step-Down LM2596 (4 pads) -->
            <rect x="48.8" y="93.8" width="2.4" height="2.4" fill="#f59e0b"/>
            <circle cx="50" cy="95" r="0.6" fill="#000"/>
            <circle cx="50" cy="80" r="1.2" fill="#f59e0b"/>
            <circle cx="50" cy="80" r="0.6" fill="#000"/>
            <rect x="86.8" y="93.8" width="2.4" height="2.4" fill="#f59e0b"/>
            <circle cx="88" cy="95" r="0.6" fill="#000"/>
            <circle cx="88" cy="80" r="1.2" fill="#f59e0b"/>
            <circle cx="88" cy="80" r="0.6" fill="#000"/>

            <!-- ESP32-S3 (44 pads) -->
            <g>
              ${Array.from({length: 22}).map((_, i) => {
                const y = 78.0 - (i * 2.54);
                return i === 0 
                  ? `<rect x="11.1" y="${(y - 0.9).toFixed(2)}" width="1.8" height="1.8" fill="#f59e0b"/><circle cx="12.0" cy="${y.toFixed(2)}" r="0.45" fill="#000"/>`
                  : `<circle cx="12.0" cy="${y.toFixed(2)}" r="0.9" fill="#f59e0b"/><circle cx="12.0" cy="${y.toFixed(2)}" r="0.45" fill="#000"/>`;
              }).join('\n')}
            </g>
            <g>
              ${Array.from({length: 22}).map((_, i) => {
                const y = 78.0 - (i * 2.54);
                return i === 0 
                  ? `<rect x="36.5" y="${(y - 0.9).toFixed(2)}" width="1.8" height="1.8" fill="#f59e0b"/><circle cx="37.4" cy="${y.toFixed(2)}" r="0.45" fill="#000"/>`
                  : `<circle cx="37.4" cy="${y.toFixed(2)}" r="0.9" fill="#f59e0b"/><circle cx="37.4" cy="${y.toFixed(2)}" r="0.45" fill="#000"/>`;
              }).join('\n')}
            </g>

            <!-- MOSFET 1 Pads -->
            <rect x="50.8" y="66.8" width="2.4" height="2.4" fill="#f59e0b"/>
            <circle cx="52" cy="68" r="0.65" fill="#000"/>
            <circle cx="57.08" cy="68" r="1.2" fill="#f59e0b"/>
            <circle cx="57.08" cy="68" r="0.65" fill="#000"/>
            <circle cx="62.16" cy="68" r="1.2" fill="#f59e0b"/>
            <circle cx="62.16" cy="68" r="0.65" fill="#000"/>
            <rect x="51.1" y="57.1" width="1.8" height="1.8" fill="#f59e0b"/>
            <circle cx="52" cy="58" r="0.45" fill="#000"/>
            <circle cx="54.54" cy="58" r="0.9" fill="#f59e0b"/>
            <circle cx="54.54" cy="58" r="0.45" fill="#000"/>

            <!-- MOSFET 2 Pads -->
            <rect x="50.8" y="42.8" width="2.4" height="2.4" fill="#f59e0b"/>
            <circle cx="52" cy="44" r="0.65" fill="#000"/>
            <circle cx="57.08" cy="44" r="1.2" fill="#f59e0b"/>
            <circle cx="57.08" cy="44" r="0.65" fill="#000"/>
            <circle cx="62.16" cy="44" r="1.2" fill="#f59e0b"/>
            <circle cx="62.16" cy="44" r="0.65" fill="#000"/>
            <rect x="51.1" y="33.1" width="1.8" height="1.8" fill="#f59e0b"/>
            <circle cx="52" cy="34" r="0.45" fill="#000"/>
            <circle cx="54.54" cy="34" r="0.9" fill="#f59e0b"/>
            <circle cx="54.54" cy="34" r="0.45" fill="#000"/>

            <!-- Bornes Direita J3, J2, J4, J5 -->
            <g>
              ${[72.0, 66.92, 57.0, 51.92, 42.0, 36.92, 27.0, 21.92].map((y, idx) => {
                return idx % 2 === 0
                  ? `<rect x="88.75" y="${(y - 1.25).toFixed(2)}" width="2.5" height="2.5" fill="#f59e0b"/><circle cx="90" cy="${y.toFixed(2)}" r="0.65" fill="#000"/>`
                  : `<circle cx="90" cy="${y.toFixed(2)}" r="1.25" fill="#f59e0b"/><circle cx="90" cy="${y.toFixed(2)}" r="0.65" fill="#000"/>`;
              }).join('\n')}
            </g>

            <!-- Display TFT 14 pinos -->
            <g>
              ${Array.from({length: 14}).map((_, i) => {
                const x = 20.0 + (i * 2.54);
                return i === 0
                  ? `<rect x="${(x - 0.9).toFixed(2)}" y="7.1" width="1.8" height="1.8" fill="#f59e0b"/><circle cx="${x.toFixed(2)}" cy="8" r="0.45" fill="#000"/>`
                  : `<circle cx="${x.toFixed(2)}" cy="8" r="0.9" fill="#f59e0b"/><circle cx="${x.toFixed(2)}" cy="8" r="0.45" fill="#000"/>`;
              }).join('\n')}
            </g>

            <!-- Sensores SHT31 J7 e J8 -->
            <g>
              ${Array.from({length: 4}).map((_, i) => {
                const x = 65.0 + (i * 2.54);
                return i === 0
                  ? `<rect x="${(x - 0.9).toFixed(2)}" y="7.1" width="1.8" height="1.8" fill="#f59e0b"/><circle cx="${x.toFixed(2)}" cy="8" r="0.45" fill="#000"/>`
                  : `<circle cx="${x.toFixed(2)}" cy="8" r="0.9" fill="#f59e0b"/><circle cx="${x.toFixed(2)}" cy="8" r="0.45" fill="#000"/>`;
              }).join('\n')}
              ${Array.from({length: 4}).map((_, i) => {
                const x = 80.0 + (i * 2.54);
                return i === 0
                  ? `<rect x="${(x - 0.9).toFixed(2)}" y="7.1" width="1.8" height="1.8" fill="#f59e0b"/><circle cx="${x.toFixed(2)}" cy="8" r="0.45" fill="#000"/>`
                  : `<circle cx="${x.toFixed(2)}" cy="8" r="0.9" fill="#f59e0b"/><circle cx="${x.toFixed(2)}" cy="8" r="0.45" fill="#000"/>`;
              }).join('\n')}
            </g>
          </g>

          <!-- 5. CAMADA SERIGRAFIA ESCRITA (F.SilkS - 100% VISÍVEL E BOLD) -->
          <g id="layer-silk" stroke="#ffffff" stroke-width="0.2" fill="none">
            <!-- Contornos dos Módulos -->
            <rect x="12" y="85" width="11" height="10" rx="0.5"/>
            <rect x="27" y="85" width="13.5" height="10" rx="0.5"/>
            <rect x="48" y="77" width="42" height="20" rx="0.8"/>
            <rect x="10" y="22" width="29.4" height="59.5" rx="0.8"/>
            <rect x="49" y="55" width="21" height="18" rx="0.5"/>
            <rect x="49" y="31" width="21" height="18" rx="0.5"/>
            <rect x="86" y="64" width="10" height="11" rx="0.5"/>
            <rect x="86" y="49" width="10" height="11" rx="0.5"/>
            <rect x="86" y="34" width="10" height="11" rx="0.5"/>
            <rect x="86" y="19" width="10" height="11" rx="0.5"/>
            <rect x="18" y="5" width="37" height="6" rx="0.5"/>
            <rect x="63" y="5" width="11.5" height="6" rx="0.5"/>
            <rect x="78" y="5" width="11.5" height="6" rx="0.5"/>

            <!-- TEXTOS E NOMES CLAROS DOS COMPONENTES -->
            <text x="50" y="98.5" fill="#ffffff" stroke="none" font-size="1.4" font-weight="bold" text-anchor="middle">DRYBOX 60L PRO • MOTHERBOARD CARRIER SHIELD v1.1</text>
            <text x="50" y="1.2" fill="#94a3b8" stroke="none" font-size="1.0" text-anchor="middle">PCBWAY / JLCPCB • 100x100mm 2-LAYER FR4 1.6mm</text>
            
            <!-- ENTRADA 24V E FUSÍVEL -->
            <text x="17.5" y="96.2" fill="#38bdf8" stroke="none" font-size="1.0" font-weight="bold" text-anchor="middle">J1: ENTRADA 24V</text>
            <text x="15.0" y="86.5" fill="#fca5a5" stroke="none" font-size="0.9" font-weight="bold" text-anchor="middle">+24V</text>
            <text x="20.08" y="86.5" fill="#bae6fd" stroke="none" font-size="0.9" font-weight="bold" text-anchor="middle">GND</text>

            <text x="33.7" y="96.2" fill="#ef4444" stroke="none" font-size="1.0" font-weight="bold" text-anchor="middle">F1: FUSÍVEL 10A</text>
            <text x="33.7" y="86.5" fill="#ffffff" stroke="none" font-size="0.8" text-anchor="middle">LÂMINA</text>

            <!-- STEP-DOWN LM2596 -->
            <text x="69" y="90" fill="#38bdf8" stroke="none" font-size="1.3" font-weight="bold" text-anchor="middle">STEP-DOWN LM2596 (5.00V)</text>
            <text x="69" y="86" fill="#fde047" stroke="none" font-size="0.8" font-weight="bold" text-anchor="middle">CALIBRAR EM 5.00V ANTES DE PLUGAR ESP32!</text>
            <text x="53.5" y="94.5" fill="#fca5a5" stroke="none" font-size="0.8" font-weight="bold">IN+</text>
            <text x="53.5" y="81.5" fill="#bae6fd" stroke="none" font-size="0.8" font-weight="bold">IN-</text>
            <text x="78.0" y="94.5" fill="#f472b6" stroke="none" font-size="0.8" font-weight="bold">OUT+ (5V)</text>
            <text x="78.0" y="81.5" fill="#bae6fd" stroke="none" font-size="0.8" font-weight="bold">OUT- (GND)</text>
            
            <!-- ESP32-S3 DEVKITC-1 -->
            <text x="24.7" y="58" fill="#38bdf8" stroke="none" font-size="1.6" font-weight="bold" text-anchor="middle">ESP32-S3 DEVKITC-1</text>
            <text x="24.7" y="54" fill="#ffffff" stroke="none" font-size="1.1" font-weight="bold" text-anchor="middle">N16R8 (16MB / 8MB)</text>
            <text x="24.7" y="49" fill="#cbd5e1" stroke="none" font-size="0.8" text-anchor="middle">SOLDAR 2x BARRAS FÊMEA 22 PINOS</text>
            <text x="24.7" y="45.5" fill="#cbd5e1" stroke="none" font-size="0.75" text-anchor="middle">LADO DIREITO: CONTROLE E DADOS</text>

            <!-- PINOS INDIVIDUAIS DO ESP32-S3 -->
            <text x="14.5" y="78.2" fill="#c084fc" stroke="none" font-size="0.75" font-weight="bold">3V3</text>
            <text x="14.5" y="75.6" fill="#94a3b8" stroke="none" font-size="0.75">EN</text>
            <text x="14.5" y="47.2" fill="#38bdf8" stroke="none" font-size="0.75">GND</text>

            <text x="34.0" y="78.2" fill="#ec4899" stroke="none" font-size="0.75" font-weight="bold">5V</text>
            <text x="33.0" y="75.6" fill="#38bdf8" stroke="none" font-size="0.75" font-weight="bold">GND</text>
            <text x="29.0" y="73.1" fill="#eab308" stroke="none" font-size="0.75">4(SDA)</text>
            <text x="29.0" y="70.5" fill="#f59e0b" stroke="none" font-size="0.75">5(SCL)</text>
            <text x="29.0" y="68.0" fill="#22c55e" stroke="none" font-size="0.75" font-weight="bold">6(PTC)</text>
            <text x="27.0" y="65.5" fill="#4ade80" stroke="none" font-size="0.75" font-weight="bold">7(PURGA)</text>
            <text x="28.5" y="62.9" fill="#38bdf8" stroke="none" font-size="0.75">8(T_CS)</text>
            <text x="31.0" y="60.4" fill="#38bdf8" stroke="none" font-size="0.75">9(DC)</text>
            <text x="30.0" y="57.8" fill="#38bdf8" stroke="none" font-size="0.75">10(CS)</text>
            <text x="27.5" y="55.3" fill="#c084fc" stroke="none" font-size="0.75">11(MOSI)</text>
            <text x="28.5" y="52.8" fill="#c084fc" stroke="none" font-size="0.75">12(SCK)</text>
            <text x="27.5" y="50.2" fill="#c084fc" stroke="none" font-size="0.75">13(MISO)</text>
            <text x="28.5" y="47.7" fill="#38bdf8" stroke="none" font-size="0.75">14(RST)</text>
            <text x="30.0" y="45.1" fill="#c084fc" stroke="none" font-size="0.75" font-weight="bold">3.3V</text>

            <text x="24.7" y="24" fill="#f87171" stroke="none" font-size="0.7" font-weight="bold" text-anchor="middle">⚠️ BORNES 35, 36, 37 PROIBIDOS (PSRAM)</text>

            <!-- MOSFETS 1 E 2 -->
            <text x="59.5" y="72" fill="#f87171" stroke="none" font-size="1.1" font-weight="bold" text-anchor="middle">MOSFET 1: AQUECEDOR PTC</text>
            <text x="59.5" y="64.5" fill="#ffffff" stroke="none" font-size="0.85" text-anchor="middle">V+   V-   OUT</text>
            <text x="54.0" y="60" fill="#22c55e" stroke="none" font-size="0.8" font-weight="bold">PWM  G</text>
            <text x="59.5" y="56.5" fill="#94a3b8" stroke="none" font-size="0.7" text-anchor="middle">MODULO HW-532 (LR7843)</text>

            <text x="59.5" y="48" fill="#38bdf8" stroke="none" font-size="1.1" font-weight="bold" text-anchor="middle">MOSFET 2: PURGA 24V</text>
            <text x="59.5" y="40.5" fill="#ffffff" stroke="none" font-size="0.85" text-anchor="middle">V+   V-   OUT</text>
            <text x="54.0" y="36" fill="#4ade80" stroke="none" font-size="0.8" font-weight="bold">PWM  G</text>
            <text x="59.5" y="32.5" fill="#94a3b8" stroke="none" font-size="0.7" text-anchor="middle">MODULO HW-532 (LR7843)</text>

            <!-- BORNES DE SAÍDA (BORDA DIREITA) -->
            <text x="73" y="70" fill="#ffffff" stroke="none" font-size="0.9" font-weight="bold" text-anchor="middle">J3: TF 75°C</text>
            <text x="86.0" y="73" fill="#fca5a5" stroke="none" font-size="0.8">(+)</text>
            <text x="86.0" y="66" fill="#fca5a5" stroke="none" font-size="0.8">RET</text>

            <text x="73" y="55" fill="#f87171" stroke="none" font-size="0.9" font-weight="bold" text-anchor="middle">J2: PTC 150W</text>
            <text x="86.0" y="58" fill="#fca5a5" stroke="none" font-size="0.8">(+)</text>
            <text x="86.0" y="51" fill="#fcd34d" stroke="none" font-size="0.8">(-)</text>

            <text x="73.5" y="40" fill="#38bdf8" stroke="none" font-size="0.9" font-weight="bold" text-anchor="middle">J4: FAN PTC</text>
            <text x="86.0" y="43" fill="#fca5a5" stroke="none" font-size="0.8">(+)</text>
            <text x="86.0" y="36" fill="#bae6fd" stroke="none" font-size="0.8">(-)</text>

            <text x="73.5" y="25" fill="#38bdf8" stroke="none" font-size="0.9" font-weight="bold" text-anchor="middle">J5: PURGA 24V</text>
            <text x="86.0" y="28" fill="#fca5a5" stroke="none" font-size="0.8">(+)</text>
            <text x="86.0" y="21" fill="#fcd34d" stroke="none" font-size="0.8">(-)</text>

            <!-- DISPLAY TFT E SENSORES -->
            <text x="36.5" y="14.8" fill="#38bdf8" stroke="none" font-size="0.95" font-weight="bold" text-anchor="middle">J6: DISPLAY TFT 2.4" SPI + TOUCH RESISTIVO</text>
            <text x="36.5" y="12.0" fill="#cbd5e1" stroke="none" font-size="0.75" text-anchor="middle">1:5V  2:GND  3:CS  4:RST  5:DC  6:MOSI  7:SCK</text>
            <text x="36.5" y="2.5" fill="#f43f5e" stroke="none" font-size="0.75" font-weight="bold" text-anchor="middle">8:LED (3.3V OBRIGATÓRIO! ⚠️)  9:MISO  10:CLK  11:T_CS  12:DIN  13:DO  14:NC</text>

            <text x="69" y="14.5" fill="#facc15" stroke="none" font-size="0.85" font-weight="bold" text-anchor="middle">J7: SHT31 #1</text>
            <text x="69" y="12.0" fill="#94a3b8" stroke="none" font-size="0.75" text-anchor="middle">INTERNO 0x44</text>
            <text x="69" y="2.5" fill="#ffffff" stroke="none" font-size="0.7" text-anchor="middle">3V3 G SCL SDA</text>

            <text x="84" y="14.5" fill="#facc15" stroke="none" font-size="0.85" font-weight="bold" text-anchor="middle">J8: SHT31 #2</text>
            <text x="84" y="12.0" fill="#94a3b8" stroke="none" font-size="0.75" text-anchor="middle">EXTERNO 0x45</text>
            <text x="84" y="2.5" fill="#ffffff" stroke="none" font-size="0.7" text-anchor="middle">3V3 G SCL SDA</text>
          </g>
        </svg>
      </div>
    </div>

    <!-- PAINEL LATERAL DE DETALHES -->
    <div class="sidebar-panel">
      <div class="panel-card">
        <h3>📋 Módulos e Componentes a Soldar</h3>
        
        <div class="comp-item">
          <span class="comp-tag">U1</span>
          <div class="comp-info">
            <span class="comp-title">ESP32-S3 DevKitC-1 N16R8</span>
            <span class="comp-desc">Soldar 2x barras fêmea 22 pinos (passo 2.54mm, largura 25.4mm)</span>
          </div>
        </div>

        <div class="comp-item">
          <span class="comp-tag">U2</span>
          <div class="comp-info">
            <span class="comp-title">Step-Down LM2596 (5.00V)</span>
            <span class="comp-desc">Pinos nos 4 cantos do módulo: IN+, IN-, OUT+, OUT-</span>
          </div>
        </div>

        <div class="comp-item">
          <span class="comp-tag">M1-2</span>
          <div class="comp-info">
            <span class="comp-title">2x Módulos MOSFET HW-532</span>
            <span class="comp-desc">Soldar barras nos pads V+, V-, OUT (5.08mm) e PWM, GND (2.54mm)</span>
          </div>
        </div>

        <div class="comp-item">
          <span class="comp-tag">F1</span>
          <div class="comp-info">
            <span class="comp-title">Fusível Automotivo 10A</span>
            <span class="comp-desc">Soquete para fusível lâmina automotivo médio/mini</span>
          </div>
        </div>

        <div class="comp-item">
          <span class="comp-tag">J1-5</span>
          <div class="comp-info">
            <span class="comp-title">5x Bornes KF301 de Parafuso</span>
            <span class="comp-desc">Entrada 24V, PTC 150W, TF 75°C, Fan PTC e Purga 24V</span>
          </div>
        </div>

        <div class="comp-item">
          <span class="comp-tag">J6-8</span>
          <div class="comp-info">
            <span class="comp-title">Conectores Display e Sensores</span>
            <span class="comp-desc">1x Barra 14 pinos (Display) e 2x conectores 4 pinos (SHT31)</span>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <h3>⚡ Segurança e Alta Corrente</h3>
        <p style="font-size:0.85rem; color:#cbd5e1; margin:0;">
          • As trilhas de 24V possuem <strong>3,0 mm de largura em ambas as camadas</strong> (Top e Bottom em paralelo), suportando até 10A contínuos.
        </p>
        <p style="font-size:0.85rem; color:#cbd5e1; margin:0;">
          • Todas as marcações de pinagens e componentes estão impressas na serigrafia branca física para guiar a soldagem sem dúvidas!
        </p>
      </div>
    </div>
  </div>

  <!-- TABELA DE ESPECIFICAÇÕES PARA PEDIDO NA PCBWAY -->
  <div class="specs-card">
    <h3>⚙️ Parâmetros Exatos para Preenchimento no Pedido da PCBWay / JLCPCB</h3>
    <p style="color:var(--text-muted); margin:0 0 10px 0;">Basta subir o arquivo <code>drybox_motherboard_gerber.zip</code> na página de orçamento rápido (Instant Quote) e selecionar os seguintes campos:</p>
    
    <table>
      <thead>
        <tr>
          <th>Parâmetro no Formulário</th>
          <th>Opção a Selecionar</th>
          <th>Observação Técnica</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Dimensions (Dimensões)</strong></td>
          <td><span class="tag-val">100 mm x 100 mm</span></td>
          <td>Tamanho padrão promocional ($5 por 5 placas na PCBWay / $2 na JLCPCB)</td>
        </tr>
        <tr>
          <td><strong>Layer Count (Camadas)</strong></td>
          <td><span class="tag-val">2 Layers</span></td>
          <td>Cobre Superior (Top) e Cobre Inferior (Bottom)</td>
        </tr>
        <tr>
          <td><strong>Material Type</strong></td>
          <td><span class="tag-val">FR-4 Standard (Tg 130-140°C)</span></td>
          <td>Fibra de vidro padrão industrial de alta durabilidade</td>
        </tr>
        <tr>
          <td><strong>PCB Thickness (Espessura)</strong></td>
          <td><span class="tag-val">1.6 mm</span></td>
          <td>Espessura padrão rígida para placas de potência e bornes</td>
        </tr>
        <tr>
          <td><strong>Copper Weight (Peso de Cobre)</strong></td>
          <td><span class="tag-val">1 oz (35 µm)</span></td>
          <td>Suficiente graças às trilhas duplas de 3.0mm Top/Bottom</td>
        </tr>
        <tr>
          <td><strong>Solder Mask Color (Cor da Placa)</strong></td>
          <td><span class="tag-val">Matte Black / Blue / Green</span></td>
          <td>Sua escolha de cor (Preto fosco ou Azul dão visual premium)</td>
        </tr>
        <tr>
          <td><strong>Silkscreen Color (Cor do Texto)</strong></td>
          <td><span class="tag-val">White (Branco)</span></td>
          <td>Máxima legibilidade para todas as etiquetas e pinagens</td>
        </tr>
        <tr>
          <td><strong>Surface Finish (Acabamento)</strong></td>
          <td><span class="tag-val">HASL with lead ou Lead-Free</span></td>
          <td>Banho de estanho padrão com excelente facilidade de solda manual</td>
        </tr>
      </tbody>
    </table>
  </div>

  <footer>
    Drybox 60L Pro • Placa de Circuito Impresso Carrier Shield v1.1 • Desenvolvido para fabricação industrial em PCBWay / JLCPCB
  </footer>

  <script>
    function toggleLayer(layerId, element) {
      const g = document.getElementById(layerId);
      if (!g) return;
      if (g.style.display === 'none') {
        g.style.display = 'inline';
        element.classList.add('active');
      } else {
        g.style.display = 'none';
        element.classList.remove('active');
      }
    }
  </script>
</body>
</html>
`;

fs.writeFileSync('placa_circuito_impresso.html', html, 'utf8');
console.log('placa_circuito_impresso.html updated successfully with detailed silkscreen!');
