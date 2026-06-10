/**
 * DNR Control Center - Export Module
 * Importação, exportação e compartilhamento
 */

'use strict';

const ExportModule = {
    openShareModal: () => document.getElementById('shareModal').classList.add('active'),
    closeShareModal: () => document.getElementById('shareModal').classList.remove('active'),

    importFile: function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws);

                let imported = 0, skipped = 0;
                rows.forEach(r => {
                    if ((r.Abuse || '').toString().toLowerCase() === 'yes' ||
                        (r.OTP || '').toString().toLowerCase() === 'yes') {
                        skipped++;
                        return;
                    }
                    D.push({
                        id: Utils.generateId(),
                        trackingId: r['Tracking ID'] || r.TrackingId || '',
                        da: r.DA || r.Driver || '',
                        station: r.Station || '',
                        partner: r.Partner || r.EDSP || '',
                        date: r.Date || new Date().toLocaleDateString('pt-BR'),
                        value: parseFloat(r.Value || r.Valor || 0),
                        asin: r.ASIN || r['ASIN Name'] || '',
                        deliveryTo: r.DeliveryTo || 'Cliente',
                        geoScore: parseFloat(r.GeoScore || 0),
                        status: 'waiting-edsp',
                        justification: '',
                        responsibility: '',
                        edspResponse: { isDue: '', detail: '', actions: '', timestamp: '', images: [] },
                        ctaValidation: { geo: '', recipient: '', daNote: '', call: '', verdict: '', notes: '', timestamp: '' },
                        timeline: [{ time: new Date().toLocaleString('pt-BR'), event: 'Importado do FlashRun' }]
                    });
                    imported++;
                });

                Storage.save();
                App.renderTable();
                Utils.notify(`✅ ${imported} casos importados. ${skipped} excluídos (Abuse/OTP).`);
            } catch (err) {
                Utils.notify('❌ Erro na importação: ' + err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    },

    exportExcel: function() {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Casos
        const casesData = D.map(c => ({
            'Tracking ID': c.trackingId, 'DA': c.da, 'Station': c.station, 'Parceiro': c.partner,
            'Data': c.date, 'Valor': c.value, 'ASIN': c.asin, 'Status': Utils.statusLabel(c.status),
            'Justificativa': c.justification, 'Responsabilidade': c.responsibility,
            'Dias sem resposta': Utils.daysSince(c.date),
            'EDSP Devido': c.edspResponse.isDue, 'EDSP Detalhe': c.edspResponse.detail,
            'EDSP Ações': c.edspResponse.actions, 'EDSP Timestamp': c.edspResponse.timestamp,
            'CTA Veredito': c.ctaValidation.verdict, 'CTA Observações': c.ctaValidation.notes,
            'CTA Timestamp': c.ctaValidation.timestamp
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(casesData), 'Casos DNR');

        // Sheet 2: Reincidência
        const byDA = {};
        D.forEach(c => { if (!byDA[c.da]) byDA[c.da] = { cases: [], partner: c.partner }; byDA[c.da].cases.push(c); });
        const recData = Object.entries(byDA).map(([da, info]) => ({
            'DA': da, 'Parceiro': info.partner, 'Pacotes': info.cases.length,
            'Valor Total': info.cases.reduce((s, c) => s + c.value, 0),
            'Risk Score': Utils.calcRiskScore(info.cases),
            'Nível': Utils.calcRiskScore(info.cases) <= 30 ? 'Baixo' : Utils.calcRiskScore(info.cases) <= 60 ? 'Médio' : Utils.calcRiskScore(info.cases) <= 80 ? 'Alto' : 'Crítico'
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recData), 'Reincidência');

        // Sheet 3: LP
        const lpData = Object.entries(byDA).filter(([_, info]) => {
            const t = info.cases.reduce((s, c) => s + c.value, 0);
            return info.cases.length > 40 || t > 7500;
        }).map(([da, info]) => ({
            'DA': da, 'Parceiro': info.partner, 'Pacotes': info.cases.length,
            'Valor Total': info.cases.reduce((s, c) => s + c.value, 0), 'Ação': 'Loss Prevention'
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lpData.length ? lpData : [{ info: 'Nenhum caso LP' }]), 'Loss Prevention');

        // Sheet 4: Critérios SOP
        const sopData = Object.entries(JUSTIFICATIONS).map(([j, r]) => ({ 'Justificativa': j, 'Responsabilidade': r }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sopData), 'Critérios SOP');

        XLSX.writeFile(wb, `DNR_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
        Utils.notify('📊 Excel exportado com 4 abas');
        this.closeShareModal();
    },

    exportCSV: function() {
        const headers = ['Tracking ID', 'DA', 'Station', 'Parceiro', 'Data', 'Valor', 'Status', 'Justificativa', 'Responsabilidade', 'Dias'];
        const rows = D.map(c => [c.trackingId, c.da, c.station, c.partner, c.date, c.value, Utils.statusLabel(c.status), c.justification, c.responsibility, Utils.daysSince(c.date)]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `DNR_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        Utils.notify('📋 CSV exportado');
        this.closeShareModal();
    },

    exportHTML: function() {
        const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `DNR_Dashboard_${new Date().toISOString().slice(0, 10)}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
        Utils.notify('💾 HTML standalone exportado');
        this.closeShareModal();
    },

    exportLP: function() {
        const byDA = {};
        D.forEach(c => { if (!byDA[c.da]) byDA[c.da] = { cases: [], partner: c.partner, station: c.station }; byDA[c.da].cases.push(c); });
        const rows = Object.entries(byDA).filter(([_, info]) => {
            const t = info.cases.reduce((s, c) => s + c.value, 0);
            return info.cases.length > 40 || t > 7500;
        }).map(([da, info]) => ({
            'DA': da, 'Parceiro': info.partner, 'Station': info.station,
            'Pacotes DNR': info.cases.length, 'Valor Total': info.cases.reduce((s, c) => s + c.value, 0),
            'Tracking IDs': info.cases.map(c => c.trackingId).join('; '),
            'Ação Requerida': 'Bloqueio via Loss Prevention'
        }));

        if (rows.length === 0) { Utils.notify('Nenhum caso atinge critério LP', 'warning'); return; }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Loss Prevention');
        XLSX.writeFile(wb, `LP_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
        Utils.notify('📄 Relatório LP exportado');
    },

    copySummary: function() {
        const total = D.length;
        const waiting = D.filter(c => c.status === 'waiting-edsp').length;
        const done = D.filter(c => c.status === 'done').length;
        const overdue = D.filter(c => Utils.daysSince(c.date) > 7 && c.status !== 'done').length;
        const value = D.reduce((s, c) => s + c.value, 0);
        const text = `📊 *DNR Control Center — Resumo*\n\n📦 Total de casos: ${total}\n⏳ Aguardando EDSP: ${waiting}\n✅ Finalizados: ${done}\n🚨 Vencidos (>7d): ${overdue}\n💰 Valor total: ${Utils.fmt(value)}\n\n_Gerado em ${new Date().toLocaleString('pt-BR')}_`;

        navigator.clipboard.writeText(text).then(() => {
            Utils.notify('📋 Resumo copiado para área de transferência');
            this.closeShareModal();
        });
    },

    emailReport: function() {
        const total = D.length;
        const waiting = D.filter(c => c.status === 'waiting-edsp').length;
        const done = D.filter(c => c.status === 'done').length;
        const overdue = D.filter(c => Utils.daysSince(c.date) > 7 && c.status !== 'done').length;
        const body = `DNR Control Center - Relatório\n\nTotal: ${total}\nAguardando EDSP: ${waiting}\nFinalizados: ${done}\nVencidos: ${overdue}\n\nGerado em ${new Date().toLocaleString('pt-BR')}`;
        window.location.href = `mailto:?subject=DNR Report ${new Date().toLocaleDateString('pt-BR')}&body=${encodeURIComponent(body)}`;
        this.closeShareModal();
    }
};