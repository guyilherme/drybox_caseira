# Guia Completo de Fabricação da Placa PCB (Motherboard Shield) • Drybox 60L Pro

Este guia detalha o projeto da **placa de circuito impresso (PCB)** unificada para a **Drybox 60L Pro**, permitindo que você envie os arquivos diretamente para fabricação na **PCBWay**, **JLCPCB** ou fabricante equivalente.

Com esta placa, **toda a fiação solta do sistema é eliminada**: você solda apenas os bornes de parafuso e barras de pinos fêmea, e pluga diretamente o seu **ESP32-S3 DevKitC-1 N16R8**, o regulador **Step-Down LM2596** e os dois módulos **MOSFET HW-532**.

---

## 📁 Arquivos do Projeto Criados

Todos os arquivos estão organizados no repositório:

| Arquivo / Pasta | Descrição |
| :--- | :--- |
| **[`pcb/drybox_motherboard_gerber.zip`](pcb/drybox_motherboard_gerber.zip)** | **Arquivo ZIP pronto para envio direto à fábrica** (contém todos os arquivos Gerber RS-274X e furação Excellon `.drl`). |
| **[`placa_circuito_impresso.html`](placa_circuito_impresso.html)** | **Visualizador interativo em HTML/SVG** com inspeção de camadas (Top/Bottom Copper, Silkscreen, Pads), botão de download do ZIP com 1 clique e tabela de componentes. |
| **[`pcb/kicad/`](pcb/kicad/)** | Projeto completo no **KiCad 7/8** (`drybox_motherboard.kicad_pro`, `drybox_motherboard.kicad_pcb` e `drybox_motherboard.kicad_sch`). |
| **[`pcb/gerber/`](pcb/gerber/)** | Arquivos individuais Gerber descompactados (`.gtl`, `.gbl`, `.gts`, `.gbs`, `.gto`, `.gbo`, `.gbr`, `.drl`). |

---

## 📐 Especificações Técnicas da Placa

- **Dimensões:** `100.0 mm x 100.0 mm` *(Tamanho padrão que entra na faixa promocional de ~$5 por 5 placas na PCBWay e ~$2 na JLCPCB)*.
- **Número de Camadas:** 2 Camadas (Top Layer e Bottom Layer).
- **Material do Substrato:** FR-4 Standard (Tg 130–140°C).
- **Espessura da Placa:** `1.6 mm` (rígida, ideal para bornes de parafuso industriais).
- **Espessura de Cobre:** `1 oz` (35 µm).
- **Trilhas de Potência 24V:** `3,0 mm` de largura em **ambas as camadas em paralelo** (Top + Bottom), suportando com folga os 10A máximos do sistema.
- **Janelas de Máscara de Solda (Solder Mask Openings):** Aberturas de cobre exposto nas trilhas de potência para permitir estanhagem manual com ferro de solda, aumentando a capacidade para até 15A sem aquecimento.
- **Furação de Fixação:** 4 Furos M3 (diâmetro de 3,2 mm com pad metálico de 6,0 mm) localizados nos 4 cantos da placa: `(5, 5)`, `(95, 5)`, `(5, 95)` e `(95, 95)`.

---

## 🛒 Como Fazer o Pedido na PCBWay (Passo a Passo)

1. Acesse o site da **PCBWay** ([pcbway.com](https://www.pcbway.com/)) ou **JLCPCB** ([jlcpcb.com](https://jlcpcb.com/)).
2. Clique na aba **PCB Instant Quote** (Orçamento Rápido).
3. Clique no botão **"Add Gerber File"** (Adicionar Arquivo Gerber) e selecione o arquivo:
   ```text
   pcb/drybox_motherboard_gerber.zip
   ```
4. O sistema detectará automaticamente as dimensões **100 x 100 mm** e **2 camadas**.
5. Preencha os campos com os seguintes valores recomendados:

| Campo no Formulário | Seleção Recomendada | Justificativa |
| :--- | :--- | :--- |
| **Dimensions (Dimensões)** | `100 x 100 mm` | Detectado automaticamente pelo Gerber. |
| **Quantity (Quantidade)** | `5 pcs` (ou 10 pcs) | Quantidade mínima padrão promocional (~$5). |
| **Layers (Camadas)** | `2 Layers` | Cobre Superior e Inferior. |
| **Thickness (Espessura)** | `1.6 mm` | Padrão industrial rígido. |
| **Min Track / Spacing** | `6/6 mil` (padrão) | Nossas trilhas são bem mais largas (mínimo 15 mil nos sinais). |
| **Min Hole Size** | `0.3 mm` (padrão) | Nossos menores furos são 0,8 mm. |
| **Solder Mask (Cor da Placa)** | **Matte Black** (Preto Fosco) ou **Blue** (Azul) | Dá um acabamento premium profissional à sua Drybox. |
| **Silkscreen (Cor do Texto)** | **White** (Branco) | Melhor contraste e leitura da serigrafia técnica em português. |
| **Surface Finish (Acabamento)** | **HASL with lead** ou **HASL Lead-Free** | Banho de estanho com excelente molhabilidade para solda manual. |
| **Copper Weight** | **1 oz** | Suficiente graças às trilhas duplas reforçadas. |

6. Conclua o pedido e selecione o frete de sua preferência.

---

## 🔩 Lista de Componentes para Soldar na Placa (BOM)

Todos os componentes a serem soldados são **Through-Hole (PTH)** de fácil soldagem manual com ferro de solda comum:

| Ref | Descrição | Passo (Pitch) | Quantidade | Onde Encontrar / Modelo |
| :---: | :--- | :---: | :---: | :--- |
| **U1** | Barras de Pinos Fêmea 1x22 | 2,54 mm | 2 un | Para soquete do ESP32-S3 DevKitC-1 N16R8 |
| **U2** | Pinos Macho ou Espaçadores | 2,54 mm | 4 pinos | Para fixação e conexão dos 4 cantos do Step-Down LM2596 |
| **M1, M2** | Barras de Pinos ou Pads | 5,08 mm / 2,54 mm | 2 un | Para encaixar os 2 módulos MOSFET HW-532 (LR7843) |
| **F1** | Soquete de Fusível Lâmina PCB | 7,5 a 10 mm | 1 un | Modelo Keystone 3557, 3568 ou soquete automotivo PCB padrão |
| **J1 a J5** | Bornes de Parafuso 2 Vias (KF301 ou KF128) | 5,08 mm | 5 un | Entrada 24V, Aquecedor PTC, Termofusível 75°C, Fan PTC e Purga |
| **J6** | Barra de Pinos 1x14 (Fêmea ou Macho) | 2,54 mm | 1 un | Conector para o Display TFT 2.4" SPI com Touch Resistivo |
| **J7, J8** | Conectores JST-XH 4P ou Barras 1x4 | 2,54 mm | 2 un | Conectores para os 2 Sensores SHT31-D (0x44 e 0x45) |

---

## ⚡ Procedimento de Montagem e Testes de Bancada

> [!CAUTION]
> **REGRA DE OURO ANTES DE PLUGAR O ESP32-S3:**
> 1. Monte e solde todos os bornes e pinos na placa.
> 2. Plugue ou solde o módulo **Step-Down LM2596** nos ilhoses `U2`.
> 3. Conecte a fonte de 24V no borne `J1` (com fusível de 10A inserido no soquete `F1`).
> 4. Com um multímetro nos pinos de saída do Step-Down (ou no próprio voltímetro do módulo), **ajuste o trimpot azul até cravar exatamente 5.00V**.
> 5. **SOMENTE APÓS CONFIRMAR 5.00V**, desligue a fonte e plugue o microcontrolador **ESP32-S3** em seu soquete!

> [!WARNING]
> **BACKLIGHT DA TELA (PINO LED):**
> O pino 8 do conector `J6` (Display) já está roteado internamente na placa **diretamente para o barramento de 3.3V do ESP32**. Nunca tente jampear esse pino para a linha de 5V, pois isso queimaria os LEDs de iluminação da tela TFT.

> [!TIP]
> **TERMOFUSÍVEL DE 75°C (BORNE J3):**
> O borne `J3` fica em série com a resistência de 150W do PTC. Você passa um fio de silicone da placa até o termofusível parafusado na carcaça do aquecedor e retorna para o outro polo de `J3`. Caso queira testar a placa na bancada sem o aquecedor montado, basta colocar um pequeno jumper de fio fechando o borne `J3`.
