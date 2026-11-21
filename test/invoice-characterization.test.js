var test = require('node:test');
var assert = require('node:assert/strict');

var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');
var reports = require('../lib/reports');

function billedOrder(overrides) {
  var order = {
    id: 9001,
    date: '01/01/2022',
    customer: 'Characterization Customer',
    paymentMode: 'cash',
    status: 'completed',
    coupon: 'SAVE10',
    items: [{
      id: 1,
      sku: 'GRN-001',
      name: 'Rice',
      hsn: '1006',
      price: 640,
      qty: 1
    }],
    subtotal: 640,
    discount: 64,
    tax: 28.8,
    total: 604.8
  };

  Object.assign(order, overrides || {});
  return order;
}

test('CURRENT BEHAVIOUR: checkout pricing uses the HSN rate after a percentage coupon', function () {
  var totals = pricing.computeTotals(billedOrder().items, 'SAVE10');

  assert.deepEqual(totals, {
    subtotal: 640,
    discount: 64,
    taxable: 576,
    tax: 28.8,
    cgst: 14.4,
    sgst: 14.4,
    total: 604.8,
    lines: [{
      id: 1,
      name: 'Rice',
      hsn: '1006',
      gstPercent: 5,
      gross: 640,
      discount: 64,
      taxable: 576,
      tax: 28.8,
      net: 604.8
    }]
  });
});

test('invoice uses the checkout HSN rate when an order line has no gstRate', function () {
  var figures = invoice.computeInvoiceFigures(billedOrder());

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.rows[0].lineTax, 28.8);
  assert.equal(figures.tax, 28.8);
  assert.equal(figures.discount, 64);
  assert.equal(figures.total, 604.8);
});

test('reconciliation reports a match when invoice and checkout use the same calculation', function () {
  var reconciliation = reports.getGstReconciliation({
    orders: [billedOrder()],
    products: [],
    customers: []
  });

  assert.equal(reconciliation.totalChecked, 1);
  assert.equal(reconciliation.mismatchCount, 0);
  assert.equal(reconciliation.totalDelta, 0);
  assert.deepEqual(reconciliation.rows[0], {
    orderId: 9001,
    date: '01/01/2022',
    customer: 'Characterization Customer',
    coupon: 'SAVE10',
    ledgerSubtotal: 640,
    ledgerDiscount: 64,
    ledgerTax: 28.8,
    ledgerTotal: 604.8,
    invoiceDiscount: 64,
    invoiceTax: 28.8,
    invoiceTotal: 604.8,
    delta: 0,
    matched: true
  });
});

test('invoice applies a flat coupon before calculating GST', function () {
  var item = {
    id: 6,
    sku: 'DRY-001',
    name: 'Ghee',
    hsn: '0405',
    gstRate: 12,
    price: 400,
    qty: 1
  };
  var billed = pricing.computeTotals([item], 'FLAT50');
  var figures = invoice.computeInvoiceFigures(billedOrder({
    coupon: 'FLAT50',
    items: [item],
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  }));

  assert.equal(billed.tax, 42);
  assert.equal(billed.total, 392);
  assert.equal(figures.tax, 42);
  assert.equal(figures.total, 392);
});
