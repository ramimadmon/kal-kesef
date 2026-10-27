/*
 * Cal-Kesef UI wiring: reads inputs, validates with calculator helpers, calls calculate()
 * and renders results. No money math here; user-influenced values reach the DOM via textContent only.
 */
(function (ns) {
  'use strict';

  var NAMES = ['initial', 'monthly', 'years', 'annualRatePct'];
  var MSG_INVALID = 'צריך להזין מספר';

  // minimumFractionDigits is required: ILS defaults to 2, which would conflict with maximumFractionDigits 0.
  var currencyFormat = new Intl.NumberFormat('he-IL', {
    style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 0
  });
  var numberFormat = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 1 });
  var compactFormat = new Intl.NumberFormat('he-IL', {
    style: 'currency', currency: 'ILS', notation: 'compact', maximumFractionDigits: 1
  });

  // Chart.js: exact version from cdnjs with SRI (sha512 from the cdnjs API, verified against the file).
  var CHART_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js';
  var CHART_SRI = 'sha512-WoViKhKD4qI2WruSZqv9+kvM4WfFhUMQCLN4QlDTt5aU56fLQy2gYoxWIqlEnXqJy/+Ac5q/hk1oWfqnMDhwMA==';
  var LABEL_DEPOSITS = 'הפקדות';
  var LABEL_PROFIT = 'רווח';
  var LABEL_TOTAL = 'סה״כ';

  var rows = {};
  var values = {};
  var chart = null;
  var chartFailed = false;
  var latestYearly = null;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function formatILS(amount) {
    // Avoid showing "-0 ₪" for floating-point noise around zero.
    return currencyFormat.format(Math.abs(amount) < 0.5 ? 0 : amount);
  }

  function formatWithUnit(name, value) {
    if (name === 'initial' || name === 'monthly') {
      return formatILS(value);
    }
    if (name === 'years') {
      return value === 1 ? 'שנה אחת' : numberFormat.format(value) + ' שנים';
    }
    return numberFormat.format(value) + '%';
  }

  function setText(id, text) {
    document.getElementById(id).textContent = text;
  }

  function showMessage(name, kind, text) {
    var row = rows[name];
    row.el.classList.toggle('is-invalid', kind === 'invalid');
    row.el.classList.toggle('is-clamped', kind === 'clamped');
    row.msg.textContent = text || '';
    row.msg.hidden = !kind;
    if (kind === 'invalid') {
      row.number.setAttribute('aria-invalid', 'true');
    } else {
      row.number.removeAttribute('aria-invalid');
    }
  }

  function syncSlider(name, value) {
    var row = rows[name];
    var range = ns.RANGES[name];
    row.slider.value = String(value);
    row.slider.setAttribute('aria-valuetext', formatWithUnit(name, value));
    var pct = (value - range.min) / (range.max - range.min) * 100;
    row.slider.style.setProperty('--fill', pct + '%');
  }

  function render() {
    var result;
    try {
      result = ns.calculate(values);
    } catch (e) {
      // Values are validated before they get here; keep the last valid result on screen regardless.
      return;
    }
    setText('fv-years', numberFormat.format(values.years));
    setText('fv-years-unit', values.years === 1 ? 'שנה' : 'שנים');
    setText('fv-value', formatILS(result.futureValue));
    setText('deposits-value', formatILS(result.totalDeposits));
    setText('profit-value', formatILS(result.profit));
    latestYearly = result.yearly;
    updateChart();
  }

  // --- Growth chart. The results card never depends on it: any chart failure shows the fallback text. ---

  function token(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function isReducedMotion() {
    return !!(reducedMotion && reducedMotion.matches);
  }

  function yearTitle(year) {
    if (year === 0) {
      return 'היום';
    }
    return year === 1 ? 'אחרי שנה אחת' : 'אחרי ' + numberFormat.format(year) + ' שנים';
  }

  function showChartFallback() {
    chartFailed = true;
    var wrap = document.getElementById('chart-wrap');
    wrap.classList.remove('is-loading');
    wrap.classList.add('is-failed');
    document.getElementById('chart-fallback').hidden = false;
  }

  function chartConfig(data) {
    var muted = token('--color-text-muted');
    var border = token('--color-border');
    return {
      type: 'bar',
      data: {
        labels: data.years,
        datasets: [
          {
            label: LABEL_DEPOSITS,
            data: data.deposits,
            backgroundColor: token('--chart-deposits-fill'),
            borderColor: token('--chart-deposits-line'),
            borderWidth: 1
          },
          {
            label: LABEL_PROFIT,
            data: data.profit,
            backgroundColor: token('--chart-profit-fill'),
            borderColor: token('--chart-profit-line'),
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: isReducedMotion() ? false : { duration: 300, easing: 'easeOutQuad' },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            stacked: true,
            reverse: true,
            grid: { display: false },
            ticks: { color: muted },
            title: { display: true, text: 'שנים', color: muted }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            position: 'right',
            grid: { color: border },
            ticks: {
              color: muted,
              callback: function (value) { return compactFormat.format(value); }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            rtl: true,
            textDirection: 'rtl',
            labels: { color: token('--color-text') }
          },
          tooltip: {
            rtl: true,
            textDirection: 'rtl',
            callbacks: {
              title: function (items) {
                return yearTitle(data.years[items[0].dataIndex]);
              },
              label: function (item) {
                return item.dataset.label + ': ' + formatILS(item.raw);
              },
              footer: function (items) {
                return LABEL_TOTAL + ': ' + formatILS(data.totals[items[0].dataIndex]);
              }
            }
          }
        }
      }
    };
  }

  function updateChart() {
    if (chartFailed || !latestYearly || typeof window.Chart !== 'function') {
      return;
    }
    try {
      var data = ns.toChartData(latestYearly);
      if (!chart) {
        var Chart = window.Chart;
        Chart.defaults.font.family = token('--font-family');
        Chart.defaults.font.size = 14;
        chart = new Chart(document.getElementById('growth-chart'), chartConfig(data));
        document.getElementById('chart-wrap').classList.remove('is-loading');
        return;
      }
      // Tooltip callbacks read `data`, so replace the whole config data with the new mapping.
      var fresh = chartConfig(data);
      chart.data.labels = fresh.data.labels;
      chart.data.datasets[0].data = fresh.data.datasets[0].data;
      chart.data.datasets[1].data = fresh.data.datasets[1].data;
      chart.options.plugins.tooltip.callbacks = fresh.options.plugins.tooltip.callbacks;
      chart.options.animation = fresh.options.animation;
      chart.update(isReducedMotion() ? 'none' : undefined);
    } catch (e) {
      if (chart) {
        chart.destroy();
        chart = null;
      }
      showChartFallback();
    }
  }

  // Loaded from app.js (not a blocking tag) so a slow or blocked CDN never delays the results.
  function loadChartLibrary() {
    var script = document.createElement('script');
    script.src = CHART_SRC;
    script.integrity = CHART_SRI;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.addEventListener('load', function () {
      if (typeof window.Chart !== 'function') {
        showChartFallback();
        return;
      }
      updateChart();
    });
    script.addEventListener('error', showChartFallback);
    document.head.appendChild(script);
  }

  function setValue(name, value) {
    values[name] = value;
    syncSlider(name, value);
    render();
  }

  function onSliderInput(name) {
    var parsed = ns.parseInput(rows[name].slider.value);
    var n = parsed === null ? null : ns.normalizeInput(name, parsed);
    if (!n) {
      return;
    }
    rows[name].number.value = String(n.value);
    showMessage(name, null);
    setValue(name, n.value);
  }

  // While typing: recompute only for valid, in-range values; never clamp mid-typing.
  function onNumberInput(name) {
    var raw = rows[name].number.value;
    var parsed = ns.parseInput(raw);
    if (parsed === null) {
      if (raw.trim() !== '') {
        showMessage(name, 'invalid', MSG_INVALID);
      }
      return;
    }
    showMessage(name, null);
    var n = ns.normalizeInput(name, parsed);
    if (n && !n.clamped) {
      setValue(name, n.value);
    }
  }

  // On blur / Enter: show the error for empty input, or clamp out-of-range values with a hint.
  function onNumberCommit(name) {
    var row = rows[name];
    var parsed = ns.parseInput(row.number.value);
    if (parsed === null) {
      showMessage(name, 'invalid', MSG_INVALID);
      return;
    }
    var n = ns.normalizeInput(name, parsed);
    row.number.value = String(n.value);
    if (n.clamped) {
      var prefix = n.bound === 'max' ? 'המקסימום הוא ' : 'המינימום הוא ';
      showMessage(name, 'clamped', prefix + formatWithUnit(name, n.value));
    } else {
      showMessage(name, null);
    }
    setValue(name, n.value);
  }

  function initRow(name) {
    var range = ns.RANGES[name];
    var row = {
      el: document.querySelector('.input-row[data-input="' + name + '"]'),
      slider: document.getElementById(name + '-range'),
      number: document.getElementById(name + '-number'),
      msg: document.getElementById(name + '-msg')
    };
    rows[name] = row;

    row.slider.min = String(range.min);
    row.slider.max = String(range.max);
    row.slider.step = String(range.step);
    row.number.value = String(range.defaultValue);
    values[name] = range.defaultValue;
    syncSlider(name, range.defaultValue);

    row.slider.addEventListener('input', function () { onSliderInput(name); });
    row.number.addEventListener('input', function () { onNumberInput(name); });
    row.number.addEventListener('blur', function () { onNumberCommit(name); });
    row.number.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        onNumberCommit(name);
      }
    });
  }

  function init() {
    NAMES.forEach(initRow);
    render();
    loadChartLibrary();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window.CalKesef = window.CalKesef || {});
