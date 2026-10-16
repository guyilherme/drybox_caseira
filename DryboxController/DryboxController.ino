/*
 * =====================================================================================
 *  PROJETO: ESTUFA SECADORA INTELIGENTE DE FILAMENTOS 60L (DRYBOX ESP32)
 *  Versão: 3.0 (Display TFT 2.4" Touch ILI9341, Gauges Gráficos, Web SPA e PID)
 *  Microcontrolador: ESP32 DevKit V1 (30 / 38 pinos)
 * =====================================================================================
 * 
 *  Funcionalidades:
 *  - Display TFT LCD 2.4"/2.8" SPI (ILI9341 320x240) com 3 mostradores em arco (gauges)
 *    estilo Dry Fila Box (Temperatura °C, Umidade Relativa %UR, Umidade Absoluta g/m³)
 *  - Touchscreen Resistivo XPT2046 com botões na tela para PLA, PETG, Manutenção e Parada
 *  - Controle Térmico em Malha Fechada (PID) com corte preventivo de software (55°C)
 *  - Leitura Dupla de Umidade/Temperatura (SHT31 Interno 0x44 e Externo 0x45)
 *  - Cálculo de Umidade Absoluta (g/m³) via Equação de Magnus-Tetens
 *  - Algoritmo de Purga Inteligente: ativa ventoinhas se AH_in > AH_out + 1.5 g/m³
 *  - Interface Web Moderna SPA com atualização em tempo real via Fetch/AJAX (sem recarregar página)
 *  - Telemetria MQTT para Home Assistant / Node-RED
 * =====================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <XPT2046_Touchscreen.h>
#include <Adafruit_SHT31.h>
#include <math.h>

// =====================================================================================
//  1. CONFIGURAÇÕES DE REDE E TELEMETRIA (ALTERE CONFORME SUA REDE)
// =====================================================================================
const char* WIFI_SSID     = "SEU_WIFI_AQUI";
const char* WIFI_PASSWORD = "SUA_SENHA_AQUI";

// Configurações do Broker MQTT (opcional / Home Assistant)
const char* MQTT_BROKER    = "192.168.1.100";
const int   MQTT_PORT      = 1883;
const char* MQTT_TOPIC_PUB = "drybox/telemetria";

// =====================================================================================
//  2. PINAGEM DO HARDWARE E PWM LEDC
// =====================================================================================
#define PIN_PWM_PTC        25   // GPIO 25: Sinal PWM (LEDC) para MOSFET do Aquecedor PTC
#define PIN_PURGE_FAN      26   // GPIO 26: Sinal ON/OFF para MOSFET das Ventoinhas de Purga

#define PWM_FREQ           1000 // 1 kHz para chaveamento silencioso e frio no MOSFET
#define PWM_RESOLUTION     10   // Resolução de 10 bits (Duty Cycle de 0 a 1023)
#define PWM_CHANNEL        0    // Canal LEDC (para ESP32 Core v2.x)

// =====================================================================================
//  3. DISPLAY TFT LCD 2.4"/2.8" SPI (ILI9341) E TOUCH (XPT2046)
// =====================================================================================
// Barramento SPI de Hardware (VSPI do ESP32):
// MOSI -> GPIO 23 (TFT T_DIN / SDI)
// MISO -> GPIO 19 (TFT SDO / T_DO)
// SCK  -> GPIO 18 (TFT SCK / T_CLK)
#define TFT_CS             5    // GPIO 5: Chip Select do Display TFT
#define TFT_DC             4    // GPIO 4: Data/Command do Display TFT
#define TFT_RST            16   // GPIO 16: Reset do Display TFT (ou conectar ao EN/RST)
#define TOUCH_CS           27   // GPIO 27: Chip Select do Touch XPT2046

// Calibração do Touch Resistivo (ajuste conforme seu lote de display se necessário)
#define TS_MINX            250
#define TS_MAXX            3750
#define TS_MINY            300
#define TS_MAXY            3800

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);
XPT2046_Touchscreen touch(TOUCH_CS);
bool tftAtivo = false;
bool touchAtivo = false;

// Cores personalizadas para os mostradores (RGB565)
#define COR_ARCO_FUNDO     0x2104   // Cinza escuro para a trilha inativa do arco
#define COR_FUNDO_TELA     ILI9341_BLACK

// Sensores de Umidade e Temperatura I2C (SDA = 21, SCL = 22)
Adafruit_SHT31 sht_in  = Adafruit_SHT31(); // Endereço 0x44 (ADDR no GND)
Adafruit_SHT31 sht_out = Adafruit_SHT31(); // Endereço 0x45 (ADDR no 3.3V)
bool shtInOk = false;
bool shtOutOk = false;

// =====================================================================================
//  4. MÁQUINA DE ESTADOS E PARÂMETROS DE CONTROLE TÉRMICO
// =====================================================================================
enum EstadoSecador {
  ESTADO_PARADO,
  ESTADO_SECANDO,
  ESTADO_MANUTENCAO
};

EstadoSecador estadoAtual = ESTADO_PARADO;
String materialAtual = "Nenhum";

float setpointTemp = 0.0;
const float TEMP_LIMITE_SEGURANCA = 55.0; // Corte imediato preventivo de software
const float TEMP_MANUTENCAO       = 35.0; // Evita resfriamento rápido e condensação pós-ciclo

// Constantes do Algoritmo PID (Sintonizadas para o isolamento térmico de EPS 60L)
float Kp = 35.0;
float Ki = 0.08;
float Kd = 250.0;

float erroAcumulado = 0.0;
float ultimoErro = 0.0;
unsigned long ultimoCalculoPID = 0;
int pwmOutput = 0;

// Temporizadores de Ciclo
unsigned long tempoInicioCicloMs = 0;
unsigned long duracaoCicloMs     = 0;

// =====================================================================================
//  5. VARIÁVEIS DE LEITURA E PURGA
// =====================================================================================
float tempInterna = 0.0, humInterna = 0.0, ahInterna = 0.0;
float tempExterna = 0.0, humExterna = 0.0, ahExterna = 0.0;

bool purgaAtiva = false;
unsigned long purgaInicioMs     = 0;
unsigned long ultimoPurgaCheckMs = 0;
const unsigned long PURGA_DURACAO_MS  = 25000;   // 25 segundos de rajada de exaustão
const unsigned long PURGA_COOLDOWN_MS = 180000;  // 3 minutos de repouso mínimo entre purgas

// Servidores
WebServer server(80);
WiFiClient espClient;
PubSubClient mqttClient(espClient);
unsigned long ultimaTentativaMqtt = 0;

// =====================================================================================
//  6. CÁLCULO DE UMIDADE ABSOLUTA (MAGNUS-TETENS)
// =====================================================================================
/*
 * Retorna a massa de vapor d'água por metro cúbico de ar (g/m³).
 * T: Temperatura em °C
 * RH: Umidade Relativa em %
 */
float calcularUmidadeAbsoluta(float t, float rh) {
  if (isnan(t) || isnan(rh) || rh <= 0.0) return 0.0;
  // Pressão de vapor saturado (hPa)
  float e_sat = 6.112 * exp((17.62 * t) / (243.12 + t));
  // Pressão parcial de vapor real (hPa)
  float e_real = e_sat * (rh / 100.0);
  // Concentração mássica de vapor (g/m³)
  float ah = (216.7 * e_real) / (273.15 + t);
  return ah;
}

// =====================================================================================
//  7. CONTROLE TÉRMICO PID COM ANTI-WINDUP
// =====================================================================================
int calcularPID(float tempAtual) {
  if (estadoAtual == ESTADO_PARADO || setpointTemp <= 0.0) {
    erroAcumulado = 0.0;
    ultimoErro = 0.0;
    return 0;
  }

  unsigned long agora = millis();
  float dt = (agora - ultimoCalculoPID) / 1000.0;
  if (dt <= 0.0 || dt > 10.0) dt = 1.0;
  ultimoCalculoPID = agora;

  float erro = setpointTemp - tempAtual;

  // Termo Proporcional
  float P = Kp * erro;

  // Termo Integral com Janela Anti-Windup (só acumula dentro de ±4°C do setpoint)
  if (abs(erro) < 4.0) {
    erroAcumulado += erro * dt;
    erroAcumulado = constrain(erroAcumulado, -200.0, 200.0);
  } else {
    erroAcumulado = 0.0;
  }
  float I = Ki * erroAcumulado;

  // Termo Derivativo
  float D = Kd * ((erro - ultimoErro) / dt);
  ultimoErro = erro;

  float saida = P + I + D;
  return constrain((int)saida, 0, 1023);
}

// =====================================================================================
//  8. INTERFACE WEB HTML/CSS/JS MODERNA (RESPONSIVA, SEM RELOAD, DARK THEME)
// =====================================================================================
const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Drybox 60L Pro • Controle Térmico</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: #161b22;
      --card-border: #30363d;
      --text: #e6edf3;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --accent-pla: #1f6feb;
      --accent-petg: #8957e5;
      --success: #238636;
      --warning: #d29922;
      --danger: #da3633;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .header {
      width: 100%;
      max-width: 600px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--card-border);
    }
    .header h1 { font-size: 1.3rem; font-weight: 600; color: #fff; }
    .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-parado { background: #30363d; color: var(--text-muted); }
    .badge-secando { background: #238636; color: #fff; animation: pulse 2s infinite; }
    .badge-manutencao { background: #d29922; color: #fff; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .container { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 14px; }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .card-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
    }
    .grid-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      text-align: center;
    }
    .metric-box {
      background: #0d1117;
      padding: 10px 6px;
      border-radius: 8px;
      border: 1px solid #21262d;
    }
    .metric-label { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px; }
    .metric-val { font-size: 1.3rem; font-weight: 700; color: #fff; }
    .metric-unit { font-size: 0.75rem; font-weight: normal; color: var(--text-muted); }
    .val-temp { color: #f0883e; }
    .val-hum { color: #58a6ff; }
    .val-ah { color: #3fb950; }
    .progress-bar-bg {
      background: #21262d;
      border-radius: 6px;
      height: 10px;
      width: 100%;
      margin: 10px 0 6px 0;
      overflow: hidden;
    }
    .progress-bar-fill {
      background: linear-gradient(90deg, #1f6feb, #238636);
      height: 100%;
      width: 0%;
      transition: width 0.5s ease;
    }
    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #21262d;
      font-size: 0.85rem;
    }
    .status-row:last-child { border-bottom: none; }
    .tag {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .tag-on { background: #d29922; color: #000; }
    .tag-off { background: #21262d; color: var(--text-muted); }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
    .actions-full { grid-column: span 2; }
    button {
      padding: 12px;
      border-radius: 8px;
      border: none;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      color: #fff;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    button:active { transform: scale(0.98); }
    .btn-pla { background: var(--accent-pla); }
    .btn-petg { background: var(--accent-petg); }
    .btn-maint { background: #238636; }
    .btn-purge { background: #30363d; border: 1px solid #484f58; }
    .btn-stop { background: var(--danger); }
    .footer {
      margin-top: 16px;
      font-size: 0.7rem;
      color: var(--text-muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Drybox 60L Pro</h1>
      <span style="font-size: 0.75rem; color: var(--text-muted);">Controle Inteligente de Filamento</span>
    </div>
    <div id="statusBadge" class="status-badge badge-parado">Parado</div>
  </div>

  <div class="container">
    <!-- CÂMARA INTERNA -->
    <div class="card">
      <div class="card-title">
        <span>Câmara Interna (Isopor 60L)</span>
        <span id="targetDisplay">Alvo: --</span>
      </div>
      <div class="grid-metrics">
        <div class="metric-box">
          <div class="metric-label">TEMPERATURA</div>
          <div class="metric-val val-temp"><span id="tempIn">--</span><span class="metric-unit"> °C</span></div>
        </div>
        <div class="metric-box">
          <div class="metric-label">UMIDADE REL.</div>
          <div class="metric-val val-hum"><span id="humIn">--</span><span class="metric-unit"> %</span></div>
        </div>
        <div class="metric-box">
          <div class="metric-label">UMID. ABSOLUTA</div>
          <div class="metric-val val-ah"><span id="ahIn">--</span><span class="metric-unit"> g/m³</span></div>
        </div>
      </div>

      <!-- Barra de Progresso do Ciclo -->
      <div id="cycleProgressContainer" style="margin-top: 12px; display: none;">
        <div class="progress-bar-bg">
          <div id="progressBar" class="progress-bar-fill"></div>
        </div>
        <div class="progress-info">
          <span id="cycleTimeInfo">Progresso: 0 / 0 min</span>
          <span id="cyclePercent">0%</span>
        </div>
      </div>
    </div>

    <!-- AMBIENTE EXTERNO -->
    <div class="card">
      <div class="card-title">Ambiente Externo (Referência de Purga)</div>
      <div class="grid-metrics">
        <div class="metric-box">
          <div class="metric-label">TEMP. AMBIENTE</div>
          <div class="metric-val"><span id="tempOut">--</span><span class="metric-unit"> °C</span></div>
        </div>
        <div class="metric-box">
          <div class="metric-label">UMIDADE REL.</div>
          <div class="metric-val"><span id="humOut">--</span><span class="metric-unit"> %</span></div>
        </div>
        <div class="metric-box">
          <div class="metric-label">UMID. ABSOLUTA</div>
          <div class="metric-val"><span id="ahOut">--</span><span class="metric-unit"> g/m³</span></div>
        </div>
      </div>
    </div>

    <!-- ATUADORES & POTÊNCIA -->
    <div class="card">
      <div class="card-title">Atuadores & Malha PID</div>
      <div class="status-row">
        <span>Aquecedor Cerâmico PTC (24V)</span>
        <span style="font-weight: 600;"><span id="ptcPower">0</span>% PWM</span>
      </div>
      <div class="status-row">
        <span>Ventoinhas de Purga (Troca de Ar)</span>
        <span id="purgeTag" class="tag tag-off">DESLIGADAS</span>
      </div>
      <div class="status-row">
        <span>Gradiente de Secagem (AH_in - AH_out)</span>
        <span id="gradientDisplay" style="font-weight: 600;">-- g/m³</span>
      </div>
    </div>

    <!-- COMANDOS -->
    <div class="card">
      <div class="card-title">Ações e Controle de Ciclo</div>
      <div class="actions">
        <button class="btn-pla" onclick="enviarComando('start_pla')">🔥 Iniciar PLA (6h @ 50°C)</button>
        <button class="btn-petg" onclick="enviarComando('start_petg')">🔥 Iniciar PETG (10h @ 50°C)</button>
        <button class="btn-maint" onclick="enviarComando('maintain')">🛡️ Manutenção (35°C)</button>
        <button class="btn-purge" onclick="enviarComando('purge')">💨 Teste de Purga (25s)</button>
        <button class="btn-stop actions-full" onclick="enviarComando('stop')">🛑 PARADA DE EMERGÊNCIA / DESLIGAR</button>
      </div>
    </div>
  </div>

  <div class="footer">
    ESP32 Drybox Firmware v2.0 • SHT31 Duplo + PID Anti-Windup • 24V DC
  </div>

  <script>
    async function atualizarStatus() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const d = await res.json();

        // Valores internos
        document.getElementById('tempIn').innerText = d.temp_in.toFixed(1);
        document.getElementById('humIn').innerText = d.hum_in.toFixed(0);
        document.getElementById('ahIn').innerText = d.ah_in.toFixed(2);

        // Valores externos
        document.getElementById('tempOut').innerText = d.temp_out.toFixed(1);
        document.getElementById('humOut').innerText = d.hum_out.toFixed(0);
        document.getElementById('ahOut').innerText = d.ah_out.toFixed(2);

        // Atuadores
        document.getElementById('ptcPower').innerText = d.pwm;
        const purgeTag = document.getElementById('purgeTag');
        if (d.purge) {
          purgeTag.className = 'tag tag-on';
          purgeTag.innerText = 'PURGANDO (25s)';
        } else {
          purgeTag.className = 'tag tag-off';
          purgeTag.innerText = 'EM ESPERA';
        }

        // Gradiente
        const grad = (d.ah_in - d.ah_out).toFixed(2);
        document.getElementById('gradientDisplay').innerText = (grad > 0 ? '+' : '') + grad + ' g/m³';

        // Badge de Estado e Progresso
        const badge = document.getElementById('statusBadge');
        const progContainer = document.getElementById('cycleProgressContainer');
        const targetDisplay = document.getElementById('targetDisplay');

        if (d.state === 1) { // SECANDO
          badge.className = 'status-badge badge-secando';
          badge.innerText = 'SECANDO ' + d.mode;
          targetDisplay.innerText = 'Alvo: ' + d.target.toFixed(0) + '°C';
          progContainer.style.display = 'block';

          const pct = Math.min(100, Math.round((d.elapsed / d.total) * 100));
          document.getElementById('progressBar').style.width = pct + '%';
          document.getElementById('cyclePercent').innerText = pct + '%';
          document.getElementById('cycleTimeInfo').innerText = 'Tempo: ' + d.elapsed + ' / ' + d.total + ' min';
        } else if (d.state === 2) { // MANUTENCAO
          badge.className = 'status-badge badge-manutencao';
          badge.innerText = 'MODO MANUTENÇÃO';
          targetDisplay.innerText = 'Alvo: 35°C';
          progContainer.style.display = 'none';
        } else { // PARADO
          badge.className = 'status-badge badge-parado';
          badge.innerText = 'PARADO';
          targetDisplay.innerText = 'Alvo: Desligado';
          progContainer.style.display = 'none';
        }
      } catch (e) {
        console.error('Falha na conexão:', e);
      }
    }

    async function enviarComando(cmd) {
      try {
        await fetch('/api/action?cmd=' + cmd);
        setTimeout(atualizarStatus, 200);
      } catch (e) {
        alert('Erro ao enviar comando: ' + e);
      }
    }

    // Polling contínuo sem refresh da página (1.5 segundos)
    setInterval(atualizarStatus, 1500);
    atualizarStatus();
  </script>
</body>
</html>
)rawliteral";

// =====================================================================================
//  9. ROTAS DO SERVIDOR WEB
// =====================================================================================
void handleRoot() {
  server.send_P(200, "text/html", INDEX_HTML);
}

void handleStatusJson() {
  unsigned long decorridoMin = 0;
  unsigned long totalMin = 0;
  if (estadoAtual == ESTADO_SECANDO && duracaoCicloMs > 0) {
    decorridoMin = (millis() - tempoInicioCicloMs) / 60000;
    totalMin     = duracaoCicloMs / 60000;
  }

  char json[350];
  snprintf(json, sizeof(json),
    "{\"state\":%d,\"mode\":\"%s\",\"target\":%.1f,\"temp_in\":%.1f,\"hum_in\":%.1f,\"ah_in\":%.2f,"
    "\"temp_out\":%.1f,\"hum_out\":%.1f,\"ah_out\":%.2f,\"pwm\":%d,\"purge\":%s,\"elapsed\":%lu,\"total\":%lu}",
    (int)estadoAtual,
    materialAtual.c_str(),
    setpointTemp,
    tempInterna,
    humInterna,
    ahInterna,
    tempExterna,
    humExterna,
    ahExterna,
    (pwmOutput * 100) / 1023,
    purgaAtiva ? "true" : "false",
    decorridoMin,
    totalMin
  );
  server.send(200, "application/json", json);
}

void iniciarCicloPLA() {
  materialAtual = "PLA";
  setpointTemp = 50.0;
  tempoInicioCicloMs = millis();
  duracaoCicloMs = (unsigned long)6 * 3600 * 1000; // 6 Horas
  erroAcumulado = 0.0;
  estadoAtual = ESTADO_SECANDO;
  Serial.println(F("[COMANDO] Ciclo PLA iniciado (6h @ 50C)"));
}

void iniciarCicloPETG() {
  materialAtual = "PETG";
  setpointTemp = 50.0;
  tempoInicioCicloMs = millis();
  duracaoCicloMs = (unsigned long)10 * 3600 * 1000; // 10 Horas
  erroAcumulado = 0.0;
  estadoAtual = ESTADO_SECANDO;
  Serial.println(F("[COMANDO] Ciclo PETG iniciado (10h @ 50C)"));
}

void iniciarManutencao() {
  materialAtual = "Manutencao";
  setpointTemp = TEMP_MANUTENCAO;
  erroAcumulado = 0.0;
  estadoAtual = ESTADO_MANUTENCAO;
  Serial.println(F("[COMANDO] Modo Manutencao iniciado (35C)"));
}

void dispararPurgaManual() {
  digitalWrite(PIN_PURGE_FAN, HIGH);
  purgaAtiva = true;
  purgaInicioMs = millis();
  Serial.println(F("[COMANDO] Purga manual acionada (25s)"));
}

void pararSistema() {
  estadoAtual = ESTADO_PARADO;
  setpointTemp = 0.0;
  pwmOutput = 0;
  digitalWrite(PIN_PURGE_FAN, LOW);
  purgaAtiva = false;
  materialAtual = "Nenhum";
  Serial.println(F("[COMANDO] Sistema PARADO."));
}

void handleAction() {
  if (server.hasArg("cmd")) {
    String cmd = server.arg("cmd");
    if (cmd == "start_pla") {
      iniciarCicloPLA();
    } else if (cmd == "start_petg") {
      iniciarCicloPETG();
    } else if (cmd == "maintain") {
      iniciarManutencao();
    } else if (cmd == "purge") {
      dispararPurgaManual();
    } else if (cmd == "stop") {
      pararSistema();
    }
  }
  server.send(200, "text/plain", "OK");
}

// =====================================================================================
//  10. INTERFACE NO DISPLAY TFT LCD 2.4"/2.8" SPI (ILI9341 320x240) COM TOUCH
// =====================================================================================
static float lastAngTemp = 135.0f;
static float lastAngUR   = 135.0f;
static float lastAngAH   = 135.0f;

// Desenha fatia de arco circular (de angStart a angEnd em graus)
void desenharSegmentoArco(int cx, int cy, int rIn, int rOut, float angStart, float angEnd, uint16_t cor) {
  if (angEnd < angStart) return;
  for (float a = angStart; a <= angEnd; a += 1.2f) {
    float rad = a * 0.0174532925f; // grau para radiano
    float cosA = cos(rad);
    float sinA = sin(rad);
    int x0 = cx + (int)(rIn * cosA);
    int y0 = cy + (int)(rIn * sinA);
    int x1 = cx + (int)(rOut * cosA);
    int y1 = cy + (int)(rOut * sinA);
    tft.drawLine(x0, y0, x1, y1, cor);
  }
}

// Desenha os 4 botões touch estilizados na parte inferior
void desenharBotoesTouch() {
  // Botão 1: PLA 6h
  tft.fillRoundRect(6, 175, 72, 55, 6, 0x0200);
  tft.drawRoundRect(6, 175, 72, 55, 6, ILI9341_GREEN);
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_WHITE, 0x0200);
  tft.setCursor(22, 185);
  tft.print(F("PLA"));
  tft.setTextSize(1);
  tft.setTextColor(ILI9341_GREEN, 0x0200);
  tft.setCursor(12, 208);
  tft.print(F("6h @ 50C"));

  // Botão 2: PETG 10h
  tft.fillRoundRect(84, 175, 72, 55, 6, 0x4100);
  tft.drawRoundRect(84, 175, 72, 55, 6, ILI9341_ORANGE);
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_WHITE, 0x4100);
  tft.setCursor(95, 185);
  tft.print(F("PETG"));
  tft.setTextSize(1);
  tft.setTextColor(ILI9341_ORANGE, 0x4100);
  tft.setCursor(88, 208);
  tft.print(F("10h @ 50C"));

  // Botão 3: MANUT 35°
  tft.fillRoundRect(162, 175, 72, 55, 6, 0x0012);
  tft.drawRoundRect(162, 175, 72, 55, 6, ILI9341_CYAN);
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_WHITE, 0x0012);
  tft.setCursor(168, 185);
  tft.print(F("MANUT"));
  tft.setTextSize(1);
  tft.setTextColor(ILI9341_CYAN, 0x0012);
  tft.setCursor(168, 208);
  tft.print(F("35C Cont."));

  // Botão 4: PARAR
  tft.fillRoundRect(240, 175, 74, 55, 6, 0x4000);
  tft.drawRoundRect(240, 175, 74, 55, 6, ILI9341_RED);
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_WHITE, 0x4000);
  tft.setCursor(248, 185);
  tft.print(F("PARAR"));
  tft.setTextSize(1);
  tft.setTextColor(ILI9341_RED, 0x4000);
  tft.setCursor(252, 208);
  tft.print(F("Desligar"));
}

void destacarBotao(int x, int y, int w, int h) {
  tft.drawRoundRect(x, y, w, h, 6, ILI9341_WHITE);
  delay(70);
  desenharBotoesTouch();
}

// Desenha o layout base (molduras, títulos, trilhas dos arcos e botões)
void desenharLayoutEstatico() {
  if (!tftAtivo) return;

  tft.fillScreen(COR_FUNDO_TELA);

  // Cabeçalho Principal (Estilo Dry Fila Box)
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_YELLOW, COR_FUNDO_TELA);
  tft.setCursor(55, 6);
  tft.print(F("Dry Fila Box 60L"));

  tft.setTextSize(1);
  tft.setTextColor(ILI9341_LIGHTGREY, COR_FUNDO_TELA);
  tft.setCursor(85, 24);
  if (WiFi.status() == WL_CONNECTED) {
    tft.print(F("IP: "));
    tft.print(WiFi.localIP().toString());
  } else {
    tft.print(F("Conectando ao Wi-Fi..."));
  }
  tft.drawLine(0, 34, 320, 34, 0x39E7);

  // Rótulos e Unidades dos 3 Mostradores
  // Mostrador 1: Temperatura
  tft.setTextSize(1);
  tft.setTextColor(ILI9341_CYAN, COR_FUNDO_TELA);
  tft.setCursor(20, 40);
  tft.print(F("Temperatura"));
  tft.setTextColor(ILI9341_LIGHTGREY, COR_FUNDO_TELA);
  tft.setCursor(48, 51);
  tft.print(F("*C"));
  tft.setTextColor(ILI9341_GREEN, COR_FUNDO_TELA);
  tft.setCursor(22, 134);
  tft.print(F("0"));
  tft.setCursor(76, 134);
  tft.print(F("50"));

  // Mostrador 2: Umidade Relativa (%UR)
  tft.setTextColor(ILI9341_CYAN, COR_FUNDO_TELA);
  tft.setCursor(128, 40);
  tft.print(F("Umidade R."));
  tft.setTextColor(ILI9341_LIGHTGREY, COR_FUNDO_TELA);
  tft.setCursor(154, 51);
  tft.print(F("R%"));
  tft.setTextColor(ILI9341_CYAN, COR_FUNDO_TELA);
  tft.setCursor(125, 134);
  tft.print(F("0"));
  tft.setCursor(178, 134);
  tft.print(F("100"));

  // Mostrador 3: Umidade Absoluta (g/m³)
  tft.setTextColor(ILI9341_CYAN, COR_FUNDO_TELA);
  tft.setCursor(236, 40);
  tft.print(F("Umidade A."));
  tft.setTextColor(ILI9341_LIGHTGREY, COR_FUNDO_TELA);
  tft.setCursor(256, 51);
  tft.print(F("g/m3"));
  tft.setTextColor(ILI9341_MAGENTA, COR_FUNDO_TELA);
  tft.setCursor(232, 134);
  tft.print(F("0"));
  tft.setCursor(288, 134);
  tft.print(F("80"));

  // Desenha as trilhas completas dos arcos (135° a 405° = 270°)
  desenharSegmentoArco(54, 94, 27, 36, 135.0f, 405.0f, COR_ARCO_FUNDO);
  desenharSegmentoArco(160, 94, 27, 36, 135.0f, 405.0f, COR_ARCO_FUNDO);
  desenharSegmentoArco(266, 94, 27, 36, 135.0f, 405.0f, COR_ARCO_FUNDO);

  // Linha separadora do rodapé de status
  tft.drawLine(0, 148, 320, 148, 0x39E7);

  // Desenha os 4 botões touch
  desenharBotoesTouch();

  // Reinicia os ponteiros de ângulo
  lastAngTemp = 135.0f;
  lastAngUR   = 135.0f;
  lastAngAH   = 135.0f;
}

// Atualização dinâmica sem piscar a tela
void atualizarDisplayTFT() {
  if (!tftAtivo) return;

  char buf[12];

  // 1. GAUGE TEMPERATURA (0 a 50°C)
  float tVal = constrain(tempInterna, 0.0f, 50.0f);
  float targetAngTemp = 135.0f + (tVal / 50.0f) * 270.0f;
  if (abs(targetAngTemp - lastAngTemp) >= 1.0f) {
    if (targetAngTemp > lastAngTemp) {
      desenharSegmentoArco(54, 94, 27, 36, lastAngTemp, targetAngTemp, ILI9341_GREEN);
    } else {
      desenharSegmentoArco(54, 94, 27, 36, targetAngTemp, lastAngTemp, COR_ARCO_FUNDO);
    }
    lastAngTemp = targetAngTemp;
  }
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_GREEN, COR_FUNDO_TELA);
  dtostrf(tempInterna, 4, 1, buf);
  tft.setCursor(30, 87);
  tft.print(buf);

  // 2. GAUGE UMIDADE RELATIVA (0 a 100%)
  float urVal = constrain(humInterna, 0.0f, 100.0f);
  float targetAngUR = 135.0f + (urVal / 100.0f) * 270.0f;
  if (abs(targetAngUR - lastAngUR) >= 1.0f) {
    if (targetAngUR > lastAngUR) {
      desenharSegmentoArco(160, 94, 27, 36, lastAngUR, targetAngUR, ILI9341_CYAN);
    } else {
      desenharSegmentoArco(160, 94, 27, 36, targetAngUR, lastAngUR, COR_ARCO_FUNDO);
    }
    lastAngUR = targetAngUR;
  }
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_CYAN, COR_FUNDO_TELA);
  dtostrf(humInterna, 4, 1, buf);
  tft.setCursor(136, 87);
  tft.print(buf);

  // 3. GAUGE UMIDADE ABSOLUTA (0 a 80 g/m³)
  float ahVal = constrain(ahInterna, 0.0f, 80.0f);
  float targetAngAH = 135.0f + (ahVal / 80.0f) * 270.0f;
  if (abs(targetAngAH - lastAngAH) >= 1.0f) {
    if (targetAngAH > lastAngAH) {
      desenharSegmentoArco(266, 94, 27, 36, lastAngAH, targetAngAH, ILI9341_MAGENTA);
    } else {
      desenharSegmentoArco(266, 94, 27, 36, targetAngAH, lastAngAH, COR_ARCO_FUNDO);
    }
    lastAngAH = targetAngAH;
  }
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_MAGENTA, COR_FUNDO_TELA);
  dtostrf(ahInterna, 4, 1, buf);
  tft.setCursor(242, 87);
  tft.print(buf);

  // 4. LINHA DE STATUS INFORMATIVO (Y = 156)
  tft.setTextSize(1);
  tft.setTextColor(ILI9341_YELLOW, COR_FUNDO_TELA);
  tft.setCursor(8, 156);
  tft.printf("Temp. Alvo: %2.0f*C  |  Modo: %-5s  |  PTC: %3d%%  |  Purga: %s  ",
             setpointTemp, materialAtual.c_str(), (pwmOutput * 100) / 1023, purgaAtiva ? "ON " : "OFF");
}

// Leitura contínua dos toques na tela (debounced)
void processarTouch() {
  if (!touchAtivo || !touch.touched()) return;

  static unsigned long lastTouchTime = 0;
  if (millis() - lastTouchTime < 350) return; // Debounce 350ms

  TS_Point p = touch.getPoint();
  if (p.z < 250) return;

  // Converte coordenadas brutas (0..4095) para resolução da tela (320x240)
  int tx = map(p.x, TS_MINX, TS_MAXX, 0, 320);
  int ty = map(p.y, TS_MINY, TS_MAXY, 0, 240);
  tx = constrain(tx, 0, 319);
  ty = constrain(ty, 0, 239);

  // Zona dos botões inferiores (Y: 175 a 230)
  if (ty >= 175 && ty <= 230) {
    lastTouchTime = millis();

    if (tx >= 6 && tx <= 78) {
      iniciarCicloPLA();
      destacarBotao(6, 175, 72, 55);
    } else if (tx >= 84 && tx <= 156) {
      iniciarCicloPETG();
      destacarBotao(84, 175, 72, 55);
    } else if (tx >= 162 && tx <= 234) {
      iniciarManutencao();
      destacarBotao(162, 175, 72, 55);
    } else if (tx >= 240 && tx <= 314) {
      pararSistema();
      destacarBotao(240, 175, 74, 55);
    }
  }
}

// =====================================================================================
//  11. RECONEXÃO MQTT NÃO-BLOQUEANTE
// =====================================================================================
void verificarMqtt() {
  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
    unsigned long agora = millis();
    if (agora - ultimaTentativaMqtt > 10000) {
      ultimaTentativaMqtt = agora;
      if (mqttClient.connect("Drybox60L_ESP32")) {
        Serial.println(F("[MQTT] Conectado com sucesso ao Broker!"));
      }
    }
  }
}

// =====================================================================================
//  12. SETUP GERAL
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println(F("\n--- INICIALIZANDO SECADOR INTELIGENTE DRYBOX 60L ---"));

  // Configuração dos Pinos dos Atuadores
  pinMode(PIN_PURGE_FAN, OUTPUT);
  digitalWrite(PIN_PURGE_FAN, LOW);

  // Configuração do PWM LEDC para o Aquecedor PTC
  #if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
    ledcAttach(PIN_PWM_PTC, PWM_FREQ, PWM_RESOLUTION);
  #else
    ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
    ledcAttachPin(PIN_PWM_PTC, PWM_CHANNEL);
  #endif

  // Barramento I2C para os Sensores SHT31 (SDA = 21, SCL = 22)
  Wire.begin(21, 22);

  // Inicializa Barramento SPI de Hardware e Display TFT 2.4"
  SPI.begin(18, 19, 23, 5); // SCK, MISO, MOSI, SS
  tft.begin();
  tft.setRotation(1); // Modo Paisagem (320x240)
  tftAtivo = true;

  // Inicializa Touchscreen XPT2046
  if (touch.begin()) {
    touch.setRotation(1);
    touchAtivo = true;
    Serial.println(F("[TFT] Touchscreen XPT2046 inicializado com sucesso!"));
  } else {
    Serial.println(F("[AVISO] Touchscreen XPT2046 nao respondeu."));
  }

  // Desenha a interface estática inicial com arcos e botões
  desenharLayoutEstatico();

  // Inicializa Sensores SHT31
  shtInOk = sht_in.begin(0x44);
  if (!shtInOk) Serial.println(F("[ERRO] Sensor SHT31 Interno (0x44) ausente!"));

  shtOutOk = sht_out.begin(0x45);
  if (!shtOutOk) Serial.println(F("[ERRO] Sensor SHT31 Externo (0x45) ausente!"));

  // Inicializa Conexão Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print(F("[WIFI] Conectando a "));
  Serial.println(WIFI_SSID);

  // Inicia Rotas HTTP
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, handleStatusJson);
  server.on("/api/action", HTTP_GET, handleAction);
  server.begin();
  Serial.println(F("[HTTP] Servidor Web iniciado na porta 80."));

  // Configuração MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
}

// =====================================================================================
//  13. LOOP PRINCIPAL
// =====================================================================================
void loop() {
  server.handleClient();
  verificarMqtt();
  if (mqttClient.connected()) mqttClient.loop();
  processarTouch();

  unsigned long currentMillis = millis();

  // 1. LEITURA DOS SENSORES (a cada 1 segundo)
  static unsigned long lastSensorRead = 0;
  if (currentMillis - lastSensorRead >= 1000) {
    lastSensorRead = currentMillis;

    if (shtInOk) {
      tempInterna = sht_in.readTemperature();
      humInterna  = sht_in.readHumidity();
    }
    if (shtOutOk) {
      tempExterna = sht_out.readTemperature();
      humExterna  = sht_out.readHumidity();
    }

    ahInterna = calcularUmidadeAbsoluta(tempInterna, humInterna);
    ahExterna = calcularUmidadeAbsoluta(tempExterna, humExterna);
  }

  // 2. MÁQUINA DE ESTADOS E CONTROLE DE TEMPO DE CICLO
  if (estadoAtual == ESTADO_SECANDO) {
    if (currentMillis - tempoInicioCicloMs >= duracaoCicloMs) {
      // Ciclo concluído: migra automaticamente para modo de manutenção (35°C)
      // para evitar que o ar frio condense umidade de volta nos carretéis
      iniciarManutencao();
    }
  }

  // 3. SEGURANÇA E CONTROLE TÉRMICO (FAILSAFE DE SOFTWARE)
  // Se a temperatura do sensor passar de 55°C ou o sensor falhar (NaN), corta o PWM imediatamente
  if (isnan(tempInterna) || tempInterna >= TEMP_LIMITE_SEGURANCA || estadoAtual == ESTADO_PARADO) {
    pwmOutput = 0;
  } else {
    pwmOutput = calcularPID(tempInterna);
  }

  // Aplicação do PWM no Hardware
  #if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
    ledcWrite(PIN_PWM_PTC, pwmOutput);
  #else
    ledcWrite(PWM_CHANNEL, pwmOutput);
  #endif

  // 4. LÓGICA DE PURGA INTELIGENTE (VENTOINHAS DE EXAUSTÃO/ADMISSÃO)
  if (purgaAtiva) {
    if (currentMillis - purgaInicioMs >= PURGA_DURACAO_MS) {
      digitalWrite(PIN_PURGE_FAN, LOW);
      purgaAtiva = false;
      ultimoPurgaCheckMs = currentMillis; // Inicia cooldown
      Serial.println(F("[PURGA] Rajada concluida. Ventoinhas desligadas."));
    }
  } else {
    // Só purga se:
    // a) Estiver em ciclo ativo de secagem
    // b) Caixa já estiver aquecida acima de 42°C (evita expulsar calor durante o aquecimento inicial)
    // c) Fora do cooldown mínimo de 3 minutos
    // d) O ar interno estiver saturado em relação ao externo (AH_in > AH_out + 1.5 g/m³)
    if (estadoAtual == ESTADO_SECANDO && 
        tempInterna >= 42.0 && 
        (currentMillis - ultimoPurgaCheckMs >= PURGA_COOLDOWN_MS)) {
      
      if (ahInterna > (ahExterna + 1.5)) {
        digitalWrite(PIN_PURGE_FAN, HIGH);
        purgaAtiva = true;
        purgaInicioMs = currentMillis;
        Serial.println(F("[PURGA] Ar saturado detectado! Iniciando troca rapida de 25s."));
      }
    }
  }

  // 5. ATUALIZAÇÃO DO DISPLAY TFT E TELEMETRIA MQTT (a cada 1 segundo)
  static unsigned long lastDisplayTelemetry = 0;
  if (currentMillis - lastDisplayTelemetry >= 1000) {
    lastDisplayTelemetry = currentMillis;
    atualizarDisplayTFT();

    if (mqttClient.connected()) {
      char payload[220];
      snprintf(payload, sizeof(payload),
        "{\"modo\":\"%s\",\"temp_in\":%.1f,\"hum_in\":%.1f,\"ah_in\":%.2f,"
        "\"temp_out\":%.1f,\"hum_out\":%.1f,\"ah_out\":%.2f,\"pwm\":%d,\"purga\":%d}",
        materialAtual.c_str(),
        tempInterna, humInterna, ahInterna,
        tempExterna, humExterna, ahExterna,
        (pwmOutput * 100) / 1023,
        purgaAtiva ? 1 : 0
      );
      mqttClient.publish(MQTT_TOPIC_PUB, payload);
    }
  }
}
