/*
 * Cal-Kesef chart data mapping.
 * Pure function, no DOM access and no money math: it only reshapes calculate().yearly
 * into the parallel arrays the stacked chart needs (deposits at the bottom, profit on top).
 */
(function (ns) {
  'use strict';

  /*
   * toChartData(yearly) -> { years: [], deposits: [], profit: [], totals: [] }
   * yearly: [{ year, balance, deposits, profit }] as returned by CalKesef.calculate().
   * totals[i] is yearly[i].balance, so the last total equals futureValue.
   */
  function toChartData(yearly) {
    if (!Array.isArray(yearly) || yearly.length === 0) {
      throw new TypeError('toChartData: yearly must be a non-empty array');
    }
    var data = { years: [], deposits: [], profit: [], totals: [] };
    yearly.forEach(function (row) {
      data.years.push(row.year);
      data.deposits.push(row.deposits);
      data.profit.push(row.profit);
      data.totals.push(row.balance);
    });
    return data;
  }

  ns.toChartData = toChartData;
})(window.CalKesef = window.CalKesef || {});
