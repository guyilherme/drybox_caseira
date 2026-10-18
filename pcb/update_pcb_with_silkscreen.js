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
  const charSpacing = 1.2 * scale;
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

// Coordinate helper for RS-274X (Format: %FSLAX46Y46*%, metric 1 unit = 1 nm = 1e-6 mm)
function c(valMm) {
  const scaled = Math.round(valMm * 1000000);
  return (scaled >= 0 ? '' : '-') + Math.abs(scaled).toString();
}

function gPoint(x, y) {
  return `X${c(x)}Y${c(y)}`;
}

// --------------------------------------------------------------------------
// DEFINIÇÃO COMPLETA DAS LINHAS DE SERIGRAFIA (F_Silkscreen)
// --------------------------------------------------------------------------
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

// 1. TÍTULO E CABEÇALHO DA PLACA
addText('DRYBOX 60L PRO - MOTHERBOARD CARRIER SHIELD V1.1', 5.0, 97.5, 1.2);
addText('PCBWAY / JLCPCB - 100X100MM 2-LAYER FR4', 15.0, 1.0, 0.85);

// 2. J1 - ENTRADA 24V PRINCIPAL
addBox(12.0, 85.0, 11.0, 10.0);
addText('J1: ENTRADA 24V', 10.5, 95.2, 0.9);
addText('+24V', 13.5, 86.0, 0.8);
addText('GND', 19.0, 86.0, 0.8);

// 3. F1 - FUSÍVEL 10A
addBox(27.0, 85.0, 13.5, 10.0);
addText('F1: FUSIVEL 10A', 26.5, 95.2, 0.9);
addText('LAMINA', 28.5, 86.0, 0.8);

// 4. U2 - STEP-DOWN LM2596 (5.00V)
addBox(48.0, 77.0, 42.0, 20.0);
addText('STEP-DOWN LM2596 (REGULADOR 5.00V)', 49.5, 89.0, 1.1);
addText('REGULAR EM 5.00V ANTES DE PLUGAR ESP32!', 49.5, 85.5, 0.75);
addText('IN+', 52.5, 94.0, 0.8);
addText('IN-', 52.5, 80.5, 0.8);
addText('OUT+ (5V)', 79.5, 94.0, 0.8);
addText('OUT- (GND)', 80.0, 80.5, 0.8);

// 5. U1 - SOQUETE DO ESP32-S3 DEVKITC-1 N16R8
addBox(10.0, 22.0, 29.4, 59.5);
addText('ESP32-S3 DEVKITC-1', 13.0, 56.0, 1.3);
addText('N16R8 (16MB / 8MB)', 15.0, 52.5, 1.0);
addText('SOLDAR 2X BARRAS FEMEA 22 PINOS', 11.5, 47.5, 0.75);
addText('LADO DIREITO: CONTROLE E DADOS', 11.5, 44.5, 0.75);

// Pinos Esquerdo ESP32
addText('3V3', 14.5, 77.5, 0.75);
addText('EN', 14.5, 74.9, 0.75);
addText('GND', 14.5, 46.5, 0.75);

// Pinos Direito ESP32
addText('5V', 33.5, 77.5, 0.75);
addText('GND', 32.5, 74.9, 0.75);
addText('4:SDA', 28.5, 72.4, 0.75);
addText('5:SCL', 28.5, 69.8, 0.75);
addText('6:PTC', 28.5, 67.3, 0.75);
addText('7:PURGA', 26.0, 64.8, 0.75);
addText('8:T_CS', 27.5, 62.2, 0.75);
addText('9:DC', 30.0, 59.7, 0.75);
addText('10:CS', 28.5, 57.1, 0.75);
addText('11:MOSI', 26.5, 54.6, 0.75);
addText('12:SCK', 27.5, 52.1, 0.75);
addText('13:MISO', 26.5, 49.5, 0.75);
addText('14:RST', 27.5, 47.0, 0.75);
addText('3.3V', 29.5, 44.4, 0.75);

addText('PINOS 35, 36, 37 PROIBIDOS (PSRAM)', 11.0, 23.5, 0.65);

// 6. M1 - MOSFET 1 (AQUECEDOR PTC)
addBox(49.0, 55.0, 21.0, 18.0);
addText('MOSFET 1: AQUECEDOR PTC', 50.0, 71.5, 0.95);
addText('V+   V-   OUT', 50.5, 64.0, 0.85);
addText('PWM  GND', 50.5, 59.5, 0.8);
addText('MODULO HW-532 (LR7843)', 50.0, 56.0, 0.65);

// 7. M2 - MOSFET 2 (VENTOINHAS DE PURGA)
addBox(49.0, 31.0, 21.0, 18.0);
addText('MOSFET 2: PURGA 24V', 50.0, 47.5, 0.95);
addText('V+   V-   OUT', 50.5, 40.0, 0.85);
addText('PWM  GND', 50.5, 35.5, 0.8);
addText('MODULO HW-532 (LR7843)', 50.0, 32.0, 0.65);

// 8. BORNES BORDA DIREITA (J3, J2, J4, J5)
addBox(86.0, 64.0, 10.0, 11.0);
addText('J3: TERMOFUSIVEL 75C', 71.0, 70.0, 0.85);
addText('(+)', 86.0, 73.0, 0.7);
addText('RET', 86.0, 65.5, 0.7);

addBox(86.0, 49.0, 10.0, 11.0);
addText('J2: AQUECEDOR PTC', 73.0, 55.0, 0.85);
addText('(+)', 86.0, 58.0, 0.7);
addText('(-)', 86.0, 50.5, 0.7);

addBox(86.0, 34.0, 10.0, 11.0);
addText('J4: FAN PTC 24V', 74.0, 40.0, 0.85);
addText('(+)', 86.0, 43.0, 0.7);
addText('(-)', 86.0, 35.5, 0.7);

addBox(86.0, 19.0, 10.0, 11.0);
addText('J5: PURGA 24V', 75.0, 25.0, 0.85);
addText('(+)', 86.0, 28.0, 0.7);
addText('(-)', 86.0, 20.5, 0.7);

// 9. J6 - DISPLAY TFT 2.4" SPI + TOUCH
addBox(18.0, 5.0, 37.0, 6.0);
addText('J6: DISPLAY TFT 2.4 SPI + TOUCH', 18.0, 14.5, 0.9);
addText('1:5V 2:GND 3:CS 4:RST 5:DC 6:MOSI 7:SCK', 18.0, 11.8, 0.65);
addText('8:LED(3.3V!) 9:MISO 10:CLK 11:T_CS 12:DIN 13:DO 14:NC', 18.0, 2.5, 0.65);

// 10. J7 e J8 - SENSORES SHT31-D
addBox(63.0, 5.0, 11.5, 6.0);
addText('J7: SHT31 #1', 62.0, 14.5, 0.8);
addText('INTERNO 0X44', 62.0, 12.0, 0.7);
addText('3V3 G SCL SDA', 62.0, 2.5, 0.65);

addBox(78.0, 5.0, 11.5, 6.0);
addText('J8: SHT31 #2', 77.0, 14.5, 0.8);
addText('EXTERNO 0X45', 77.0, 12.0, 0.7);
addText('3V3 G SCL SDA', 77.0, 2.5, 0.65);

// --------------------------------------------------------------------------
// GRAVAÇÃO DO GERBER F_Silkscreen.gto COM TODAS AS LINHAS E TEXTOS
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
console.log('drybox_motherboard-F_Silkscreen.gto generated with', silkLines.length, 'vector stroke lines!');

// --------------------------------------------------------------------------
// ATUALIZAÇÃO DO ARQUIVO KICAD PCB COM TODOS OS TEXTOS
// --------------------------------------------------------------------------
let kicadPcb = fs.readFileSync(path.join(OUTPUT_KICAD, 'drybox_motherboard.kicad_pcb'), 'utf8');

// Monta as tags gr_text do KiCad
const kicadTexts = [
  { text: 'DRYBOX 60L PRO - MOTHERBOARD CARRIER SHIELD V1.1', x: 50, y: 97.5, size: 1.2 },
  { text: 'J1: ENTRADA 24V (+/-)', x: 17.5, y: 83.5, size: 0.9 },
  { text: 'F1: FUSIVEL 10A LAMINA', x: 33.7, y: 83.5, size: 0.9 },
  { text: 'STEP-DOWN LM2596 (REGULADOR 5.00V)', x: 69, y: 88, size: 1.1 },
  { text: 'REGULAR EM 5.00V ANTES DE PLUGAR ESP32!', x: 69, y: 84.5, size: 0.8 },
  { text: 'ESP32-S3 DEVKITC-1 N16R8', x: 24.7, y: 56, size: 1.3 },
  { text: 'SOLDAR 2x BARRAS FEMEA 22 PINOS', x: 24.7, y: 52, size: 0.9 },
  { text: 'LADO DIREITO: CONTROLE E DADOS', x: 24.7, y: 48, size: 0.8 },
  { text: 'MOSFET 1: AQUECEDOR PTC (HW-532)', x: 59, y: 70, size: 0.95 },
  { text: 'MOSFET 2: PURGA 24V (HW-532)', x: 59, y: 46, size: 0.95 },
  { text: 'J3: TERMOFUSIVEL 75C', x: 74, y: 70, size: 0.85 },
  { text: 'J2: AQUECEDOR PTC (+/-)', x: 74, y: 55, size: 0.85 },
  { text: 'J4: FAN PTC 24V (+/-)', x: 74, y: 40, size: 0.85 },
  { text: 'J5: PURGA 24V (+/-)', x: 74, y: 25, size: 0.85 },
  { text: 'J6: DISPLAY TFT 2.4 SPI + TOUCH', x: 36, y: 14.5, size: 0.9 },
  { text: 'PINO 8: LED = 3.3V OBRIGATORIO!', x: 36, y: 11.5, size: 0.75 },
  { text: 'J7: SHT31 #1 INTERNO (0x44)', x: 68, y: 14, size: 0.8 },
  { text: 'J8: SHT31 #2 EXTERNO (0x45)', x: 83, y: 14, size: 0.8 }
];

let kicadTextBlocks = '\n  ;; Textos de Serigrafia Detalhados\n';
kicadTexts.forEach(t => {
  kicadTextBlocks += `  (gr_text "${t.text}" (at ${t.x} ${t.y}) (layer "F.SilkS") (effects (font (size ${t.size} ${t.size}) (thickness 0.18))))\n`;
});

// Substitui a seção de textos antiga
const textIdx = kicadPcb.indexOf('(gr_text "DRYBOX 60L PRO');
const endTextIdx = kicadPcb.indexOf('(footprint "MountingHole:MountingHole_3.2mm_M3_Pad"');

if (textIdx !== -1 && endTextIdx !== -1) {
  kicadPcb = kicadPcb.substring(0, textIdx) + kicadTextBlocks.trim() + '\n\n  ' + kicadPcb.substring(endTextIdx);
  fs.writeFileSync(path.join(OUTPUT_KICAD, 'drybox_motherboard.kicad_pcb'), kicadPcb, 'utf8');
  console.log('drybox_motherboard.kicad_pcb updated with detailed silkscreen texts!');
}
