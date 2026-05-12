# 📦 DNR Control Center — EDSP Brasil

> Plataforma de gestão de casos DNR (Did Not Receive) para validação CTA ↔ Parceiros EDSP, alinhada ao SOP DNR-EDSP Brasil.

![Status](https://img.shields.io/badge/status-active-success)
![SOP](https://img.shields.io/badge/SOP-DNR--EDSP-blue)
![Mode](https://img.shields.io/badge/modes-CTA%20%7C%20Partner-orange)

## 🎯 Visão Geral

Dashboard HTML standalone para gestão completa do ciclo DNR:
- ✅ Validação CTA com checklist SOP item 12
- 🔶 Resposta de parceiros EDSP com upload de evidências
- 📊 Dashboard analítico (evolução, justificativas, responsabilidade)
- 🎯 Risk Score por DA (reincidência)
- 🚨 Loss Prevention automático (>40 pacotes ou >R$ 7.500)

## 🚀 Como Usar

### Opção 1 — Acesso Web (GitHub Pages)
Acesse: `https://SEU_USUARIO.github.io/dnr-control-center/`

### Opção 2 — Local
```bash
git clone https://github.com/SEU_USUARIO/dnr-control-center.git
cd dnr-control-center
# Abra index.html no navegador (Chrome/Edge recomendados)
```

## 🔄 Modos de Operação

| Modo | Acesso | Funcionalidades |
|------|--------|-----------------|
| 🔷 **CTA Mode** | Time interno Amazon | Validação completa, dashboard, LP, reincidência |
| 🔶 **Partner Mode** | EDSP Alpha, Beta, etc. | Apenas resposta aos casos atribuídos |

## 📋 Critérios SOP

### Prazos Críticos
- **7 dias** — Retorno EDSP (item 7)
- **2 dias** — Re-justificativa após devolução CTA (item 13)
- **15 dias** — Envio para Loss Prevention (item 15)
- **48h** — Reflexo de bloqueio pós-offboard

### Escalonamento (3 meses)
| Faixa | Ação |
|-------|------|
| 1-20 pacotes ou ≤R$ 7.500 | Treinamento |
| 21-40 pacotes ou ≤R$ 7.500 | Medida Disciplinar |
| >40 pacotes ou >R$ 7.500 | **Loss Prevention → Bloqueio** |

## 📊 Justificativas FlashRun

| Justificativa | Responsável |
|---------------|-------------|
| No DSP response | EDSP |
| Incorrect Delivery Location | EDSP |
| Missing Recipient Details | EDSP |
| Bad Actor | EDSP |
| Tossing Package | EDSP |
| DNR Over 30 Days | AMZL |
| Comm. Expired | AMZL |
| Incorrect Geolocation | AMZL |
| Successful DSP Justification | AMZL |

## 📤 Exportação

- 📊 **Excel completo** — 4 abas (Casos, Reincidência, LP, Critérios SOP)
- 📋 **CSV** — Dados tabulares
- 💾 **HTML standalone** — Dashboard portátil
- 📄 **LP Report** — Relatório Loss Prevention
- 🖨️ **PDF** — Via impressão

## 🔒 Segurança e Privacidade

⚠️ **NÃO COMMITAR:**
- Dados reais de Tracking IDs
- Nomes reais de DAs
- Valores financeiros reais
- Evidências (imagens) de casos

Use sempre dados anonimizados/sintéticos no repositório.

## 🛠️ Tech Stack

- HTML5 + CSS3 vanilla
- Plotly.js 2.27.0 (gráficos)
- SheetJS 0.20.1 (Excel I/O)
- Zero backend — funciona offline

## 👥 Contribuindo

1. Fork → Branch (`feat/sua-feature`)
2. Commit seguindo [Conventional Commits](https://www.conventionalcommits.org/)
3. Pull Request com descrição clara
4. Aguardar review do time CTA

## 📜 Licença

Uso interno Amazon — EDSP Brasil. Distribuição restrita.

## 📞 Contato

- **Owner:** Time CTA Brasil
- **SOP Reference:** DNR-EDSP Brasil v2025