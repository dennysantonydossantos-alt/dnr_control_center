/**
 * DNR Control Center - App Module
 * Lógica principal, navegação e renderização
 */

'use strict';

const App = {
    currentMode: 'cta',
    expandedCases: new Set(),

    // ═══ INICIALIZAÇÃO ═══
    init: function() {
        Storage.load();
        this.renderTable();
        console.log('✅ DNR Control Center v2.0 initialized');
    },

    // ═══ MODO ═══
    toggleMode: function() {
        this.currentMode = this.currentMode === 'cta' ? 'partner' : 'cta';
        document.body.classList.toggle('partner-mode', this.currentMode === 'partner');
        document.getElementById('mainHeader').classList.toggle('partner-mode', this.currentMode === 'partner');
        document.getElementById('modeBadge').textContent = this.currentMode === 'cta' ? 'CTA Mode' : 'Parceiro EDSP';

        if (this.currentMode === 'partner') {
            this.showView('cases', document.querySelector('.tab'));
        }
        this.renderTable();
        Utils.notify(this.currentMode === 'cta' ? '🔷 Modo CTA ativado' : '🔶 Modo Parceiro EDSP ativado');
    },

    // ═══ NAVEGAÇÃO ═══
    showView: function(id, btn) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById('view-' + id).classList.add('active');
        btn.classList.add('active');

        if (id === 'dashboard') setTimeout(() => Charts.render(), 100);
        if (id === 'recurrence') this.renderRecurrence();
        if (id === 'lp') this.renderLP();
    },

    // ═══ TABELA PRINCIPAL ═══
    renderTable: function() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const status = document.getElementById('filterStatus').value;
        const partner = document.getElementById('filterPartner').value;

        // Update partner filter options
        const partnerSelect = document.getElementById('filterPartner');
        const currentPartner = partnerSelect.value;
        const partners = [...new Set(D.map(c => c.partner))];
        partnerSelect.innerHTML = '<option value="">Todos os parceiros</option>' +
            partners.map(p => `<option value="${p}" ${p === currentPartner ? 'selected' : ''}>${p}</option>`).join('');

        const filtered = D.filter(c => {
            if (search && !(c.trackingId.toLowerCase().includes(search) || c.da.toLowerCase().includes(search) || c.station.toLowerCase().includes(search))) return false;
            if (status && c.status !== status) return false;
            if (partner && c.partner !== partner) return false;
            return true;
        });

        const tbody = document.getElementById('casesBody');
        tbody.innerHTML = filtered.map(c => {
            const days = Utils.daysSince(c.date);
            const overdueClass = days > 7 && c.status !== 'done' ? 'overdue' : '';
            const isExpanded = this.expandedCases.has(c.id);

            return `
                <tr class="${overdueClass}">
                    <td><button class="expand-btn" onclick="App.toggleExpand('${c.id}')">${isExpanded ? '▼' : '▶'}</button></td>
                    <td><input class="editable" value="${c.trackingId}" onchange="App.updateField('${c.id}','trackingId',this.value)"></td>
                    <td><input class="editable" value="${c.da}" onchange="App.updateField('${c.id}','da',this.value)"></td>
                    <td><input class="editable" value="${c.station}" onchange="App.updateField('${c.id}','station',this.value)"></td>
                    <td><input class="editable" value="${c.partner}" onchange="App.updateField('${c.id}','partner',this.value)"></td>
                    <td><input class="editable" value="${c.date}" onchange="App.updateField('${c.id}','date',this.value)" style="width:90px"></td>
                    <td style="font-weight:600;color:${c.value > 1000 ? '#E74C3C' : '#2C3744'}">${Utils.fmt(c.value)}</td>
                    <td><span class="status-badge status-${c.status}">${Utils.statusLabel(c.status)}</span></td>
                    <td class="partner-hide">${c.justification || '<span style="color:#95A5A6">—</span>'}</td>
                    <td class="partner-hide">${c.responsibility ? `<span class="resp-badge resp-${c.responsibility.toLowerCase()}">${c.responsibility}</span>` : '—'}</td>
                    <td style="text-align:center;font-weight:700;color:${days > 7 ? '#E74C3C' : days > 5 ? '#F39C12' : '#2ECC71'}">${days}d</td>
                    <td class="partner-hide"><button class="btn btn-sm btn-danger" onclick="App.deleteCase('${c.id}')">🗑️</button></td>
                </tr>
                ${isExpanded ? `<tr class="detail-row"><td colspan="12"><div class="detail-content">${this.renderDetail(c)}</div></td></tr>` : ''}
            `;
        }).join('');

        this.updateKPIs();
    },

    // ═══ DETAIL PANEL ═══
    renderDetail: function(c) {
        const checkLabels = { geo: 'Geolocalização', recipient: 'Recebedor', daNote: 'Nota DA', call: 'Ligação' };

        return `
            <div class="detail-grid">
                <div class="detail-section section-edsp">
                    <div class="section-title">🔶 Resposta Parceiro EDSP</div>
                    <div class="form-row">
                        <label class="form-label">É DNR devido?</label>
                        <select class="form-select" onchange="App.updateEDSP('${c.id}','isDue',this.value)">
                            <option value="">Selecione...</option>
                            <option ${c.edspResponse.isDue === 'Sim' ? 'selected' : ''}>Sim</option>
                            <option ${c.edspResponse.isDue === 'Não' ? 'selected' : ''}>Não</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Detalhamento</label>
                        <textarea class="form-textarea" onchange="App.updateEDSP('${c.id}','detail',this.value)" placeholder="Descreva o que aconteceu...">${c.edspResponse.detail || ''}</textarea>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Ações tomadas pela base</label>
                        <textarea class="form-textarea" onchange="App.updateEDSP('${c.id}','actions',this.value)" placeholder="Ex: treinamento, advertência, desligamento...">${c.edspResponse.actions || ''}</textarea>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Evidências (imagens)</label>
                        <label class="upload-zone">
                            <input type="file" multiple accept="image/*" onchange="App.uploadImages('${c.id}',this.files)">
                            📎 Clique para anexar ou arraste imagens aqui
                        </label>
                        <div class="image-preview">${(c.edspResponse.images || []).map(img => `<img src="${img}" onclick="window.open('${img}')">`).join('')}</div>
                    </div>
                    <button class="btn btn-warning" onclick="App.submitEDSP('${c.id}')">✅ Enviar Resposta</button>
                    ${c.edspResponse.timestamp ? `<div style="font-size:11px;color:#5C7A99;margin-top:8px">Enviado em: ${c.edspResponse.timestamp}</div>` : ''}
                </div>

                <div class="detail-section section-cta partner-hide">
                    <div class="section-title">🔷 Validação CTA</div>
                    <div class="form-row">
                        <label class="form-label">Checklist SOP item 12</label>
                        <div class="check-grid">
                            ${Object.entries(checkLabels).map(([k, label]) => {
                                const v = c.ctaValidation[k];
                                return `<div class="check-item ${v}" onclick="App.toggleCheck('${c.id}','${k}')">${label} <strong>${v === 'ok' ? '✓ OK' : v === 'nok' ? '✗ NOK' : '—'}</strong></div>`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Justificativa (FlashRun)</label>
                        <select class="form-select" onchange="App.updateField('${c.id}','justification',this.value);App.updateResponsibility('${c.id}')">
                            <option value="">Selecione...</option>
                            ${Object.keys(JUSTIFICATIONS).map(j => `<option ${c.justification === j ? 'selected' : ''}>${j}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Veredito Final</label>
                        <div class="check-grid">
                            <div class="check-item ${c.ctaValidation.verdict === 'OK' ? 'ok' : ''}" onclick="App.setVerdict('${c.id}','OK')">OK <strong>${c.ctaValidation.verdict === 'OK' ? '✓' : ''}</strong></div>
                            <div class="check-item ${c.ctaValidation.verdict === 'NOK' ? 'nok' : ''}" onclick="App.setVerdict('${c.id}','NOK')">NOK <strong>${c.ctaValidation.verdict === 'NOK' ? '✓' : ''}</strong></div>
                        </div>
                    </div>
                    <div class="form-row">
                        <label class="form-label">Observações</label>
                        <textarea class="form-textarea" onchange="App.updateCTA('${c.id}','notes',this.value)">${c.ctaValidation.notes || ''}</textarea>
                    </div>
                    <div style="display:flex;gap:8px">
                        <button class="btn btn-success" onclick="App.submitCTA('${c.id}')">✅ Finalizar Caso</button>
                        <button class="btn btn-warning" onclick="App.returnToEDSP('${c.id}')">↩️ Devolver EDSP (2d)</button>
                    </div>
                </div>
            </div>

            <div style="margin-top:20px;background:white;padding:15px;border-radius:10px">
                <div class="section-title" style="color:#2C3744">📜 Linha do Tempo</div>
                <div class="timeline">
                    ${c.timeline.slice().reverse().map(t => `<div class="timeline-item"><div class="timeline-time">${t.time}</div><div>${t.event}</div></div>`).join('') || '<div style="color:#95A5A6;font-size:12px">Sem eventos registrados</div>'}
                </div>
            </div>
        `;
    },

    // ═══ AÇÕES ═══
    toggleExpand: function(id) {
        if (this.expandedCases.has(id)) this.expandedCases.delete(id);
        else this.expandedCases.add(id);
        this.renderTable();
    },

    updateField: function(id, field, value) {
        const c = D.find(x => x.id === id);
        if (c) {
            c[field] = value;
            if (field === 'justification') c.responsibility = JUSTIFICATIONS[value] || '';
            Storage.save();
            this.updateKPIs();
        }
    },

    updateEDSP: function(id, field, value) {
        const c = D.find(x => x.id === id);
        if (c) { c.edspResponse[field] = value; Storage.save(); }
    },

    updateCTA: function(id, field, value) {
        const c = D.find(x => x.id === id);
        if (c) { c.ctaValidation[field] = value; Storage.save(); }
    },

    updateResponsibility: function(id) {
        const c = D.find(x => x.id === id);
        if (c) { c.responsibility = JUSTIFICATIONS[c.justification] || ''; Storage.save(); this.renderTable(); }
    },

    toggleCheck: function(id, field) {
        const c = D.find(x => x.id === id);
        if (!c) return;
        const current = c.ctaValidation[field];
        c.ctaValidation[field] = current === 'ok' ? 'nok' : current === 'nok' ? '' : 'ok';
        Storage.save();
        this.expandedCases.add(id);
        this.renderTable();
    },

    setVerdict: function(id, v) {
        const c = D.find(x => x.id === id);
        if (c) { c.ctaValidation.verdict = v; Storage.save(); }
        this.expandedCases.add(id);
        this.renderTable();
    },

    uploadImages: function(id, files) {
        const c = D.find(x => x.id === id);
        if (!c) return;
        [...files].forEach(f => {
            const reader = new FileReader();
            reader.onload = e => {
                c.edspResponse.images = c.edspResponse.images || [];
                c.edspResponse.images.push(e.target.result);
                Storage.save();
                this.expandedCases.add(id);
                this.renderTable();
            };
            reader.readAsDataURL(f);
        });
        Utils.notify('📎 ' + files.length + ' imagem(ns) anexada(s)');
    },

    submitEDSP: function(id) {
        const c = D.find(x => x.id === id);
        if (!c) return;
        const now = new Date().toLocaleString('pt-BR');
        c.edspResponse.timestamp = now;
        c.status = 'waiting-cta';
        c.timeline.push({ time: now, event: '✅ EDSP respondeu — Aguardando validação CTA' });
        Storage.save();
        this.expandedCases.add(id);
        this.renderTable();
        Utils.notify('✅ Resposta EDSP enviada');
    },

    submitCTA: function(id) {
        const c = D.find(x => x.id === id);
        if (!c) return;
        const now = new Date().toLocaleString('pt-BR');
        c.ctaValidation.timestamp = now;
        c.status = 'done';
        c.timeline.push({ time: now, event: '✅ CTA validou — Caso FINALIZADO' });
        Storage.save();
        this.expandedCases.add(id);
        this.renderTable();
        Utils.notify('✅ Caso finalizado');
    },

    returnToEDSP: function(id) {
        const c = D.find(x => x.id === id);
        if (!c) return;
        const now = new Date().toLocaleString('pt-BR');
        c.status = 'waiting-edsp';
        c.timeline.push({ time: now, event: '↩️ CTA devolveu ao EDSP — Prazo 2 dias (SOP item 13)' });
        Storage.save();
        this.expandedCases.add(id);
        this.renderTable();
        Utils.notify('↩️ Caso devolvido ao EDSP', 'warning');
    },

    addCase: function() {
        const newId = Utils.generateId();
        const now = new Date();
        D.unshift({
            id: newId, trackingId: 'NOVO-' + Math.floor(Math.random() * 9999), da: '(preencher)',
            station: '(preencher)', partner: '(preencher)', date: now.toLocaleDateString('pt-BR'),
            value: 0, asin: '', deliveryTo: 'Cliente', geoScore: 0,
            status: 'waiting-edsp', justification: '', responsibility: '',
            edspResponse: { isDue: '', detail: '', actions: '', timestamp: '', images: [] },
            ctaValidation: { geo: '', recipient: '', daNote: '', call: '', verdict: '', notes: '', timestamp: '' },
            timeline: [{ time: now.toLocaleString('pt-BR'), event: 'Caso criado manualmente' }]
        });
        this.expandedCases.add(newId);
        Storage.save();
        this.renderTable();
        Utils.notify('➕ Novo caso adicionado');
    },

    deleteCase: function(id) {
        if (!confirm('Excluir este caso?')) return;
        D = D.filter(c => c.id !== id);
        Storage.save();
        this.renderTable();
        Utils.notify('🗑️ Caso excluído', 'warning');
    },

    // ═══ KPIs ═══
    updateKPIs: function() {
        document.getElementById('kpi-total').textContent = D.length;
        document.getElementById('kpi-waiting').textContent = D.filter(c => c.status === 'waiting-edsp').length;
        document.getElementById('kpi-done').textContent = D.filter(c => c.status === 'done').length;
        document.getElementById('kpi-overdue').textContent = D.filter(c => Utils.daysSince(c.date) > 7 && c.status !== 'done').length;
        document.getElementById('kpi-value').textContent = Utils.fmt(D.reduce((s, c) => s + c.value, 0));
    },

    // ═══ REINCIDÊNCIA ═══
    renderRecurrence: function() {
        const byDA = {};
        D.forEach(c => {
            if (!byDA[c.da]) byDA[c.da] = { cases: [], partner: c.partner };
            byDA[c.da].cases.push(c);
        });

        const rows = Object.entries(byDA).map(([da, info]) => {
            const score = Utils.calcRiskScore(info.cases);
            const totalValue = info.cases.reduce((s, c) => s + c.value, 0);
            const highValue = info.cases.filter(c => c.value > 1000).length;
            let level, color, action;
            if (score <= 30) { level = 'Baixo'; color = '#2ECC71'; action = 'Monitorar'; }
            else if (score <= 60) { level = 'Médio'; color = '#F39C12'; action = 'Treinamento recomendado'; }
            else if (score <= 80) { level = 'Alto'; color = '#E67E22'; action = 'Medida disciplinar'; }
            else { level = 'Crítico'; color = '#E74C3C'; action = 'Loss Prevention → Bloqueio'; }
            return { da, partner: info.partner, pkg: info.cases.length, value: totalValue, highValue, score, level, color, action };
        }).sort((a, b) => b.score - a.score);

        document.getElementById('recurrenceBody').innerHTML = rows.map(r => `
            <tr>
                <td><strong>${r.da}</strong></td>
                <td>${r.partner}</td>
                <td style="text-align:center">${r.pkg}</td>
                <td>${Utils.fmt(r.value)}</td>
                <td style="text-align:center">${r.highValue}</td>
                <td>
                    <div class="risk-gauge">
                        <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" fill="none" stroke="#E1E6ED" stroke-width="8"/>
                            <circle cx="40" cy="40" r="34" fill="none" stroke="${r.color}" stroke-width="8" stroke-dasharray="${r.score * 2.136} 213.6" stroke-linecap="round"/>
                        </svg>
                        <div class="risk-value" style="color:${r.color}">${r.score}</div>
                    </div>
                </td>
                <td><span class="status-badge" style="background:${r.color};color:white">${r.level}</span></td>
                <td style="font-size:11px">${r.action}</td>
            </tr>
        `).join('');
    },

    // ═══ LOSS PREVENTION ═══
    renderLP: function() {
        const byDA = {};
        D.forEach(c => {
            if (!byDA[c.da]) byDA[c.da] = { cases: [], partner: c.partner, station: c.station };
            byDA[c.da].cases.push(c);
        });

        const lpRows = Object.entries(byDA).filter(([_, info]) => {
            const total = info.cases.reduce((s, c) => s + c.value, 0);
            return info.cases.length > 40 || total > 7500;
        }).map(([da, info]) => {
            const total = info.cases.reduce((s, c) => s + c.value, 0);
            const reasons = [];
            if (info.cases.length > 40) reasons.push('>40 pacotes');
            if (total > 7500) reasons.push('>R$ 7.500');
            return { da, partner: info.partner, station: info.station, pkg: info.cases.length, value: total, reasons: reasons.join(' + ') };
        });

        const tbody = document.getElementById('lpBody');
        if (lpRows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#5C7A99">✅ Nenhum DA atingiu critério de Loss Prevention no momento</td></tr>`;
        } else {
            tbody.innerHTML = lpRows.map(r => `
                <tr style="background:#FEE2E2">
                    <td><strong>${r.da}</strong></td>
                    <td>${r.partner}</td>
                    <td>${r.station}</td>
                    <td style="text-align:center;font-weight:700;color:#E74C3C">${r.pkg}</td>
                    <td style="font-weight:700;color:#E74C3C">${Utils.fmt(r.value)}</td>
                    <td>${r.reasons}</td>
                    <td><span class="status-badge status-overdue">BLOQUEIO</span></td>
                </tr>
            `).join('');
        }
    }
};

// ═══ INICIALIZAR ═══
document.addEventListener('DOMContentLoaded', () => App.init());