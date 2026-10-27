/*
 * Minimal zero-install test runner for the browser.
 * Writes results with textContent and a machine-readable summary into <pre id="summary">.
 */
(function (ns) {
  'use strict';

  var tests = [];

  function test(name, fn) {
    tests.push({ name: name, fn: fn });
  }

  function fail(message) {
    throw new Error(message);
  }

  function assertEqual(actual, expected, label) {
    if (actual !== expected) {
      fail((label || 'assertEqual') + ': expected ' + String(expected) + ', got ' + String(actual));
    }
  }

  function assertClose(actual, expected, tolerance, label) {
    if (typeof actual !== 'number' || !isFinite(actual)) {
      fail((label || 'assertClose') + ': not a finite number: ' + String(actual));
    }
    if (Math.abs(actual - expected) > tolerance) {
      fail((label || 'assertClose') + ': expected ' + expected + ' +/- ' + tolerance + ', got ' + actual);
    }
  }

  function assertTrue(condition, label) {
    if (!condition) {
      fail((label || 'assertTrue') + ': condition is false');
    }
  }

  function assertThrows(fn, label) {
    var threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      fail((label || 'assertThrows') + ': expected an exception');
    }
  }

  function run() {
    var list = document.getElementById('results');
    var passed = 0;
    var failed = 0;

    tests.forEach(function (t) {
      var item = document.createElement('li');
      try {
        t.fn();
        passed++;
        item.className = 'pass';
        item.textContent = 'PASS - ' + t.name;
      } catch (e) {
        failed++;
        item.className = 'fail';
        item.textContent = 'FAIL - ' + t.name + ' - ' + (e && e.message ? e.message : String(e));
      }
      list.appendChild(item);
    });

    var summary = document.getElementById('summary');
    summary.textContent = 'PASSED: ' + passed + ' FAILED: ' + failed;
    summary.className = failed === 0 ? 'pass' : 'fail';
    return { passed: passed, failed: failed };
  }

  ns.test = test;
  ns.assertEqual = assertEqual;
  ns.assertClose = assertClose;
  ns.assertTrue = assertTrue;
  ns.assertThrows = assertThrows;
  ns.run = run;
})(window.CalKesefTest = window.CalKesefTest || {});
