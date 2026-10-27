/*
 * Unit tests for js/calculator.js.
 * Reference values were computed independently with a month-by-month simulation in PowerShell
 * (balance = balance * (1 + r_m) + deposit, r_m = (1 + R)^(1/12) - 1), not with the closed-form
 * formula used by calculator.js. Tolerance: 1 ILS.
 */
(function (T, C) {
  'use strict';

  var TOL = 1;

  function calc(initial, monthly, years, annualRatePct) {
    return C.calculate({ initial: initial, monthly: monthly, years: years, annualRatePct: annualRatePct });
  }

  function checkInvariants(r, years) {
    T.assertEqual(r.yearly.length, years + 1, 'yearly.length');
    T.assertEqual(r.yearly[years].balance, r.futureValue, 'last yearly balance === futureValue');
    T.assertEqual(r.profit, r.futureValue - r.totalDeposits, 'profit === futureValue - totalDeposits');
    T.assertEqual(r.yearly[0].year, 0, 'yearly[0].year');
    T.assertEqual(r.yearly[years].year, years, 'last yearly year');
  }

  // --- Reference values ---

  T.test('defaults (1000, 200, 20y, 10%) match reference', function () {
    var r = calc(1000, 200, 20, 10);
    T.assertClose(r.futureValue, 150379.3456, TOL, 'futureValue');
    T.assertEqual(r.totalDeposits, 49000, 'totalDeposits');
    T.assertClose(r.profit, 150379.3456 - 49000, TOL, 'profit');
    checkInvariants(r, 20);
  });

  T.test('0% return: FV equals total deposits, profit 0', function () {
    var r = calc(1000, 200, 20, 0);
    T.assertClose(r.futureValue, 49000, TOL, 'futureValue');
    T.assertEqual(r.totalDeposits, 49000, 'totalDeposits');
    T.assertClose(r.profit, 0, TOL, 'profit');
    checkInvariants(r, 20);
  });

  T.test('initial 0 (0, 200, 20y, 10%) matches reference', function () {
    var r = calc(0, 200, 20, 10);
    T.assertClose(r.futureValue, 143651.8456, TOL, 'futureValue');
    T.assertEqual(r.totalDeposits, 48000, 'totalDeposits');
    checkInvariants(r, 20);
  });

  T.test('monthly 0 (1000, 0, 20y, 10%) equals 1000 * 1.1^20', function () {
    var r = calc(1000, 0, 20, 10);
    T.assertClose(r.futureValue, 6727.4999, TOL, 'futureValue');
    T.assertEqual(r.totalDeposits, 1000, 'totalDeposits');
    checkInvariants(r, 20);
  });

  T.test('1 year (1000, 200, 1y, 10%) matches reference', function () {
    var r = calc(1000, 200, 1, 10);
    T.assertClose(r.futureValue, 3608.1073, TOL, 'futureValue');
    T.assertEqual(r.totalDeposits, 3400, 'totalDeposits');
    checkInvariants(r, 1);
  });

  T.test('50 years (1000, 200, 50y, 10%) matches reference', function () {
    var r = calc(1000, 200, 50, 10);
    T.assertClose(r.futureValue, 3036598.3566, TOL, 'futureValue');
    T.assertEqual(r.totalDeposits, 121000, 'totalDeposits');
    checkInvariants(r, 50);
  });

  T.test('max values (1,000,000, 20,000, 50y, 20%) are finite and match reference', function () {
    var r = calc(1000000, 20000, 50, 20);
    T.assertClose(r.futureValue, 20987770439.0734, TOL, 'futureValue');
    T.assertEqual(r.totalDeposits, 13000000, 'totalDeposits');
    T.assertTrue(isFinite(r.profit), 'profit finite');
    r.yearly.forEach(function (row) {
      T.assertTrue(isFinite(row.balance) && isFinite(row.deposits) && isFinite(row.profit), 'yearly row finite');
    });
    checkInvariants(r, 50);
  });

  T.test('min values (0, 0, 1y, 0%) give all zeros', function () {
    var r = calc(0, 0, 1, 0);
    T.assertEqual(r.futureValue, 0, 'futureValue');
    T.assertEqual(r.totalDeposits, 0, 'totalDeposits');
    T.assertEqual(r.profit, 0, 'profit');
    checkInvariants(r, 1);
  });

  T.test('yearly[10] balance matches 10-year reference (1000, 200, 10%)', function () {
    var r = calc(1000, 200, 20, 10);
    T.assertClose(r.yearly[10].balance, 42566.5138, TOL, 'yearly[10].balance');
    T.assertEqual(r.yearly[10].deposits, 25000, 'yearly[10].deposits');
    T.assertEqual(r.yearly[0].balance, 1000, 'yearly[0].balance');
    T.assertEqual(r.yearly[0].profit, 0, 'yearly[0].profit');
  });

  T.test('invariants hold for every whole year 1..50 (defaults otherwise)', function () {
    for (var y = 1; y <= 50; y++) {
      checkInvariants(calc(1000, 200, y, 10), y);
    }
  });

  // --- Clamping and parsing ---

  T.test('RANGES match PRD section 5', function () {
    var R = C.RANGES;
    T.assertEqual(R.initial.min, 0); T.assertEqual(R.initial.max, 1000000); T.assertEqual(R.initial.defaultValue, 1000);
    T.assertEqual(R.monthly.min, 0); T.assertEqual(R.monthly.max, 20000); T.assertEqual(R.monthly.defaultValue, 200);
    T.assertEqual(R.years.min, 1); T.assertEqual(R.years.max, 50); T.assertEqual(R.years.defaultValue, 20);
    T.assertEqual(R.annualRatePct.min, 0); T.assertEqual(R.annualRatePct.max, 20); T.assertEqual(R.annualRatePct.defaultValue, 10);
  });

  T.test('normalizeInput clamps at min for every input', function () {
    var cases = [['initial', -1, 0], ['monthly', -50, 0], ['years', 0, 1], ['annualRatePct', -0.5, 0]];
    cases.forEach(function (c) {
      var n = C.normalizeInput(c[0], c[1]);
      T.assertEqual(n.value, c[2], c[0] + ' min value');
      T.assertEqual(n.clamped, true, c[0] + ' clamped');
      T.assertEqual(n.bound, 'min', c[0] + ' bound');
    });
  });

  T.test('normalizeInput clamps at max for every input', function () {
    var cases = [['initial', 1000001, 1000000], ['monthly', 99999, 20000], ['years', 51, 50], ['annualRatePct', 25, 20]];
    cases.forEach(function (c) {
      var n = C.normalizeInput(c[0], c[1]);
      T.assertEqual(n.value, c[2], c[0] + ' max value');
      T.assertEqual(n.clamped, true, c[0] + ' clamped');
      T.assertEqual(n.bound, 'max', c[0] + ' bound');
    });
  });

  T.test('normalizeInput keeps boundary and in-range values unchanged', function () {
    var cases = [['initial', 0], ['initial', 1000000], ['monthly', 1234], ['years', 1], ['years', 50], ['annualRatePct', 7.3]];
    cases.forEach(function (c) {
      var n = C.normalizeInput(c[0], c[1]);
      T.assertEqual(n.value, c[1], c[0] + ' value');
      T.assertEqual(n.clamped, false, c[0] + ' not clamped');
    });
  });

  T.test('normalizeInput rounds years to whole years', function () {
    T.assertEqual(C.normalizeInput('years', 20.4).value, 20, '20.4');
    T.assertEqual(C.normalizeInput('years', 20.6).value, 21, '20.6');
  });

  T.test('normalizeInput rejects NaN, Infinity and unknown names', function () {
    T.assertEqual(C.normalizeInput('years', NaN), null, 'NaN');
    T.assertEqual(C.normalizeInput('years', Infinity), null, 'Infinity');
    T.assertEqual(C.normalizeInput('years', -Infinity), null, '-Infinity');
    T.assertEqual(C.normalizeInput('nope', 5), null, 'unknown name');
  });

  T.test('parseInput accepts numbers and rejects empty / non-numeric text', function () {
    T.assertEqual(C.parseInput('1000'), 1000, '"1000"');
    T.assertEqual(C.parseInput(' 7.5 '), 7.5, '" 7.5 "');
    T.assertEqual(C.parseInput(''), null, 'empty');
    T.assertEqual(C.parseInput('   '), null, 'spaces');
    T.assertEqual(C.parseInput('abc'), null, 'abc');
    T.assertEqual(C.parseInput('Infinity'), null, 'Infinity');
    T.assertEqual(C.parseInput('1e400'), null, '1e400 overflows to Infinity');
    T.assertEqual(C.parseInput(null), null, 'null');
    T.assertEqual(C.parseInput(undefined), null, 'undefined');
  });

  T.test('calculate rejects invalid input instead of returning NaN', function () {
    T.assertThrows(function () { calc(NaN, 200, 20, 10); }, 'NaN initial');
    T.assertThrows(function () { calc(1000, Infinity, 20, 10); }, 'Infinity monthly');
    T.assertThrows(function () { calc(1000, 200, 0, 10); }, 'years 0');
    T.assertThrows(function () { calc(1000, 200, 20.5, 10); }, 'fractional years');
    T.assertThrows(function () { calc(1000, 200, 20, 21); }, 'rate above max');
    T.assertThrows(function () { calc(-1, 200, 20, 10); }, 'negative initial');
    T.assertThrows(function () { C.calculate(); }, 'missing params');
  });

  T.run();
})(window.CalKesefTest, window.CalKesef);
