/**
 * DNR Control Center - Data Module
 * Constantes, dados iniciais e utilitários
 */

'use strict';

// ═══ CONSTANTES ═══
const JUSTIFICATIONS = Object.freeze({
    'No DSP response': 'EDSP',
    'Incorrect Delivery Location': 'EDSP',
    'Missing Recipient Details': 'EDSP',
    'Bad Actor': 'EDSP',
    'Tossing Package': 'EDSP',
    'DNR Over 30 Days': 'AMZL',
    'Comm. Expired': 'AMZL',
    'Incorrect Geolocation': 'AMZL',
    'Successful DSP Justification': 'AMZL'
});

const STATUS_LABELS = Object.freeze({
    'waiting-edsp': 'Aguardando EDSP',
    'waiting-cta': 'Aguardando CTA',
    'done': 'Finalizado',
    'overdue': 'Vencido'
});

// ═══ DADOS INICIAIS ═══
let D = [
    {
        id: 'c1',
        trackingId: 'BR123456789',
        da: 'João Silva',
        station: 'DSP1',
        partner: 'EDSP Alpha',
        date: '15/04/2025',
        value: 450.00,
        asin: 'Echo Dot 5',
        deliveryTo: 'Cliente',
        geoScore: 0.85,
        status: 'waiting-edsp',
        justification: '',
        responsibility: '',
        edspResponse: { isDue: '', detail: '', actions: '', timestamp: '', images: [] },
        ctaValidation: { geo: '', recipient: '', daNote: '', call: '', verdict: '', notes: '', timestamp: '' },
        timeline: [{ time: '15/04/2025 10:30', event: 'Caso criado — Aguardando resposta EDSP' }]
    },
    {
        id: 'c2',
        trackingId: 'BR987654321',
        da: 'Maria Santos',
        station: 'DSP1',
        partner: 'EDSP Alpha',
        date: '14/04/2025',
        value: 1250.00,
        asin: 'Fire TV Stick 4K',
        deliveryTo: 'Recepção',
        geoScore: 0.92,
        status: 'waiting-cta',
        justification: 'Incorrect Delivery Location',
        responsibility: 'EDSP',
        edspResponse: { isDue: 'Sim', detail: 'Entrega realizada em endereço divergente', actions: 'Reforço de treinamento ao DA', timestamp: '16/04/2025 14:20', images: [] },
        ctaValidation: { geo: '', recipient: '', daNote: '', call: '', verdict: '', notes: '', timestamp: '' },
        timeline: [{ time: '14/04/2025 09:00', event: 'Caso criado' }, { time: '16/04/2025 14:20', event: 'EDSP respondeu' }]
    },
    {
        id: 'c3',
        trackingId: 'BR555444333',
        da: 'Pedro Costa',
        station: 'DSP2',
        partner: 'EDSP Beta',
        date: '10/04/2025',
        value: 89.90,
        asin: 'Livro',
        deliveryTo: 'Cliente',
        geoScore: 0.45,
        status: 'done',
        justification: 'Bad Actor',
        responsibility: 'EDSP',
        edspResponse: { isDue: 'Sim', detail: 'DA confirmou comportamento inadequado', actions: 'DA desligado', timestamp: '12/04/2025 11:00', images: [] },
        ctaValidation: { geo: 'nok', recipient: 'nok', daNote: 'nok', call: 'ok', verdict: 'NOK', notes: 'Confirmado bad actor', timestamp: '13/04/2025 15:00' },
        timeline: [{ time: '10/04/2025 08:00', event: 'Caso criado' }, { time: '12/04/2025 11:00', event: 'EDSP respondeu' }, { time: '13/04/2025 15:00', event: 'CTA validou — Finalizado' }]
    },
    {
        id: 'c4',
        trackingId: 'BR111222333',
        da: 'Ana Lima',
        station: 'DSP3',
        partner: 'EDSP Beta',
        date: '05/04/2025',
        value: 2890.00,
        asin: 'iPhone 15',
        deliveryTo: 'Cliente',
        geoScore: 0.30,
        status: 'overdue',
        justification: '',
        responsibility: '',
        edspResponse: { isDue: '', detail: '', actions: '', timestamp: '', images: [] },
        ctaValidation: { geo: '', recipient: '', daNote: '', call: '', verdict: '', notes: '', timestamp: '' },
        timeline: [{ time: '05/04/2025 07:30', event: 'Caso criado' }]
    },
    {
        id: 'c5',
        trackingId: 'BR444555666',
        da: 'Carlos Rocha',
        station: 'DSP1',
        partner: 'EDSP Alpha',
        date: '16/04/2025',
        value: 320.00,
        asin: 'Kindle',
        deliveryTo: 'Vizinho',
        geoScore: 0.88,
        status: 'waiting-edsp',
        justification: '',
        responsibility: '',
        edspResponse: { isDue: '', detail: '', actions: '', timestamp: '', images: [] },
        ctaValidation: { geo: '', recipient: '', daNote: '', call: '', verdict: '', notes: '', timestamp: '' },
        timeline: [{ time: '16/04/2025 11:00', event: 'Caso criado' }]
    },
    {
        id: 'c6',
        trackingId: 'BR777888999',
        da: 'João Silva',
        station: 'DSP1',
        partner: 'EDSP Alpha',
        date: '12/04/2025',
        value: 899.00,
        asin: 'Smart TV 43"',
        deliveryTo: 'Cliente',
        geoScore: 0.72,
        status: 'done',
        justification: 'Successful DSP Justification',
        responsibility: 'AMZL',
        edspResponse: { isDue: 'Não', detail: 'Entrega comprovada com foto', actions: 'N/A', timestamp: '14/04/2025 10:00', images: [] },
        ctaValidation: { geo: 'ok', recipient: 'ok', daNote: 'ok', call: 'ok', verdict: 'OK', notes: 'Todos critérios atendidos', timestamp: '15/04/2025 09:00' },
        timeline: []
    }
];

// ═══ UTILITÁRIOS ═══
const Utils = {
    fmt: (v) => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),

    statusLabel: (s) => STATUS_LABELS[s] || s,

    parseDate: (d) => {
        const p = d.split('/');
        return new Date(p[2], p[1] - 1, p[0]);
    },

    daysSince: (d) => Math.floor((Date.now() - Utils.parseDate(d).getTime()) / (1000 * 60 * 60 * 24)),

    notify: (msg, type = 'success') => {
        const container = document.getElementById('notificationContainer');
        const n = document.createElement('div');
        n.className = 'notification';
        n.style.borderLeftColor = type === 'error' ? '#E74C3C' : type === 'warning' ? '#F39C12' : '#2ECC71';
        n.innerHTML = msg;
        container.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    },

    generateId: () => 'c' + Date.now() + Math.floor(Math.random() * 1000),

    calcRiskScore: (daCases) => {
        const pkg = daCases.length;
        const totalValue = daCases.reduce((s, c) => s + c.value, 0);
        const highValue = daCases.filter(c => c.value > 1000).length;
        const flags = daCases.filter(c => c.justification === 'Bad Actor' || c.justification === 'Tossing Package').length;

        const sPkg = Math.min(100, pkg * 3) * 0.3;
        const sVal = Math.min(100, totalValue / 100) * 0.25;
        const sFreq = Math.min(100, pkg * 5) * 0.2;
        const sHigh = Math.min(100, highValue * 20) * 0.15;
        const sFlag = Math.min(100, flags * 30) * 0.1;

        return Math.round(sPkg + sVal + sFreq + sHigh + sFlag);
    }
};

// ═══ LOCAL STORAGE PERSISTENCE ═══
const Storage = {
    KEY: 'dnr_control_center_data',

    save: () => {
        try {
            localStorage.setItem(Storage.KEY, JSON.stringify(D));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }
    },

    load: () => {
        try {
            const saved = localStorage.getItem(Storage.KEY);
            if (saved) {
                D = JSON.parse(saved);
                return true;
            }
        } catch (e) {
            console.warn('LocalStorage load failed:', e);
        }
        return false;
    },

    clear: () => {
        localStorage.removeItem(Storage.KEY);
    }
};