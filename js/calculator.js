/*
 * Cal-Kesef calculation module.
 * Pure functions only: no DOM access. Single source of financial logic (PRD section 5).
 */
(function (ns) {
  'use strict';

  // Input ranges and defaults (PRD section 5, "Input ranges").
  var RANGES = Object.freeze({
    initial: Object.freeze({ min: 0, max: 1000000, step: 100, defaultValue: 1000, integer: false }),
    monthly: Object.freeze({ min: 0, max: 20000, step: 50, defaultValue: 200, integer: false }),
    years: Object.freeze({ min: 1, max: 50, step: 1, defaultValue: 20, integer: true }),
    annualRatePct: Object.freeze({ min: 0, max: 20, step: 0.5, defaultValue: 10, integer: false })
  });

  /*
   * Parses raw text from an input field.
   * Returns a finite number, or null when the text is empty or not a finite number.
   */
  function parseInput(raw) {
    if (typeof raw === 'number') {
      return isFinite(raw) ? raw : null;
    }
    if (typeof raw !== 'string') {
      return null;
    }
    var text = raw.trim();
    if (text === '') {
      return null;
    }
    var value = Number(text);
    return isFinite(value) ? value : null;
  }

  /*
   * Clamps a finite number to the range of the named input.
   * Returns { value, clamped, bound } where bound is 'min' | 'max' | null,
   * or null when the value is not a finite number or the name is unknown.
   * Years are rounded to whole years so yearly[] stays well defined.
   */
  function normalizeInput(name, value) {
    var range = RANGES[name];
    if (!range || typeof value !== 'number' || !isFinite(value)) {
      return null;
    }
    var v = range.integer ? Math.round(value) : value;
    if (v < range.min) {
      return { value: range.min, clamped: true, bound: 'min' };
    }
    if (v > range.max) {
      return { value: range.max, clamped: true, bound: 'max' };
    }
    return { value: v, clamped: false, bound: null };
  }

  function isInRange(name, value) {
    var range = RANGES[name];
    return !!range && typeof value === 'number' && isFinite(value) &&
      value >= range.min && value <= range.max;
  }

  // Balance after `months` months: initial at month 0, deposits at the end of each month.
  function balanceAt(initial, monthly, monthlyRate, months) {
    if (monthlyRate === 0) {
      return initial + monthly * months;
    }
    var growth = Math.pow(1 + monthlyRate, months);
    return initial * growth + monthly * (growth - 1) / monthlyRate;
  }

  /*
   * calculate({ initial, monthly, years, annualRatePct })
   *   -> { futureValue, totalDeposits, profit, yearly: [{ year, balance, deposits, profit }] }
   * Monthly rate from the effective annual return: r_m = (1 + R)^(1/12) - 1.
   * Throws on invalid input; callers must validate with parseInput / normalizeInput first.
   */
  function calculate(params) {
    var p = params || {};
    var names = ['initial', 'monthly', 'years', 'annualRatePct'];
    for (var i = 0; i < names.length; i++) {
      if (!isInRange(names[i], p[names[i]])) {
        throw new RangeError('Invalid input: ' + names[i]);
      }
    }
    if (Math.round(p.years) !== p.years) {
      throw new RangeError('Invalid input: years must be a whole number');
    }

    var initial = p.initial;
    var monthly = p.monthly;
    var years = p.years;
    var annualRate = p.annualRatePct / 100;
    var monthlyRate = annualRate === 0 ? 0 : Math.pow(1 + annualRate, 1 / 12) - 1;

    var yearly = [];
    for (var y = 0; y <= years; y++) {
      var months = y * 12;
      var balance = balanceAt(initial, monthly, monthlyRate, months);
      var deposits = initial + monthly * months;
      yearly.push({ year: y, balance: balance, deposits: deposits, profit: balance - deposits });
    }

    var last = yearly[years];
    return {
      futureValue: last.balance,
      totalDeposits: last.deposits,
      profit: last.profit,
      yearly: yearly
    };
  }

  ns.RANGES = RANGES;
  ns.parseInput = parseInput;
  ns.normalizeInput = normalizeInput;
  ns.isInRange = isInRange;
  ns.calculate = calculate;
})(window.CalKesef = window.CalKesef || {});
