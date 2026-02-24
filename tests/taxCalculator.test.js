import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTaxEstimate } from '../src/taxCalculator.js';

const approx = (actual, expected, epsilon = 0.01) => {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `Expected ${actual} to be within ${epsilon} of ${expected}`
  );
};

test('returns zero liability for no income', () => {
  const result = calculateTaxEstimate({
    incomes: {},
    reliefs: {},
    alreadyPaid: {}
  });

  assert.equal(result.breakdown.totalLiability, 0);
  assert.equal(result.breakdown.balanceDue, 0);
  assert.equal(result.breakdown.estimatedRefund, 0);
});

test('calculates non-savings income tax for employment income', () => {
  const result = calculateTaxEstimate({
    incomes: {
      employment: 60000
    }
  });

  approx(result.breakdown.incomeTax, 11432);
  approx(result.breakdown.totalLiability, 11432);
});

test('adds class 4 NIC for self-employment profits', () => {
  const result = calculateTaxEstimate({
    incomes: {
      selfEmployment: 60000
    }
  });

  approx(result.breakdown.incomeTax, 11432);
  approx(result.breakdown.class4Nic, 2456.6);
  approx(result.breakdown.totalLiability, 13888.6);
});

test('applies personal allowance before dividend allowance', () => {
  const result = calculateTaxEstimate({
    incomes: {
      dividends: 1000
    }
  });

  approx(result.breakdown.incomeTax, 0);
  approx(result.allocations.dividends.taxable, 0);
});

test('tapers personal allowance on high income', () => {
  const result = calculateTaxEstimate({
    incomes: {
      employment: 120000
    }
  });

  approx(result.inputs.personalAllowance, 2570);
  approx(result.breakdown.incomeTax, 39432);
});
