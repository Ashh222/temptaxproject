const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clamp = (value, min = 0) => Math.max(min, value);

export const TAX_CONFIG = {
  taxYear: '2025-26',
  personalAllowance: 12_570,
  personalAllowanceTaperStart: 100_000,
  additionalRateThreshold: 125_140,
  basicRateBand: 37_700,
  startingSavingsRateBand: 5_000,
  personalSavingsAllowanceBasic: 1_000,
  personalSavingsAllowanceHigher: 500,
  dividendAllowance: 500,
  rates: {
    nonSavings: {
      basic: 0.2,
      higher: 0.4,
      additional: 0.45
    },
    savings: {
      basic: 0.2,
      higher: 0.4,
      additional: 0.45
    },
    dividends: {
      basic: 0.0875,
      higher: 0.3375,
      additional: 0.3935
    },
    class4: {
      mainRate: 0.06,
      upperRate: 0.02,
      lowerThreshold: 12_570,
      upperThreshold: 50_270
    }
  }
};

const computePersonalAllowance = (adjustedNetIncome) => {
  if (adjustedNetIncome <= TAX_CONFIG.personalAllowanceTaperStart) {
    return TAX_CONFIG.personalAllowance;
  }

  const reduction = (adjustedNetIncome - TAX_CONFIG.personalAllowanceTaperStart) / 2;
  return clamp(TAX_CONFIG.personalAllowance - reduction);
};

const allocateToBands = (amount, capacities) => {
  let remaining = clamp(amount);

  const basic = Math.min(remaining, capacities.basic);
  remaining -= basic;
  capacities.basic -= basic;

  const higher = Math.min(remaining, capacities.higher);
  remaining -= higher;
  capacities.higher -= higher;

  const additional = remaining;

  return {
    basic,
    higher,
    additional
  };
};

const applyZeroRateAllowance = (allocation, allowance) => {
  let remainingAllowance = clamp(allowance);

  const basicReduction = Math.min(allocation.basic, remainingAllowance);
  remainingAllowance -= basicReduction;

  const higherReduction = Math.min(allocation.higher, remainingAllowance);
  remainingAllowance -= higherReduction;

  const additionalReduction = Math.min(allocation.additional, remainingAllowance);

  return {
    basic: allocation.basic - basicReduction,
    higher: allocation.higher - higherReduction,
    additional: allocation.additional - additionalReduction,
    zeroRated: basicReduction + higherReduction + additionalReduction
  };
};

const bandTax = (allocation, rates) =>
  allocation.basic * rates.basic +
  allocation.higher * rates.higher +
  allocation.additional * rates.additional;

export function calculateTaxEstimate(payload = {}) {
  const incomes = payload.incomes ?? {};
  const reliefs = payload.reliefs ?? {};
  const alreadyPaid = payload.alreadyPaid ?? {};

  const employment = toNumber(incomes.employment);
  const selfEmployment = toNumber(incomes.selfEmployment);
  const property = toNumber(incomes.property);
  const pension = toNumber(incomes.pension);
  const interest = toNumber(incomes.interest);
  const dividends = toNumber(incomes.dividends);
  const other = toNumber(incomes.other);

  const pensionContributions = toNumber(reliefs.pensionContributions);
  const giftAid = toNumber(reliefs.giftAid);
  const losses = toNumber(reliefs.losses);

  const payeTax = toNumber(alreadyPaid.payeTax);
  const cisTax = toNumber(alreadyPaid.cisTax);

  const nonSavingsIncome = employment + selfEmployment + property + pension + other - losses;
  const savingsIncome = interest;
  const dividendIncome = dividends;
  const totalIncome = nonSavingsIncome + savingsIncome + dividendIncome;

  const bandExtension = pensionContributions + giftAid;
  const adjustedNetIncome = totalIncome - bandExtension;
  const personalAllowance = computePersonalAllowance(adjustedNetIncome);

  let allowanceRemaining = personalAllowance;

  const taxableNonSavings = clamp(nonSavingsIncome - allowanceRemaining);
  allowanceRemaining = clamp(allowanceRemaining - nonSavingsIncome);

  const taxableSavings = clamp(savingsIncome - allowanceRemaining);
  allowanceRemaining = clamp(allowanceRemaining - savingsIncome);

  const taxableDividends = clamp(dividendIncome - allowanceRemaining);

  const basicRateBand = TAX_CONFIG.basicRateBand + bandExtension;
  const additionalThresholdTaxable = clamp(
    TAX_CONFIG.additionalRateThreshold - personalAllowance + bandExtension
  );
  const higherRateBand = clamp(additionalThresholdTaxable - basicRateBand);

  const capacities = {
    basic: basicRateBand,
    higher: higherRateBand
  };

  const nonSavingsAllocation = allocateToBands(taxableNonSavings, capacities);
  const savingsAllocation = allocateToBands(taxableSavings, capacities);
  const dividendsAllocation = allocateToBands(taxableDividends, capacities);

  const nonSavingsTax = bandTax(nonSavingsAllocation, TAX_CONFIG.rates.nonSavings);

  const taxableIncome = taxableNonSavings + taxableSavings + taxableDividends;
  let personalSavingsAllowance = TAX_CONFIG.personalSavingsAllowanceBasic;
  if (taxableIncome > basicRateBand + higherRateBand) {
    personalSavingsAllowance = 0;
  } else if (taxableIncome > basicRateBand) {
    personalSavingsAllowance = TAX_CONFIG.personalSavingsAllowanceHigher;
  }

  const startingRateAllowance = clamp(
    TAX_CONFIG.startingSavingsRateBand - taxableNonSavings
  );
  const savingsZeroRateAllowance = Math.min(
    taxableSavings,
    startingRateAllowance + personalSavingsAllowance
  );
  const taxableSavingsAfterAllowances = applyZeroRateAllowance(
    savingsAllocation,
    savingsZeroRateAllowance
  );
  const savingsTax = bandTax(taxableSavingsAfterAllowances, TAX_CONFIG.rates.savings);

  const dividendZeroAllowance = Math.min(taxableDividends, TAX_CONFIG.dividendAllowance);
  const taxableDividendsAfterAllowance = applyZeroRateAllowance(
    dividendsAllocation,
    dividendZeroAllowance
  );
  const dividendTax = bandTax(
    taxableDividendsAfterAllowance,
    TAX_CONFIG.rates.dividends
  );

  const class4Main = clamp(
    Math.min(selfEmployment, TAX_CONFIG.rates.class4.upperThreshold) -
      TAX_CONFIG.rates.class4.lowerThreshold
  );
  const class4Upper = clamp(selfEmployment - TAX_CONFIG.rates.class4.upperThreshold);
  const class4Nic =
    class4Main * TAX_CONFIG.rates.class4.mainRate +
    class4Upper * TAX_CONFIG.rates.class4.upperRate;

  const incomeTax = nonSavingsTax + savingsTax + dividendTax;
  const nationalInsurance = class4Nic;
  const totalLiability = incomeTax + nationalInsurance;
  const alreadyPaidTotal = payeTax + cisTax;
  const remainingBalance = totalLiability - alreadyPaidTotal;

  return {
    taxYear: TAX_CONFIG.taxYear,
    assumptions: {
      region: payload.personal?.region || 'england-wales-ni',
      basis: 'Estimate uses 2025-26 England/Wales/NI rates and bands.'
    },
    inputs: {
      totalIncome: roundMoney(totalIncome),
      taxableIncome: roundMoney(taxableIncome),
      adjustedNetIncome: roundMoney(adjustedNetIncome),
      personalAllowance: roundMoney(personalAllowance),
      bandExtension: roundMoney(bandExtension)
    },
    breakdown: {
      nonSavingsTax: roundMoney(nonSavingsTax),
      savingsTax: roundMoney(savingsTax),
      dividendTax: roundMoney(dividendTax),
      incomeTax: roundMoney(incomeTax),
      class4Nic: roundMoney(class4Nic),
      nationalInsurance: roundMoney(nationalInsurance),
      totalLiability: roundMoney(totalLiability),
      alreadyPaid: roundMoney(alreadyPaidTotal),
      balanceDue: roundMoney(Math.max(remainingBalance, 0)),
      estimatedRefund: roundMoney(Math.max(-remainingBalance, 0))
    },
    allocations: {
      nonSavings: {
        taxable: roundMoney(taxableNonSavings),
        ...Object.fromEntries(
          Object.entries(nonSavingsAllocation).map(([band, amount]) => [band, roundMoney(amount)])
        )
      },
      savings: {
        taxable: roundMoney(taxableSavings),
        startingRateAllowance: roundMoney(startingRateAllowance),
        personalSavingsAllowance: roundMoney(personalSavingsAllowance),
        zeroRated: roundMoney(taxableSavingsAfterAllowances.zeroRated),
        basic: roundMoney(taxableSavingsAfterAllowances.basic),
        higher: roundMoney(taxableSavingsAfterAllowances.higher),
        additional: roundMoney(taxableSavingsAfterAllowances.additional)
      },
      dividends: {
        taxable: roundMoney(taxableDividends),
        dividendAllowanceUsed: roundMoney(taxableDividendsAfterAllowance.zeroRated),
        basic: roundMoney(taxableDividendsAfterAllowance.basic),
        higher: roundMoney(taxableDividendsAfterAllowance.higher),
        additional: roundMoney(taxableDividendsAfterAllowance.additional)
      }
    },
    warnings: [
      'This is a simplified estimate and not a substitute for HMRC’s full calculation engine.',
      'Scottish income tax bands and special cases are not modelled in this MVP.'
    ]
  };
}
