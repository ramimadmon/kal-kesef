/*
 * Unit tests for js/chart-data.js.
 * Loaded before calculator.test.js, whose T.run() runs every registered test.
 */
(function (T, C) {
  'use strict';

  // Floating-point tolerance for deposits + profit === balance (profit is balance - deposits).
  var EPS = 1e-6;

  var CASES = [
    [1000, 200, 20, 10],
    [1000, 200, 20, 0],
    [0, 0, 1, 0],
    [1000, 200, 1, 10],
    [1000000, 20000, 50, 20]
  ];

  function chartFor(c) {
    var r = C.calculate({ initial: c[0], monthly: c[1], years: c[2], annualRatePct: c[3] });
    return { result: r, data: C.toChartData(r.yearly) };
  }

  T.test('toChartData: one point per year 0..N, years in order', function () {
    CASES.forEach(function (c) {
      var d = chartFor(c).data;
      var label = c.join('/');
      T.assertEqual(d.years.length, c[2] + 1, label + ' years.length');
      T.assertEqual(d.deposits.length, c[2] + 1, label + ' deposits.length');
      T.assertEqual(d.profit.length, c[2] + 1, label + ' profit.length');
      T.assertEqual(d.totals.length, c[2] + 1, label + ' totals.length');
      d.years.forEach(function (y, i) {
        T.assertEqual(y, i, label + ' years[' + i + ']');
      });
    });
  });

  T.test('toChartData: last total equals futureValue', function () {
    CASES.forEach(function (c) {
      var x = chartFor(c);
      var last = x.data.totals.length - 1;
      T.assertEqual(x.data.totals[last], x.result.futureValue, c.join('/') + ' last total');
      T.assertEqual(x.data.deposits[last], x.result.totalDeposits, c.join('/') + ' last deposits');
      T.assertEqual(x.data.profit[last], x.result.profit, c.join('/') + ' last profit');
    });
  });

  T.test('toChartData: deposits + profit equals balance for every year', function () {
    CASES.forEach(function (c) {
      var x = chartFor(c);
      x.data.years.forEach(function (y, i) {
        var stacked = x.data.deposits[i] + x.data.profit[i];
        var balance = x.result.yearly[i].balance;
        T.assertClose(stacked, balance, Math.max(EPS, Math.abs(balance) * 1e-12),
          c.join('/') + ' year ' + y + ' stacked');
        T.assertEqual(x.data.totals[i], balance, c.join('/') + ' year ' + y + ' total');
      });
    });
  });

  T.test('toChartData: defaults match the reference values at year 20', function () {
    var d = chartFor([1000, 200, 20, 10]).data;
    T.assertClose(d.totals[20], 150379.3456, 1, 'total');
    T.assertEqual(d.deposits[20], 49000, 'deposits');
    T.assertClose(d.profit[20], 150379.3456 - 49000, 1, 'profit');
    T.assertEqual(d.deposits[0], 1000, 'year 0 deposits = initial');
    T.assertEqual(d.profit[0], 0, 'year 0 profit');
  });

  T.test('toChartData rejects a missing or empty yearly array', function () {
    T.assertThrows(function () { C.toChartData(); }, 'undefined');
    T.assertThrows(function () { C.toChartData([]); }, 'empty');
    T.assertThrows(function () { C.toChartData('x'); }, 'string');
  });
})(window.CalKesefTest, window.CalKesef);
