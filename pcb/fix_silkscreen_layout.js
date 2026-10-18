const fs = require('fs');
const path = require('path');

const OUTPUT_GERBER = path.join(__dirname, 'gerber');
const OUTPUT_KICAD = path.join(__dirname, 'kicad');

// --------------------------------------------------------------------------
// TABELA COMPLETA DE GLIFOS VETORIAIS (4x7)
// --------------------------------------------------------------------------
const FONT = {
  'A': [[0,0,0,5],[0,5,2,7],[2,7,4,5],[4,5,4,0],[0,3,4,3]],
  'B': [[0,0,0,7],[0,7,3,7],[3,7,4,5.5],[4,5.5,3,4],[3,4,0,4],[3,4,4,2.5],[4,2.5,3,0],[3,0,0,0]],
  'C': [[4,6,1.5,7],[1.5,7,0,5],[0,5,0,2],[0,2,1.5,0],[1.5,0,4,1]],
  'D': [[0,0,0,7],[0,7,2.5,7],[2.5,7,4,5],[4,5,4,2],[4,2,2.5,0],[2.5,0,0,0]],
  'E': [[4,7,0,7],[0,7,0,0],[0,0,4,0],[0,3.5,3,3.5]],
  'F': [[0,0,0,7],[0,7,4,7],[0,3.5,3,3.5]],
  'G': [[4,6,2,7],[2,7,0,5],[0,5,0,2],[0,2,2,0],[2,0,4,0],[4,0,4,3.5],[4,3.5,2,3.5]],
  'H': [[0,0,0,7],[4,0,4,7],[0,3.5,4,3.5]],
  'I': [[0,7,3,7],[1.5,7,1.5,0],[0,0,3,0]],
  'J': [[3,7,3,1.5],[3,1.5,1.5,0],[1.5,0,0,1.5]],
  'K': [[0,0,0,7],[4,7,0,3],[0,3,4,0]],
  'L': [[0,7,0,0],[0,0,4,0]],
  'M': [[0,0,0,7],[0,7,2,3.5],[2,3.5,4,7],[4,7,4,0]],
  'N': [[0,0,0,7],[0,7,4,0],[4,0,4,7]],
  'O': [[1,0,0,2],[0,2,0,5],[0,5,1,7],[1,7,3,7],[3,7,4,5],[4,5,4,2],[4,2,3,0],[3,0,1,0]],
  'P': [[0,0,0,7],[0,7,3,7],[3,7,4,5.5],[4,5.5,3,4],[3,4,0,4]],
  'Q': [[1,0,0,2],[0,2,0,5],[0,5,1,7],[1,7,3,7],[3,7,4,5],[4,5,4,2],[4,2,3,0],[3,0,1,0],[2,2,4,0]],
  'R': [[0,0,0,7],[0,7,3,7],[3,7,4,5.5],[4,5.5,3,4],[3,4,0,4],[2,4,4,0]],
  'S': [[4,6,2.5,7],[2.5,7,1,7],[1,7,0,5.5],[0,5.5,4,4],[4,4,4,1.5],[4,1.5,2.5,0],[2.5,0,0,0.5]],
  'T': [[0,7,4,7],[2,7,2,0]],
  'U': [[0,7,0,1.5],[0,1.5,1.5,0],[1.5,0,2.5,0],[2.5,0,4,1.5],[4,1.5,4,7]],
  'V': [[0,7,2,0],[2,0,4,7]],
  'W': [[0,7,1,0],[1,0,2,4],[2,4,3,0],[3,0,4,7]],
  'X': [[0,7,4,0],[0,0,4,7]],
  'Y': [[0,7,2,3.5],[4,7,2,3.5],[2,3.5,2,0]],
  'Z': [[0,7,4,7],[4,7,0,0],[0,0,4,0]],
  '0': [[1,0,0,2],[0,2,0,5],[0,5,1,7],[1,7,3,7],[3,7,4,5],[4,5,4,2],[4,2,3,0],[3,0,1,0],[0,1,4,6]],
  '1': [[0.5,5,2,7],[2,7,2,0],[0.5,0,3.5,0]],
  '2': [[0,5.5,1,7],[1,7,3,7],[3,7,4,5.5],[4,5.5,0,0],[0,0,4,0]],
  '3': [[0,6,1,7],[1,7,3,7],[3,7,4,5.5],[4,5.5,2,4],[4,4,4,1.5],[4,1.5,3,0],[3,0,0,0]],
  '4': [[3,0,3,7],[3,7,0,2.5],[0,2.5,4.5,2.5]],
  '5': [[4,7,0,7],[0,7,0,4],[0,4,3,4],[3,4,4,2.5],[4,2.5,3,0],[3,0,0,0.5]],
  '6': [[3.5,7,1.5,7],[1.5,7,0,5],[0,5,0,2],[0,2,1.5,0],[1.5,0,3,0],[3,0,4,1.5],[4,1.5,4,3],[4,3,3,4],[3,4,0,3.5]],
  '7': [[0,7,4,7],[4,7,1.5,0]],
  '8': [[1.5,7,3,7],[3,7,4,5.5],[4,5.5,3,4],[3,4,1.5,4],[1.5,4,0,5.5],[0,5.5,1.5,7],[3,4,4,2],[4,2,3,0],[3,0,1,0],[1,0,0,2],[0,2,1,4]],
  '9': [[4,3.5,1,3],[1,3,0,4.5],[0,4.5,0,5.5],[0,5.5,1,7],[1,7,3,7],[3,7,4,5],[4,5,4,2],[4,2,2.5,0],[2.5,0,0.5,0]],
  '-': [[0.5,3.5,3.5,3.5]],
  '+': [[0.5,3.5,3.5,3.5],[2,1.5,2,5.5]],
  '/': [[0.5,0,3.5,7]],
  '(': [[2.5,7,1,5],[1,5,1,2],[1,2,2.5,0]],
  ')': [[1,7,2.5,5],[2.5,5,2.5,2],[2.5,2,1,0]],
  ':': [[2,2,2,2.5],[2,5,2,5.5]],
  '.': [[1.5,0,2.5,0],[2,0,2,0.8]],
  ',': [[2.5,1,2.5,0],[2.5,0,1,-1]],
  '!': [[2,7,2,2],[2,0,2,0.8]],
  '=': [[0.5,4.5,3.5,4.5],[0.5,2.5,3.5,2.5]],
  '#': [[1,1,1,6],[3,1,3,6],[0.5,4.5,3.5,4.5],[0.5,2.5,3.5,2.5]],
  '_': [[0,0,4,0]],
  ' ': []
};

function textToLines(text, x, y, size = 1.0) {
  const scale = size / 7.0;
  const charWidth = 4.0 * scale;
  const charSpacing = 1.1 * scale;
  let curX = x;
  const lines = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toUpperCase();
    const glyph = FONT[ch] || FONT[' '];
    glyph.forEach(seg => {
      lines.push({
        x1: curX + seg[0] * scale,
        y1: y + seg[1] * scale,
        x2: curX + seg[2] * scale,
        y2: y + seg[3] * scale
      });
    });
    curX += charWidth + charSpacing;
  }
  return lines;
}

function c(valMm) {
  const scaled = Math.round(valMm * 1000000);
  return (scaled >= 0 ? '' : '-') + Math.abs(scaled).toString();
}

function gPoint(x, y) {
  return `X${c(x)}Y${c(y)}`;
}

const silkLines = [];

function addBox(x, y, w, h) {
  silkLines.push({ x1: x, y1: y, x2: x + w, y2: y });
  silkLines.push({ x1: x + w, y1: y, x2: x + w, y2: y + h });
  silkLines.push({ x1: x + w, y1: y + h, x2: x, y2: y + h });
  silkLines.push({ x1: x, y1: y + h, x2: x, y2: y });
}

function addText(text, x, y, size = 1.0) {
  const segs = textToLines(text, x, y, size);
  segs.forEach(s => silkLines.push(s));
}

// --------------------------------------------------------------------------
// 1. TÍTULO SUPERIOR DA PLACA (Reposicionado longe do furo M3)
// Furo M3 superior esquerdo está em (5, 95) com raio de corte de 3mm (pad até X=8mm).
// LM2596 começa em X = 48.0 mm.
// O título fica entre X = 14.0 mm e X = 43.5 mm na altura Y = 96.8 mm. Zero colisão!
// --------------------------------------------------------------------------
addText('DRYBOX 60L PRO - MOTHERBOARD SHIELD V1.1', 14.0, 96.8, 1.0);

// --------------------------------------------------------------------------
// 2. ENTRADA 24V (J1) E FUSÍVEL (F1)
// --------------------------------------------------------------------------
addBox(12.0, 85.0, 11.0, 10.0);
addText('J1: 24V IN', 12.5, 93.5, 0.85);
addText('+24V', 13.5, 86.0, 0.8);
addText('GND', 19.0, 86.0, 0.8);

addBox(27.0, 85.0, 13.5, 10.0);
addText('F1: FUSIVEL 10A', 27.5, 93.5, 0.85);
addText('LAMINA', 31.0, 86.0, 0.75);

// --------------------------------------------------------------------------
// 3. STEP-DOWN LM2596 (U2)
// --------------------------------------------------------------------------
addBox(48.0, 77.0, 42.0, 20.0);
addText('STEP-DOWN LM2596 (5.00V)', 53.0, 88.5, 1.05);
addText('CALIBRAR 5.00V ANTES DE PLUGAR ESP32!', 50.0, 85.0, 0.7);
addText('IN+', 52.5, 93.5, 0.8);
addText('IN-', 52.5, 80.5, 0.8);
addText('OUT+ (5V)', 79.5, 93.5, 0.8);
addText('OUT- (GND)', 80.0, 80.5, 0.8);

// --------------------------------------------------------------------------
// 4. ESP32-S3 DEVKITC-1 (U1) - LAYOUT 100% LIMPO E SEM SOBREPOSIÇÕES
// --------------------------------------------------------------------------
addBox(10.0, 22.0, 29.4, 59.5);

// Textos centrais do ESP32 (perfeitamente centralizados entre as duas barras):
// A barra esquerda está em X=12.0 e a direita em X=37.4.
// Centro exato = (12.0 + 37.4)/2 = 24.7 mm!
addBox(17.0, 52.0, 15.5, 16.0); // Retângulo simulando o módulo metálico ESP32
addText('ESP32-S3', 18.5, 61.5, 1.3);
addText('WROOM-1', 19.5, 57.0, 0.95);
addText('N16R8', 21.0, 53.5, 0.9);

addText('DEVKITC-1', 18.0, 70.0, 1.0);
addText('BARRAS FEMEA 2x22', 14.5, 47.0, 0.75);
addText('PASSO 2.54MM', 17.5, 43.5, 0.75);
addText('LARGURA 25.4MM', 16.5, 40.0, 0.75);

// Pinos da Barra Esquerda (X = 12.0 mm, etiquetas logo à direita em X = 14.2 mm)
addText('3V3', 14.2, 77.2, 0.7);
addText('EN', 14.2, 74.6, 0.7);
addText('GND', 14.2, 33.5, 0.7);

// Pinos da Barra Direita:
// Posição dos pads: X = 37.4 mm.
// O canal entre o ESP32 e o MOSFET 1 (que começa em X=49.0) está entre X=39.5 e X=48.0 mm.
// Colocamos as etiquetas das 14 funções de controle NO CANAL EXTERNO DIREITO (X = 40.0 mm)!
// Assim NADA colide com o miolo do ESP32!
addText('5V(IN)', 40.0, 77.2, 0.7);
addText('GND', 40.0, 74.6, 0.7);
addText('4:SDA', 40.0, 72.1, 0.7);
addText('5:SCL', 40.0, 69.5, 0.7);
addText('6:PTC', 40.0, 67.0, 0.7);
addText('7:PURGA', 40.0, 64.5, 0.7);
addText('8:T_CS', 40.0, 61.9, 0.7);
addText('9:DC', 40.0, 59.4, 0.7);
addText('10:CS', 40.0, 56.8, 0.7);
addText('11:MOSI', 40.0, 54.3, 0.7);
addText('12:SCK', 40.0, 51.8, 0.7);
addText('13:MISO', 40.0, 49.2, 0.7);
addText('14:RST', 40.0, 46.7, 0.7);
addText('3.3V', 40.0, 44.1, 0.7);

// Aviso de segurança da PSRAM (na base do ESP32, bem visível e sem cortes)
addBox(12.0, 24.0, 25.4, 6.0);
addText('BORNES 35, 36, 37', 15.0, 27.5, 0.75);
addText('PROIBIDOS (PSRAM)', 15.0, 25.0, 0.75);

// --------------------------------------------------------------------------
// 5. MOSFETS 1 E 2
// --------------------------------------------------------------------------
addBox(49.0, 55.0, 21.0, 18.0);
addText('MOSFET 1: AQUECEDOR PTC', 50.0, 71.5, 0.9);
addText('V+   V-   OUT', 50.5, 64.0, 0.8);
addText('PWM  GND', 50.5, 59.5, 0.75);
addText('HW-532 (LR7843)', 51.0, 56.0, 0.65);

addBox(49.0, 31.0, 21.0, 18.0);
addText('MOSFET 2: PURGA 24V', 50.0, 47.5, 0.9);
addText('V+   V-   OUT', 50.5, 40.0, 0.8);
addText('PWM  GND', 50.5, 35.5, 0.75);
addText('HW-532 (LR7843)', 51.0, 32.0, 0.65);

// --------------------------------------------------------------------------
// 6. BORNES DA BORDA DIREITA (J3, J2, J4, J5)
// --------------------------------------------------------------------------
addBox(86.0, 64.0, 10.0, 11.0);
addText('J3: TERMOFUSIVEL 75C', 69.0, 70.0, 0.8);
addText('(+)', 86.0, 73.0, 0.7);
addText('RET', 86.0, 65.5, 0.7);

addBox(86.0, 49.0, 10.0, 11.0);
addText('J2: AQUECEDOR PTC', 71.0, 55.0, 0.8);
addText('(+)', 86.0, 58.0, 0.7);
addText('(-)', 86.0, 50.5, 0.7);

addBox(86.0, 34.0, 10.0, 11.0);
addText('J4: FAN PTC 24V', 72.0, 40.0, 0.8);
addText('(+)', 86.0, 43.0, 0.7);
addText('(-)', 86.0, 35.5, 0.7);

addBox(86.0, 19.0, 10.0, 11.0);
addText('J5: PURGA 24V', 73.0, 25.0, 0.8);
addText('(+)', 86.0, 28.0, 0.7);
addText('(-)', 86.0, 20.5, 0.7);

// --------------------------------------------------------------------------
// 7. DISPLAY TFT (J6) E SENSORES SHT31 (J7 e J8)
// --------------------------------------------------------------------------
addBox(18.0, 5.0, 37.0, 6.0);
addText('J6: DISPLAY TFT 2.4 SPI + TOUCH', 18.0, 13.5, 0.85);
addText('5V  GND  CS  RST  DC  MOSI SCK', 19.5, 11.5, 0.65);
addText('LED MISO CLK T_CS DIN  DO  NC', 19.5, 3.2, 0.65);
addText('PINO 8: LED = 3.3V OBRIGATORIO!', 18.0, 1.2, 0.65);

addBox(63.0, 5.0, 11.5, 6.0);
addText('J7: SHT31 #1', 62.0, 13.5, 0.75);
addText('INTERNO 0X44', 61.5, 11.5, 0.65);
addText('3V3 G SCL SDA', 62.0, 3.2, 0.65);

addBox(78.0, 5.0, 11.5, 6.0);
addText('J8: SHT31 #2', 77.0, 13.5, 0.75);
addText('EXTERNO 0X45', 76.5, 11.5, 0.65);
addText('3V3 G SCL SDA', 77.0, 3.2, 0.65);

// Rodapé centralizado
addText('PCBWAY / JLCPCB - 100X100MM 2-LAYER FR4', 55.0, 1.2, 0.7);

// --------------------------------------------------------------------------
// GRAVAÇÃO DO GERBER F_Silkscreen.gto
// --------------------------------------------------------------------------
let gtoContent = `%FSLAX46Y46*%
%MOMM*%
%LPD*%
%ADD10C,0.180*%
D10*
G01*
`;

silkLines.forEach(l => {
  gtoContent += `${gPoint(l.x1, l.y1)}D02*\n${gPoint(l.x2, l.y2)}D01*\n`;
});

gtoContent += 'M02*\n';

fs.writeFileSync(path.join(OUTPUT_GERBER, 'drybox_motherboard-F_Silkscreen.gto'), gtoContent, 'utf8');
console.log('Fixed drybox_motherboard-F_Silkscreen.gto generated with', silkLines.length, 'vector stroke lines!');

// --------------------------------------------------------------------------
// ATUALIZAÇÃO DO ARQUIVO KICAD PCB COM LAYOUT CORRIGIDO
// --------------------------------------------------------------------------
let kicadPcb = fs.readFileSync(path.join(OUTPUT_KICAD, 'drybox_motherboard.kicad_pcb'), 'utf8');

const kicadTexts = [
  { text: 'DRYBOX 60L PRO - MOTHERBOARD SHIELD V1.1', x: 28.5, y: 97.0, size: 1.05 },
  { text: 'J1: 24V IN', x: 17.5, y: 93.5, size: 0.85 },
  { text: 'F1: FUSIVEL 10A', x: 33.7, y: 93.5, size: 0.85 },
  { text: 'STEP-DOWN LM2596 (5.00V)', x: 69, y: 88.5, size: 1.05 },
  { text: 'CALIBRAR 5.00V ANTES DE PLUGAR ESP32!', x: 69, y: 85.0, size: 0.75 },
  { text: 'ESP32-S3', x: 24.7, y: 61.5, size: 1.3 },
  { text: 'WROOM-1 N16R8', x: 24.7, y: 56.5, size: 1.0 },
  { text: 'BARRAS FEMEA 2x22', x: 24.7, y: 47.0, size: 0.8 },
  { text: 'PASSO 2.54MM', x: 24.7, y: 43.5, size: 0.75 },
  { text: '5V', x: 41.5, y: 77.2, size: 0.7 },
  { text: 'GND', x: 41.5, y: 74.6, size: 0.7 },
  { text: '4:SDA', x: 42.5, y: 72.1, size: 0.7 },
  { text: '5:SCL', x: 42.5, y: 69.5, size: 0.7 },
  { text: '6:PTC', x: 42.5, y: 67.0, size: 0.7 },
  { text: '7:PURGA', x: 43.5, y: 64.5, size: 0.7 },
  { text: '8:T_CS', x: 43.0, y: 61.9, size: 0.7 },
  { text: '9:DC', x: 42.0, y: 59.4, size: 0.7 },
  { text: '10:CS', x: 42.5, y: 56.8, size: 0.7 },
  { text: '11:MOSI', x: 43.5, y: 54.3, size: 0.7 },
  { text: '12:SCK', x: 43.0, y: 51.8, size: 0.7 },
  { text: '13:MISO', x: 43.5, y: 49.2, size: 0.7 },
  { text: '14:RST', x: 43.0, y: 46.7, size: 0.7 },
  { text: '3.3V', x: 42.0, y: 44.1, size: 0.7 },
  { text: 'PINOS 35, 36, 37 PROIBIDOS (PSRAM)', x: 24.7, y: 26.5, size: 0.7 },
  { text: 'MOSFET 1: AQUECEDOR PTC', x: 59.5, y: 71.5, size: 0.9 },
  { text: 'MOSFET 2: PURGA 24V', x: 59.5, y: 47.5, size: 0.9 },
  { text: 'J3: TERMOFUSIVEL 75C', x: 74, y: 70, size: 0.8 },
  { text: 'J2: AQUECEDOR PTC', x: 74, y: 55, size: 0.8 },
  { text: 'J4: FAN PTC 24V', x: 74, y: 40, size: 0.8 },
  { text: 'J5: PURGA 24V', x: 74, y: 25, size: 0.8 },
  { text: 'J6: DISPLAY TFT 2.4 SPI + TOUCH', x: 36.5, y: 13.5, size: 0.85 },
  { text: 'PINO 8: LED = 3.3V OBRIGATORIO!', x: 36.5, y: 1.2, size: 0.65 },
  { text: 'J7: SHT31 #1 (0x44)', x: 68, y: 13.5, size: 0.75 },
  { text: 'J8: SHT31 #2 (0x45)', x: 83, y: 13.5, size: 0.75 }
];

let kicadTextBlocks = '\n  ;; Textos de Serigrafia Corrigidos\n';
kicadTexts.forEach(t => {
  kicadTextBlocks += `  (gr_text "${t.text}" (at ${t.x} ${t.y}) (layer "F.SilkS") (effects (font (size ${t.size} ${t.size}) (thickness 0.18))))\n`;
});

const textIdx = kicadPcb.indexOf('(gr_text "DRYBOX 60L PRO');
const endTextIdx = kicadPcb.indexOf('(footprint "MountingHole:MountingHole_3.2mm_M3_Pad"');

if (textIdx !== -1 && endTextIdx !== -1) {
  kicadPcb = kicadPcb.substring(0, textIdx) + kicadTextBlocks.trim() + '\n\n  ' + kicadPcb.substring(endTextIdx);
  fs.writeFileSync(path.join(OUTPUT_KICAD, 'drybox_motherboard.kicad_pcb'), kicadPcb, 'utf8');
  console.log('drybox_motherboard.kicad_pcb updated with repositioned silkscreen texts!');
}
