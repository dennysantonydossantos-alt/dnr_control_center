/**
 * DNR Control Center - Charts Module
 * Gráficos Plotly.js
 */

'use strict';

const Charts = {
    plotlyConfig: {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
    },

    baseLayout: {
        paper_bgcolor: 'white',
        plot_bgcolor: '#F7FAFC',
        font: { family: '-apple-system, system-ui, sans-serif', size: 12 },
        margin: { l: 50, r: 20, t: 30, b: 50 }
    },

    render: function() {
        if (typeof Plotly === 'undefined') {
            console.warn('Plotly not loaded yet');
            setTimeout(() => Charts.render(), 500);
            return;
        }

        this.renderWeekly();
        this.renderJustification();
        this.renderResponsibility();
        this.renderPartner();
        this.renderAging();
    },

    renderWeekly: function() {
        const byWeek = {};
        D.forEach(c => {
            const d = Utils.parseDate(c.date);
            const week = 'Sem ' + Math.ceil(d.getDate() / 7);
            byWeek[week] = (byWeek[week] || 0) + 1;
        });

        Plotly.newPlot('chart-weekly', [{
            x: Object.keys(byWeek),
            y: Object.values(byWeek),
            type: 'bar',
            marker: { color: '#2C5282', cornerradius: 4 }
        }], {
            ...this.baseLayout,
            xaxis: { title: 'Semana' },
            yaxis: { title: 'Casos', dtick: 1 }
        }, this.plotlyConfig);
    },

    renderJustification: function() {
        const byJust = {};
        D.filter(c => c.justification).forEach(c => {
            byJust[c.justification] = (byJust[c.justification] || 0) + 1;
        });

        if (Object.keys(byJust).length === 0) {
            document.getElementById('chart-justification').innerHTML =
                '<div style="padding:60px;text-align:center;color:#5C7A99">Sem dados de justificativa</div>';
            return;
        }

        Plotly.newPlot('chart-justification', [{
            labels: Object.keys(byJust),
            values: Object.values(byJust),
            type: 'pie',
            hole: 0.5,
            marker: {
                colors: ['#2C5282', '#DD6B20', '#E74C3C', '#2ECC71', '#9B59B6', '#F39C12', '#16A085', '#34495E', '#E67E22']
            }
        }], {
            ...this.baseLayout,
            showlegend: true,
            legend: { orientation: 'v', x: 1, y: 0.5, font: { size: 10 } }
        }, this.plotlyConfig);
    },

    renderResponsibility: function() {
        const edsp = D.filter(c => c.responsibility === 'EDSP').length;
        const amzl = D.filter(c => c.responsibility === 'AMZL').length;

        Plotly.newPlot('chart-responsibility', [{
            x: ['EDSP', 'AMZL'],
            y: [edsp, amzl],
            type: 'bar',
            marker: { color: ['#DD6B20', '#2C5282'] },
            text: [edsp, amzl],
            textposition: 'outside'
        }], {
            ...this.baseLayout,
            yaxis: { title: 'Casos', dtick: 1 }
        }, this.plotlyConfig);
    },

    renderPartner: function() {
        const byPartner = {};
        D.forEach(c => { byPartner[c.partner] = (byPartner[c.partner] || 0) + 1; });

        Plotly.newPlot('chart-partner', [{
            x: Object.keys(byPartner),
            y: Object.values(byPartner),
            type: 'bar',
            marker: { color: '#9B59B6' }
        }], {
            ...this.baseLayout,
            yaxis: { title: 'Casos', dtick: 1 }
        }, this.plotlyConfig);
    },

    renderAging: function() {
        const aging = { '0-2 dias': 0, '3-5 dias': 0, '6-7 dias': 0, '>7 dias (vencido)': 0 };
        D.filter(c => c.status !== 'done').forEach(c => {
            const d = Utils.daysSince(c.date);
            if (d <= 2) aging['0-2 dias']++;
            else if (d <= 5) aging['3-5 dias']++;
            else if (d <= 7) aging['6-7 dias']++;
            else aging['>7 dias (vencido)']++;
        });

        Plotly.newPlot('chart-aging', [{
            x: Object.keys(aging),
            y: Object.values(aging),
            type: 'bar',
            marker: { color: ['#2ECC71', '#F39C12', '#E67E22', '#E74C3C'] },
            text: Object.values(aging),
            textposition: 'outside'
        }], {
            ...this.baseLayout,
            yaxis: { title: 'Casos', dtick: 1 }
        }, this.plotlyConfig);
    }
};