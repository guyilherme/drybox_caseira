const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'gerber');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Board dimensions in mm
const BOARD_W = 100.0;
const BOARD_H = 100.0;

// Coordinate helper for RS-274X (Format: %FSLAX46Y46*%, metric 1 unit = 1 nm = 1e-6 mm)
function c(valMm) {
  const scaled = Math.round(valMm * 1000000);
  return (scaled >= 0 ? '' : '-') + Math.abs(scaled).toString();
}

function gPoint(x, y) {
  return `X${c(x)}Y${c(y)}`;
}

// --------------------------------------------------------------------------
// DEFINIÇÃO DE COMPONENTES E PINOS (PADS)
// --------------------------------------------------------------------------
const pads = [];
const drills = [];
const tracksTop = [];
const tracksBottom = [];
const silkTopLines = [];
const silkTopTexts = [];
const maskTopOpenings = [];

// Helper para adicionar furo de broca
function addDrill(tool, x, y) {
  drills.push({ tool, x, y });
}

// Helper para adicionar Pad PTH (Through-Hole)
function addPadPTH(x, y, drillDiameter, padDiameter, net = '', shape = 'circle', pinNum = 1) {
  let tool = 'T1'; // 0.8mm
  if (drillDiameter >= 3.0) tool = 'T4'; // 3.2mm M3
  else if (drillDiameter >= 1.2) tool = 'T3'; // 1.3mm Power Terminal / Fuse
  else if (drillDiameter >= 0.95) tool = 'T2'; // 1.0mm LM2596 / Terminal

  addDrill(tool, x, y);
  pads.push({ x, y, padDiameter, shape, net, pinNum });
  maskTopOpenings.push({ x, y, size: padDiameter + 0.15, shape });
}

// Helper para adicionar trilha
function addTrack(layer, x1, y1, x2, y2, width, net = '') {
  if (layer === 'top') {
    tracksTop.push({ x1, y1, x2, y2, width, net });
  } else {
    tracksBottom.push({ x1, y1, x2, y2, width, net });
  }
}

// Helper para adicionar texto na serigrafia (Silkscreen)
function addSilkText(x, y, text, size = 1.2) {
  silkTopTexts.push({ x, y, text, size });
}

// Helper para retângulo na serigrafia
function addSilkRect(x, y, w, h) {
  silkTopLines.push({ x1: x, y1: y, x2: x + w, y2: y });
  silkTopLines.push({ x1: x + w, y1: y, x2: x + w, y2: y + h });
  silkTopLines.push({ x1: x + w, y1: y + h, x2: x, y2: y + h });
  silkTopLines.push({ x1: x, y1: y + h, x2: x, y2: y });
}

// 1. FUROS DE FIXAÇÃO M3 NOS 4 CANTOS
const mountHoles = [
  { x: 5.0, y: 5.0 },
  { x: 95.0, y: 5.0 },
  { x: 5.0, y: 95.0 },
  { x: 95.0, y: 95.0 }
];
mountHoles.forEach(h => {
  addPadPTH(h.x, h.y, 3.2, 6.0, 'GND', 'circle');
});

// 2. J1 - BORNE ENTRADA 24V PRINCIPAL (KF301-2P, pitch 5.08mm)
// Pin 1: +24V_IN (15.0, 90.0)
// Pin 2: GND_IN (20.08, 90.0)
addPadPTH(15.0, 90.0, 1.3, 2.5, '+24V_IN', 'square', 1);
addPadPTH(20.08, 90.0, 1.3, 2.5, 'GND', 'circle', 2);
addSilkRect(12.0, 85.0, 11.0, 10.0);
addSilkText(12.5, 96.5, 'ENTRADA 24V', 1.3);
addSilkText(14.0, 86.5, '+24V', 1.0);
addSilkText(19.2, 86.5, 'GND', 1.0);

// 3. F1 - PORTA-FUSÍVEL 10A AUTOMOTIVO (Keystone 3557 / Standard Blade, pitch 7.5mm)
// Pin 1: (30.0, 90.0)
// Pin 2: (37.5, 90.0)
addPadPTH(30.0, 90.0, 1.3, 2.8, '+24V_IN', 'square', 1);
addPadPTH(37.5, 90.0, 1.3, 2.8, '+24V_BUS', 'circle', 2);
addSilkRect(27.0, 85.0, 13.5, 10.0);
addSilkText(28.0, 96.5, 'FUSÍVEL 10A', 1.2);
addSilkText(29.0, 89.0, 'F1', 1.0);

// Conexão pesada entre Borne 24V IN e Fusível IN (Trilha 3.0mm Top e Bottom)
addTrack('top', 15.0, 90.0, 30.0, 90.0, 3.0, '+24V_IN');
addTrack('bottom', 15.0, 90.0, 30.0, 90.0, 3.0, '+24V_IN');

// 4. U2 - MÓDULO STEP-DOWN LM2596 (Pads 4 cantos: IN+, IN-, OUT+, OUT-)
// Tamanho do módulo comercial: 43.5mm x 21.0mm
// IN+ : (50.0, 95.0) -> +24V_BUS
// IN- : (50.0, 80.0) -> GND
// OUT+: (88.0, 95.0) -> +5V_BUS
// OUT-: (88.0, 80.0) -> GND
addPadPTH(50.0, 95.0, 1.2, 2.4, '+24V_BUS', 'square', 1);
addPadPTH(50.0, 80.0, 1.2, 2.4, 'GND', 'circle', 2);
addPadPTH(88.0, 95.0, 1.2, 2.4, '+5V_BUS', 'square', 3);
addPadPTH(88.0, 80.0, 1.2, 2.4, 'GND', 'circle', 4);
addSilkRect(48.0, 77.0, 42.0, 21.0);
addSilkText(55.0, 88.0, 'STEP-DOWN LM2596 (5.00V)', 1.3);
addSilkText(52.0, 94.0, 'IN+', 1.0);
addSilkText(52.0, 81.0, 'IN-', 1.0);
addSilkText(81.0, 94.0, 'OUT+ (5V)', 1.0);
addSilkText(83.0, 81.0, 'OUT-', 1.0);

// Trilha do Fusível OUT até Step-Down IN+ (Top 2.0mm)
addTrack('top', 37.5, 90.0, 45.0, 90.0, 2.5, '+24V_BUS');
addTrack('top', 45.0, 90.0, 50.0, 95.0, 2.5, '+24V_BUS');

// 5. U1 - SOQUETE ESP32-S3 DEVKITC-1 N16R8 (2x 22 pinos, pitch 2.54mm, largura 25.4mm)
// Coluna Esquerda: X = 12.0 mm, Y de 78.0 até 24.66 mm (22 pinos)
// Coluna Direita:  X = 37.4 mm, Y de 78.0 até 24.66 mm (22 pinos)
const espLeftY = [];
const espRightY = [];
for (let i = 0; i < 22; i++) {
  const y = 78.0 - (i * 2.54);
  espLeftY.push(y);
  espRightY.push(y);

  // Barra Esquerda (Pinos 1 a 22)
  addPadPTH(12.0, y, 0.9, 1.8, `ESP_L_${i + 1}`, i === 0 ? 'square' : 'circle', i + 1);

  // Barra Direita (Pinos 23 a 44)
  // Pin 44 (index 0): 5V
  // Pin 43 (index 1): GND
  // Pin 42 (index 2): GPIO 4 (SDA)
  // Pin 41 (index 3): GPIO 5 (SCL)
  // Pin 40 (index 4): GPIO 6 (PWM PTC)
  // Pin 39 (index 5): GPIO 7 (PWM Purga)
  // Pin 38 (index 6): GPIO 8 (T_CS)
  // Pin 37 (index 7): GPIO 9 (DC)
  // Pin 36 (index 8): GPIO 10 (CS)
  // Pin 35 (index 9): GPIO 11 (MOSI)
  // Pin 34 (index 10): GPIO 12 (SCK)
  // Pin 33 (index 11): GPIO 13 (MISO)
  // Pin 32 (index 12): GPIO 14 (RST)
  // Pin 31 (index 13): 3.3V
  let net = `ESP_R_${44 - i}`;
  if (i === 0) net = '+5V_BUS';
  else if (i === 1) net = 'GND';
  else if (i === 2) net = 'I2C_SDA';
  else if (i === 3) net = 'I2C_SCL';
  else if (i === 4) net = 'PWM_PTC';
  else if (i === 5) net = 'PWM_PURGE';
  else if (i === 6) net = 'SPI_T_CS';
  else if (i === 7) net = 'SPI_DC';
  else if (i === 8) net = 'SPI_CS';
  else if (i === 9) net = 'SPI_MOSI';
  else if (i === 10) net = 'SPI_SCK';
  else if (i === 11) net = 'SPI_MISO';
  else if (i === 12) net = 'SPI_RST';
  else if (i === 13) net = '+3.3V_BUS';

  addPadPTH(37.4, y, 0.9, 1.8, net, i === 0 ? 'square' : 'circle', 44 - i);
}

addSilkRect(10.0, 22.0, 29.4, 59.0);
addSilkText(15.0, 52.0, 'ESP32-S3', 1.8);
addSilkText(16.0, 48.0, 'DEVKITC-1', 1.4);
addSilkText(15.0, 44.0, 'N16R8', 1.2);
addSilkText(13.5, 79.5, '3V3', 0.9);
addSilkText(35.0, 79.5, '5V', 0.9);

// Conecta Step-Down OUT+ (5V) ao pino 5V do ESP32 (37.4, 78.0)
addTrack('top', 88.0, 95.0, 45.0, 95.0, 1.5, '+5V_BUS');
addTrack('top', 45.0, 95.0, 40.0, 90.0, 1.5, '+5V_BUS');
addTrack('top', 40.0, 90.0, 40.0, 80.0, 1.5, '+5V_BUS');
addTrack('top', 40.0, 80.0, 37.4, 78.0, 1.5, '+5V_BUS');

// 6. M1 - MÓDULO MOSFET 1 (AQUECEDOR PTC - HW-532)
// Potência: V+ (52.0, 68.0), V- (57.08, 68.0), OUT (62.16, 68.0)
// Controle: PWM (52.0, 58.0), GND (54.54, 58.0)
addPadPTH(52.0, 68.0, 1.3, 2.4, '+24V_BUS', 'square', 1);
addPadPTH(57.08, 68.0, 1.3, 2.4, 'GND', 'circle', 2);
addPadPTH(62.16, 68.0, 1.3, 2.4, 'OUT_PTC', 'circle', 3);
addPadPTH(52.0, 58.0, 0.9, 1.8, 'PWM_PTC', 'square', 4);
addPadPTH(54.54, 58.0, 0.9, 1.8, 'GND', 'circle', 5);

addSilkRect(49.0, 55.0, 20.0, 17.0);
addSilkText(50.0, 70.0, 'MOSFET 1 (PTC)', 1.2);
addSilkText(50.5, 65.0, 'V+  V-  OUT', 0.9);
addSilkText(50.5, 59.5, 'PWM G', 0.8);

// Conecta GPIO 6 (37.4, 67.84) até PWM do MOSFET 1 (52.0, 58.0)
addTrack('top', 37.4, 67.84, 45.0, 67.84, 0.5, 'PWM_PTC');
addTrack('top', 45.0, 67.84, 48.0, 58.0, 0.5, 'PWM_PTC');
addTrack('top', 48.0, 58.0, 52.0, 58.0, 0.5, 'PWM_PTC');

// 7. M2 - MÓDULO MOSFET 2 (VENTOINHAS DE PURGA - HW-532)
// Potência: V+ (52.0, 44.0), V- (57.08, 44.0), OUT (62.16, 44.0)
// Controle: PWM (52.0, 34.0), GND (54.54, 34.0)
addPadPTH(52.0, 44.0, 1.3, 2.4, '+24V_BUS', 'square', 1);
addPadPTH(57.08, 44.0, 1.3, 2.4, 'GND', 'circle', 2);
addPadPTH(62.16, 44.0, 1.3, 2.4, 'OUT_PURGE', 'circle', 3);
addPadPTH(52.0, 34.0, 0.9, 1.8, 'PWM_PURGE', 'square', 4);
addPadPTH(54.54, 34.0, 0.9, 1.8, 'GND', 'circle', 5);

addSilkRect(49.0, 31.0, 20.0, 17.0);
addSilkText(50.0, 46.0, 'MOSFET 2 (PURGA)', 1.2);
addSilkText(50.5, 41.0, 'V+  V-  OUT', 0.9);
addSilkText(50.5, 35.5, 'PWM G', 0.8);

// Conecta GPIO 7 (37.4, 65.3) até PWM do MOSFET 2 (52.0, 34.0)
addTrack('top', 37.4, 65.3, 44.0, 65.3, 0.5, 'PWM_PURGE');
addTrack('top', 44.0, 65.3, 46.0, 34.0, 0.5, 'PWM_PURGE');
addTrack('top', 46.0, 34.0, 52.0, 34.0, 0.5, 'PWM_PURGE');

// 8. BORNES DE SAÍDA DE POTÊNCIA (BORDA DIREITA)
// J3 - Termofusível 75°C (KF301-2P, pitch 5.08mm)
// Pin 1: +24V_BUS (90.0, 72.0)
// Pin 2: +24V_PTC_FUSED (90.0, 66.92)
addPadPTH(90.0, 72.0, 1.3, 2.5, '+24V_BUS', 'square', 1);
addPadPTH(90.0, 66.92, 1.3, 2.5, '+24V_PTC_FUSED', 'circle', 2);
addSilkRect(86.0, 64.0, 10.0, 11.0);
addSilkText(71.0, 70.0, 'TERMOFUSÍVEL 75°C', 1.0);

// J2 - Resistência Aquecedor PTC 150W (KF301-2P, pitch 5.08mm)
// Pin 1: +24V_PTC_FUSED (90.0, 57.0)
// Pin 2: OUT_PTC (90.0, 51.92)
addPadPTH(90.0, 57.0, 1.3, 2.5, '+24V_PTC_FUSED', 'square', 1);
addPadPTH(90.0, 51.92, 1.3, 2.5, 'OUT_PTC', 'circle', 2);
addSilkRect(86.0, 49.0, 10.0, 11.0);
addSilkText(73.0, 55.0, 'AQUECEDOR PTC (+/-)', 1.0);

// Trilha de 3.0mm entre J3 pin 2 e J2 pin 1 (+24V FUSED)
addTrack('top', 90.0, 66.92, 90.0, 57.0, 3.0, '+24V_PTC_FUSED');
addTrack('bottom', 90.0, 66.92, 90.0, 57.0, 3.0, '+24V_PTC_FUSED');

// Trilha de 3.0mm entre MOSFET 1 OUT (62.16, 68.0) e J2 pin 2 (90.0, 51.92)
addTrack('top', 62.16, 68.0, 75.0, 68.0, 3.0, 'OUT_PTC');
addTrack('top', 75.0, 68.0, 85.0, 51.92, 3.0, 'OUT_PTC');
addTrack('top', 85.0, 51.92, 90.0, 51.92, 3.0, 'OUT_PTC');

addTrack('bottom', 62.16, 68.0, 75.0, 68.0, 3.0, 'OUT_PTC');
addTrack('bottom', 75.0, 68.0, 85.0, 51.92, 3.0, 'OUT_PTC');
addTrack('bottom', 85.0, 51.92, 90.0, 51.92, 3.0, 'OUT_PTC');

// J4 - Ventoinha Interna do PTC 24V (KF301-2P, pitch 5.08mm)
// Pin 1: +24V_BUS (90.0, 42.0)
// Pin 2: GND (90.0, 36.92)
addPadPTH(90.0, 42.0, 1.3, 2.5, '+24V_BUS', 'square', 1);
addPadPTH(90.0, 36.92, 1.3, 2.5, 'GND', 'circle', 2);
addSilkRect(86.0, 34.0, 10.0, 11.0);
addSilkText(73.5, 40.0, 'FAN PTC (CONTÍNUO)', 1.0);

// J5 - Ventoinhas de Purga 24V (KF301-2P, pitch 5.08mm)
// Pin 1: +24V_BUS (90.0, 27.0)
// Pin 2: OUT_PURGE (90.0, 21.92)
addPadPTH(90.0, 27.0, 1.3, 2.5, '+24V_BUS', 'square', 1);
addPadPTH(90.0, 21.92, 1.3, 2.5, 'OUT_PURGE', 'circle', 2);
addSilkRect(86.0, 19.0, 10.0, 11.0);
addSilkText(73.5, 25.0, 'PURGA 24V (+/OUT)', 1.0);

// Trilha de 2.5mm entre MOSFET 2 OUT (62.16, 44.0) e J5 pin 2 (90.0, 21.92)
addTrack('top', 62.16, 44.0, 75.0, 44.0, 2.5, 'OUT_PURGE');
addTrack('top', 75.0, 44.0, 85.0, 21.92, 2.5, 'OUT_PURGE');
addTrack('top', 85.0, 21.92, 90.0, 21.92, 2.5, 'OUT_PURGE');

// 9. J6 - CONECTOR DISPLAY TFT 2.4" SPI + TOUCH (Barra 1x14 pinos, pitch 2.54mm)
// Posicionado horizontalmente na borda inferior: Y = 10.0 mm, X de 25.0 mm a 58.02 mm
const dispPins = [
  { pin: 1, name: 'VCC', net: '+5V_BUS' },
  { pin: 2, name: 'GND', net: 'GND' },
  { pin: 3, name: 'CS', net: 'SPI_CS' },
  { pin: 4, name: 'RST', net: 'SPI_RST' },
  { pin: 5, name: 'DC', net: 'SPI_DC' },
  { pin: 6, name: 'MOSI', net: 'SPI_MOSI' },
  { pin: 7, name: 'SCK', net: 'SPI_SCK' },
  { pin: 8, name: 'LED', net: '+3.3V_BUS' }, // 3.3V OBRIGATÓRIO!
  { pin: 9, name: 'MISO', net: 'SPI_MISO' },
  { pin: 10, name: 'T_CLK', net: 'SPI_SCK' },
  { pin: 11, name: 'T_CS', net: 'SPI_T_CS' },
  { pin: 12, name: 'T_DIN', net: 'SPI_MOSI' },
  { pin: 13, name: 'T_DO', net: 'SPI_MISO' },
  { pin: 14, name: 'T_IRQ', net: 'NC' }
];

dispPins.forEach((p, idx) => {
  const x = 20.0 + (idx * 2.54);
  const y = 8.0;
  addPadPTH(x, y, 0.9, 1.8, p.net, idx === 0 ? 'square' : 'circle', p.pin);
});

addSilkRect(18.0, 5.0, 37.0, 6.0);
addSilkText(20.0, 12.0, 'DISPLAY TFT 2.4" SPI + TOUCH RESISTIVO (14 PINOS)', 1.0);
addSilkText(18.0, 2.5, '1:VCC(5V)  8:LED(3.3V!)  14:T_IRQ', 0.9);

// 10. J7 e J8 - CONECTORES SENSORES SHT31-D (I2C)
// J7 - Sensor 1 (Interno 0x44): X = 65.0 mm a 72.62 mm, Y = 8.0 mm
const shtPins1 = ['+3.3V_BUS', 'GND', 'I2C_SCL', 'I2C_SDA'];
shtPins1.forEach((net, idx) => {
  const x = 65.0 + (idx * 2.54);
  const y = 8.0;
  addPadPTH(x, y, 0.9, 1.8, net, idx === 0 ? 'square' : 'circle', idx + 1);
});
addSilkRect(63.0, 5.0, 11.5, 6.0);
addSilkText(62.0, 12.0, 'SHT31 #1 (0x44)', 0.9);

// J8 - Sensor 2 (Externo 0x45): X = 80.0 mm a 87.62 mm, Y = 8.0 mm
const shtPins2 = ['+3.3V_BUS', 'GND', 'I2C_SCL', 'I2C_SDA'];
shtPins2.forEach((net, idx) => {
  const x = 80.0 + (idx * 2.54);
  const y = 8.0;
  addPadPTH(x, y, 0.9, 1.8, net, idx === 0 ? 'square' : 'circle', idx + 1);
});
addSilkRect(78.0, 5.0, 11.5, 6.0);
addSilkText(77.0, 12.0, 'SHT31 #2 (0x45)', 0.9);

// 11. BARRAMENTOS E TRILHAS GERAIS
// Linha Tronco +24V_BUS (3.0mm) ligando Fusível OUT aos MOSFETs e Bornes
addTrack('top', 37.5, 90.0, 52.0, 68.0, 2.5, '+24V_BUS');
addTrack('bottom', 37.5, 90.0, 52.0, 68.0, 2.5, '+24V_BUS');

addTrack('top', 52.0, 68.0, 52.0, 44.0, 2.5, '+24V_BUS');
addTrack('bottom', 52.0, 68.0, 52.0, 44.0, 2.5, '+24V_BUS');

addTrack('top', 52.0, 68.0, 90.0, 72.0, 2.5, '+24V_BUS'); // Para Termofusível
addTrack('bottom', 52.0, 68.0, 90.0, 72.0, 2.5, '+24V_BUS');

addTrack('top', 90.0, 72.0, 90.0, 42.0, 2.0, '+24V_BUS'); // Para Fan PTC
addTrack('top', 90.0, 42.0, 90.0, 27.0, 2.0, '+24V_BUS'); // Para Purga Fan

// Barramento 3.3V (1.0mm) ligando ESP32 3V3 (37.4, 44.98) ao pino LED do Display (37.78, 8.0) e Sensores
addTrack('top', 37.4, 44.98, 42.0, 44.98, 1.0, '+3.3V_BUS');
addTrack('top', 42.0, 44.98, 42.0, 15.0, 1.0, '+3.3V_BUS');
addTrack('top', 42.0, 15.0, 37.78, 8.0, 1.0, '+3.3V_BUS');
addTrack('top', 42.0, 15.0, 65.0, 8.0, 0.8, '+3.3V_BUS'); // SHT31 #1
addTrack('top', 65.0, 8.0, 80.0, 8.0, 0.8, '+3.3V_BUS');  // SHT31 #2

// Barramento I2C (SDA e SCL)
// SDA: ESP32 (37.4, 72.92) até J7 e J8 (pino 4)
addTrack('bottom', 37.4, 72.92, 45.0, 72.92, 0.5, 'I2C_SDA');
addTrack('bottom', 45.0, 72.92, 72.62, 18.0, 0.5, 'I2C_SDA');
addTrack('bottom', 72.62, 18.0, 72.62, 8.0, 0.5, 'I2C_SDA');
addTrack('bottom', 72.62, 8.0, 87.62, 8.0, 0.5, 'I2C_SDA');

// SCL: ESP32 (37.4, 70.38) até J7 e J8 (pino 3)
addTrack('bottom', 37.4, 70.38, 46.0, 70.38, 0.5, 'I2C_SCL');
addTrack('bottom', 46.0, 70.38, 70.08, 18.0, 0.5, 'I2C_SCL');
addTrack('bottom', 70.08, 18.0, 70.08, 8.0, 0.5, 'I2C_SCL');
addTrack('bottom', 70.08, 8.0, 85.08, 8.0, 0.5, 'I2C_SCL');

// Barramento SPI do Display
// CS: (37.4, 57.68) -> (25.08, 8.0)
addTrack('top', 37.4, 57.68, 30.0, 57.68, 0.5, 'SPI_CS');
addTrack('top', 30.0, 57.68, 25.08, 8.0, 0.5, 'SPI_CS');

// DC: (37.4, 62.76) -> (30.16, 8.0)
addTrack('top', 37.4, 62.76, 33.0, 62.76, 0.5, 'SPI_DC');
addTrack('top', 33.0, 62.76, 30.16, 8.0, 0.5, 'SPI_DC');

// MOSI: (37.4, 55.14) -> (32.7, 8.0) e (47.94, 8.0)
addTrack('top', 37.4, 55.14, 32.7, 8.0, 0.5, 'SPI_MOSI');
addTrack('bottom', 32.7, 8.0, 47.94, 8.0, 0.5, 'SPI_MOSI');

// SCK: (37.4, 52.6) -> (35.24, 8.0) e (42.86, 8.0)
addTrack('top', 37.4, 52.6, 35.24, 8.0, 0.5, 'SPI_SCK');
addTrack('bottom', 35.24, 8.0, 42.86, 8.0, 0.5, 'SPI_SCK');

// MISO: (37.4, 50.06) -> (40.32, 8.0) e (50.48, 8.0)
addTrack('top', 37.4, 50.06, 40.32, 8.0, 0.5, 'SPI_MISO');
addTrack('bottom', 40.32, 8.0, 50.48, 8.0, 0.5, 'SPI_MISO');

// RST: (37.4, 47.52) -> (27.62, 8.0)
addTrack('top', 37.4, 47.52, 27.62, 8.0, 0.5, 'SPI_RST');

// T_CS: (37.4, 65.3) -> (45.4, 8.0)
addTrack('top', 37.4, 60.22, 45.4, 8.0, 0.5, 'SPI_T_CS');

// 12. TEXTOS DA SERIGRAFIA DA PLACA
addSilkText(5.0, 98.0, 'DRYBOX 60L PRO • MOTHERBOARD CARRIER SHIELD v1.0', 1.4);
addSilkText(5.0, 1.5, 'PROJETADO PARA PCBWAY / JLCPCB • 100x100mm 2-LAYER FR4 1.6mm', 1.0);
addSilkText(60.0, 85.0, 'CALIBRAR LM2596 EM 5.00V ANTES DE PLUGAR ESP32!', 0.9);

// --------------------------------------------------------------------------
// GERADORES DE ARQUIVOS GERBER (RS-274X)
// --------------------------------------------------------------------------

// 1. Edge_Cuts (Contorno da Placa 100x100mm com cantos arredondados)
function generateEdgeCuts() {
  return `%FSLAX46Y46*%
%MOMM*%
%LPD*%
%ADD10C,0.150*%
D10*
G01*
${gPoint(2.0, 0.0)}D02*
${gPoint(98.0, 0.0)}D01*
G02*
${gPoint(100.0, 2.0)}I0.000000J2000000D01*
G01*
${gPoint(100.0, 98.0)}D01*
G02*
${gPoint(98.0, 100.0)}I-2000000J0.000000D01*
G01*
${gPoint(2.0, 100.0)}D01*
G02*
${gPoint(0.0, 98.0)}I0.000000J-2000000D01*
G01*
${gPoint(0.0, 2.0)}D01*
G02*
${gPoint(2.0, 0.0)}I2000000J0.000000D01*
M02*
`;
}

// 2. F_Cu (Cobre Superior)
function generateTopCopper() {
  let out = `%FSLAX46Y46*%
%MOMM*%
%LPD*%
%ADD10C,0.400*%
%ADD11C,0.500*%
%ADD12C,1.000*%
%ADD13C,1.500*%
%ADD14C,2.000*%
%ADD15C,2.500*%
%ADD16C,3.000*%
%ADD20C,1.800*%
%ADD21R,1.800X1.800*%
%ADD22C,2.400*%
%ADD23R,2.400X2.400*%
%ADD24C,2.500*%
%ADD25R,2.500X2.500*%
%ADD26C,2.800*%
%ADD27R,2.800X2.800*%
%ADD28C,6.000*%
G01*
`;

  // Desenha os pads
  pads.forEach(p => {
    let ap = 'D20';
    if (p.padDiameter >= 5.5) ap = 'D28';
    else if (p.padDiameter >= 2.7) ap = p.shape === 'square' ? 'D27' : 'D26';
    else if (p.padDiameter >= 2.5) ap = p.shape === 'square' ? 'D25' : 'D24';
    else if (p.padDiameter >= 2.3) ap = p.shape === 'square' ? 'D23' : 'D22';
    else ap = p.shape === 'square' ? 'D21' : 'D20';

    out += `${ap}*\n${gPoint(p.x, p.y)}D03*\n`;
  });

  // Desenha as trilhas Top
  tracksTop.forEach(t => {
    let ap = 'D10';
    if (t.width >= 3.0) ap = 'D16';
    else if (t.width >= 2.5) ap = 'D15';
    else if (t.width >= 2.0) ap = 'D14';
    else if (t.width >= 1.5) ap = 'D13';
    else if (t.width >= 1.0) ap = 'D12';
    else if (t.width >= 0.5) ap = 'D11';

    out += `${ap}*\n${gPoint(t.x1, t.y1)}D02*\n${gPoint(t.x2, t.y2)}D01*\n`;
  });

  out += 'M02*\n';
  return out;
}

// 3. B_Cu (Cobre Inferior + Plano de GND)
function generateBottomCopper() {
  let out = `%FSLAX46Y46*%
%MOMM*%
%LPD*%
%ADD10C,0.500*%
%ADD11C,1.000*%
%ADD12C,1.500*%
%ADD13C,2.500*%
%ADD14C,3.000*%
%ADD20C,1.800*%
%ADD21R,1.800X1.800*%
%ADD22C,2.400*%
%ADD23R,2.400X2.400*%
%ADD24C,2.500*%
%ADD25R,2.500X2.500*%
%ADD26C,2.800*%
%ADD27R,2.800X2.800*%
%ADD28C,6.000*%
G01*
`;

  // Pads no Bottom
  pads.forEach(p => {
    let ap = 'D20';
    if (p.padDiameter >= 5.5) ap = 'D28';
    else if (p.padDiameter >= 2.7) ap = p.shape === 'square' ? 'D27' : 'D26';
    else if (p.padDiameter >= 2.5) ap = p.shape === 'square' ? 'D25' : 'D24';
    else if (p.padDiameter >= 2.3) ap = p.shape === 'square' ? 'D23' : 'D22';
    else ap = p.shape === 'square' ? 'D21' : 'D20';

    out += `${ap}*\n${gPoint(p.x, p.y)}D03*\n`;
  });

  // Trilhas no Bottom
  tracksBottom.forEach(t => {
    let ap = 'D10';
    if (t.width >= 3.0) ap = 'D14';
    else if (t.width >= 2.5) ap = 'D13';
    else if (t.width >= 1.5) ap = 'D12';
    else if (t.width >= 1.0) ap = 'D11';

    out += `${ap}*\n${gPoint(t.x1, t.y1)}D02*\n${gPoint(t.x2, t.y2)}D01*\n`;
  });

  out += 'M02*\n';
  return out;
}

// 4. F_Mask (Máscara de Solda Top)
function generateTopMask() {
  let out = `%FSLAX46Y46*%
%MOMM*%
%LPD*%
%ADD20C,1.950*%
%ADD21R,1.950X1.950*%
%ADD22C,2.550*%
%ADD23R,2.550X2.550*%
%ADD24C,2.650*%
%ADD25R,2.650X2.650*%
%ADD26C,2.950*%
%ADD27R,2.950X2.950*%
%ADD28C,6.200*%
%ADD30C,3.200*%
G01*
`;

  maskTopOpenings.forEach(m => {
    let ap = 'D20';
    if (m.size >= 6.0) ap = 'D28';
    else if (m.size >= 2.9) ap = m.shape === 'square' ? 'D27' : 'D26';
    else if (m.size >= 2.6) ap = m.shape === 'square' ? 'D25' : 'D24';
    else if (m.size >= 2.5) ap = m.shape === 'square' ? 'D23' : 'D22';
    else ap = m.shape === 'square' ? 'D21' : 'D20';

    out += `${ap}*\n${gPoint(m.x, m.y)}D03*\n`;
  });

  // Janelas de estanho (Solder mask openings) sobre as trilhas de 24V de alta corrente
  // Permite ao usuário reforçar com estanho para aguentar até 15A sem esquentar
  out += 'D30*\n';
  out += `${gPoint(15.0, 90.0)}D02*\n${gPoint(30.0, 90.0)}D01*\n`;
  out += `${gPoint(62.16, 68.0)}D02*\n${gPoint(90.0, 51.92)}D01*\n`;

  out += 'M02*\n';
  return out;
}

// 5. B_Mask (Máscara de Solda Bottom)
function generateBottomMask() {
  let out = `%FSLAX46Y46*%
%MOMM*%
%LPD*%
%ADD20C,1.950*%
%ADD21R,1.950X1.950*%
%ADD22C,2.550*%
%ADD23R,2.550X2.550*%
%ADD24C,2.650*%
%ADD25R,2.650X2.650*%
%ADD26C,2.950*%
%ADD27R,2.950X2.950*%
%ADD28C,6.200*%
G01*
`;

  maskTopOpenings.forEach(m => {
    let ap = 'D20';
    if (m.size >= 6.0) ap = 'D28';
    else if (m.size >= 2.9) ap = m.shape === 'square' ? 'D27' : 'D26';
    else if (m.size >= 2.6) ap = m.shape === 'square' ? 'D25' : 'D24';
    else if (m.size >= 2.5) ap = m.shape === 'square' ? 'D23' : 'D22';
    else ap = m.shape === 'square' ? 'D21' : 'D20';

    out += `${ap}*\n${gPoint(m.x, m.y)}D03*\n`;
  });

  out += 'M02*\n';
  return out;
}

// 6. F_Silkscreen (Serigrafia Top)
function generateTopSilkscreen() {
  let out = `%FSLAX46Y46*%
%MOMM*%
%LPD*%
%ADD10C,0.150*%
%ADD11C,0.200*%
D10*
G01*
`;

  // Linhas de componentes
  silkTopLines.forEach(l => {
    out += `${gPoint(l.x1, l.y1)}D02*\n${gPoint(l.x2, l.y2)}D01*\n`;
  });

  out += 'M02*\n';
  return out;
}

// 7. B_Silkscreen (Serigrafia Bottom)
function generateBottomSilkscreen() {
  let out = `%FSLAX46Y46*%
%MOMM*%
%LPD*%
%ADD10C,0.150*%
D10*
G01*
${gPoint(10.0, 95.0)}D02*
${gPoint(90.0, 95.0)}D01*
M02*
`;
  return out;
}

// 8. NC Drill (Excellon Formato Padrão)
function generateDrillFile() {
  let out = `M48
; Gerado para Drybox 60L Pro Motherboard
; Brocas padronizadas:
METRIC,TZ
FMAT,2
T1C0.800
T2C1.000
T3C1.300
T4C3.200
%
G90
G05
`;

  ['T1', 'T2', 'T3', 'T4'].forEach(tool => {
    const subset = drills.filter(d => d.tool === tool);
    if (subset.length > 0) {
      out += `${tool}*\n`;
      subset.forEach(d => {
        const xStr = (d.x).toFixed(3).replace('.', '');
        const yStr = (d.y).toFixed(3).replace('.', '');
        out += `X${(d.x).toFixed(3)}Y${(d.y).toFixed(3)}*\n`;
      });
    }
  });

  out += 'M30\n';
  return out;
}

// Salva todos os arquivos Gerber na pasta pcb/gerber
fs.writeFileSync(path.join(OUTPUT_DIR, 'drybox_motherboard-Edge_Cuts.gbr'), generateEdgeCuts(), 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'drybox_motherboard-F_Cu.gtl'), generateTopCopper(), 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'drybox_motherboard-B_Cu.gbl'), generateBottomCopper(), 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'drybox_motherboard-F_Mask.gts'), generateTopMask(), 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'drybox_motherboard-B_Mask.gbs'), generateBottomMask(), 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'drybox_motherboard-F_Silkscreen.gto'), generateTopSilkscreen(), 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'drybox_motherboard-B_Silkscreen.gbo'), generateBottomSilkscreen(), 'utf8');
fs.writeFileSync(path.join(OUTPUT_DIR, 'drybox_motherboard.drl'), generateDrillFile(), 'utf8');

console.log('All Gerber files and drill file generated successfully in pcb/gerber!');
console.log('Total Pads:', pads.length, 'Total Drills:', drills.length, 'Total Tracks:', tracksTop.length + tracksBottom.length);
