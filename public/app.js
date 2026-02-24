const STORAGE_KEY = 'simple-sa-mvp-state-v2';

let currentStep = 1;
let latestEstimate = null;

const form = document.getElementById('returnForm');
const supplementalScreens = [
  {
    step: 23,
    title: 'Your Tax Return',
    copy: ['Please enter the following information from the front of your tax return.'],
    rows: [
      { label: 'Date Return issued', type: 'date', name: 'date_return_issued' },
      'Tax office address line 1',
      'Tax office address line 2',
      'Tax office address line 3',
      'Tax office address line 4',
      'Postcode',
      'Tax office telephone number'
    ]
  },
  {
    step: 24,
    title: 'Residence and remittance',
    rows: [
      { label: 'To be not resident in the UK', type: 'toggle' },
      { label: 'To be eligible for overseas workday relief', type: 'toggle' },
      { label: 'Requesting split year treatment for 2024-25', type: 'toggle' },
      { label: 'That more than one case of split year treatment applies', type: 'toggle' },
      { label: 'Personal allowances under a double taxation agreement', type: 'toggle' },
      { label: 'Dual Residence under a double taxation agreement', type: 'toggle' },
      { label: 'To be domiciled outside the UK', type: 'toggle' }
    ]
  },
  {
    step: 25,
    title: 'Residence and remittance continued',
    rows: [
      { label: 'Were you resident in the UK for 2023-24?', type: 'toggle' },
      { label: 'Did you meet the third automatic overseas test in 2024-25?', type: 'toggle' },
      { label: "If you had a gap between employments in 2024-25, put 'X' in the box" },
      { label: 'Did you have a home overseas in 2024-25?', type: 'toggle' },
      { label: 'How many ties to the UK did you have in 2024-25?' }
    ]
  },
  {
    step: 26,
    title: 'Time spent in the UK',
    rows: [
      'How many days have you spent in the UK?',
      'How many days were attributable to exceptional circumstances?',
      'Days in the UK at midnight during return year, while in transit',
      'How many days did you work for more than 3 hours in the UK?',
      'How many days did you work for more than 3 hours overseas?'
    ]
  },
  {
    step: 27,
    title: 'Personal Allowances',
    rows: [
      { label: 'By virtue of the terms of a Double Taxation Agreement?', type: 'toggle' },
      { label: 'On some other basis?', type: 'toggle' },
      'Country code where you are national/resident (1)',
      'Country code where you are national/resident (2)',
      'Country code where you are national/resident (3)'
    ]
  },
  {
    step: 28,
    title: 'Dual Residence',
    rows: [
      'Resident for tax purposes for 2024-25 (excluding UK) - country code 1',
      'Resident for tax purposes for 2024-25 (excluding UK) - country code 2',
      'Resident for tax purposes for both 2023-24 and 2024-25 - code',
      { label: 'Amount of DTA income for which partial relief is claimed', type: 'number' },
      { label: 'Tax relief claimed by virtue of agreement awarding residence', type: 'number' },
      { label: 'Tax relief claimed due to other DTA provisions', type: 'number' }
    ]
  },
  {
    step: 29,
    title: 'Domicile',
    rows: [
      { label: 'Tick here if you are domiciled outside the UK', type: 'toggle' },
      { label: "Date domicile changed if 'domicile of origin' was in UK", type: 'date' },
      { label: 'Date you came to live in UK if born outside UK', type: 'date' },
      { label: 'Is 2024-25 the first year HMRC was told your domicile is outside UK?', type: 'toggle' },
      { label: 'Were you born in UK but never domiciled here?', type: 'toggle' },
      { label: 'Condition A', type: 'toggle' },
      { label: 'Condition B', type: 'toggle' },
      'Number of years resident in the UK in previous 20 years'
    ]
  },
  {
    step: 30,
    title: 'Remittance Basis',
    rows: [
      { label: 'Claim for remittance basis for 2024-25?', type: 'toggle' },
      { label: 'Unremitted income and gains less than £2,000?', type: 'toggle' },
      { label: 'UK domicile for 2024-25 and remitted earlier-year foreign income?', type: 'toggle' },
      { label: 'UK resident for 12 or more of preceding 14 tax years?', type: 'toggle' },
      { label: 'UK resident in 2024-25 and 7 of preceding 9 tax years?', type: 'toggle' },
      { label: 'Were you under 18 on 5 April 2025?', type: 'toggle' },
      { label: 'Previously claimed relief for a qualifying investment?', type: 'toggle' },
      { label: 'UK income/gains deemed foreign under qualifying asset rules?', type: 'toggle' }
    ]
  },
  {
    step: 31,
    title: 'Further information',
    rows: [{ label: 'Please provide any further information relevant to residence or domicile', type: 'textarea' }]
  },
  {
    step: 32,
    title: 'Your work',
    rows: [
      { label: 'Were you a paid or salaried employee or director?', type: 'toggle' },
      { label: 'Were you a director with no payments of any kind?', type: 'toggle' },
      { label: 'Were you a Minister of Religion?', type: 'toggle' },
      { label: 'Were you a Member of Parliament or devolved assembly?', type: 'toggle' },
      { label: 'Were you Self-Employed?', type: 'toggle' },
      { label: 'Were you in Partnership?', type: 'toggle' },
      { label: 'Did you receive a Lump Sum or Compensation Payment?', type: 'toggle' },
      { label: 'Did you make any UK patent royalty payments?', type: 'toggle' }
    ]
  },
  {
    step: 33,
    title: 'Unpaid Director and Office Holders',
    rows: ['Directors: Employer name', 'Office Holders: Employer name']
  },
  {
    step: 34,
    title: 'Employment',
    rows: [
      "Employer's Name",
      'PAYE reference',
      { label: 'Is this a foreign employer with no PAYE reference?', type: 'toggle' },
      { label: 'Were you a company director who received payment?', type: 'toggle' },
      { label: 'Date of cessation if ceased before 6 April 2025', type: 'date' },
      { label: 'Was this a close company?', type: 'toggle' },
      { label: 'Did this employment finish during 2024-25?', type: 'toggle' }
    ]
  },
  {
    step: 35,
    title: 'Fringe benefits from',
    rows: [
      'Company cars',
      'Fuel for company cars',
      'Private medical or dental insurance',
      'Vouchers, credit cards and excess mileage allowance',
      'Goods and assets provided by your employer',
      'Accommodation provided by your employer',
      'Other benefits (including low interest and interest free loans)',
      'Expenses payments'
    ]
  },
  {
    step: 36,
    title: 'Company Car & Van Wizard',
    rows: [
      'Open wizard',
      'Close wizard'
    ]
  },
  {
    step: 37,
    title: 'Car details',
    rows: [
      'Manufacturer',
      'Model',
      'Cylinder capacity (cc)',
      { label: 'Date first registered', type: 'date' },
      { label: 'Did you have the car or free fuel for the full tax year?', type: 'toggle' },
      { label: 'Is this a zero emission car or approved CO2 figure?', type: 'toggle' },
      'Approved emissions figure (g/km)',
      'Electric mileage range'
    ]
  },
  {
    step: 38,
    title: 'Car price',
    rows: [
      'List price of the car',
      'Price of accessories added to the car',
      'Lump sum contributions to buying the car/accessories',
      'Total price',
      'Amount paid to employer for private use'
    ]
  },
  {
    step: 39,
    title: 'Car fuel',
    rows: [
      { label: 'Did you receive any free fuel for private use?', type: 'toggle' },
      { label: 'Diesel cars (previously types D and L)', type: 'toggle' },
      { label: 'All other fuel types', type: 'toggle' },
      'Appropriate percentage for CO2 emissions and fuel type'
    ]
  },
  {
    step: 40,
    title: 'Car availability',
    rows: [
      { label: 'Date car first became available', type: 'date' },
      { label: 'Date car stopped being available', type: 'date' },
      'Number of days car unavailable (if 30+ day period)',
      'Total number of days unavailable',
      { label: 'Date free fuel ended during period of use', type: 'date' }
    ]
  },
  {
    step: 41,
    title: 'Car and Fuel benefit',
    rows: [
      'Make',
      'Model',
      'Car Benefit',
      'Fuel Benefit',
      'Total Car Benefit',
      'Total Fuel Benefit'
    ]
  },
  {
    step: 42,
    title: 'Expenses',
    rows: [
      'Business travel and subsistence expenses',
      'Employer paid less than HMRC approved mileage rates?',
      'Fixed deductions for expenses',
      'Professional fees and subscriptions',
      'Other expenses and capital allowances'
    ]
  },
  {
    step: 43,
    title: 'Additional Employment',
    rows: [{ label: 'Did you have another job or directorship in 2024-25?', type: 'toggle' }]
  },
  {
    step: 44,
    title: 'Ministers of religion',
    rows: [
      'Nature of your post or appointment',
      { label: 'Were you paid at a rate of £8,500 or more for the year?', type: 'toggle' },
      { label: 'Did any income come from working abroad?', type: 'toggle' },
      { label: 'Did you finish working in this post during 2024-25?', type: 'toggle' }
    ]
  },
  {
    step: 45,
    title: 'Pay received',
    rows: [
      'Salary or stipend',
      'Payroll benefits affecting student loan repayments',
      'Tax taken off salary or stipend',
      'Fees and offerings',
      'HMRC Pension contribution payment',
      'Other income from this post',
      'Tax taken off other income',
      'Student loans deducted from pay',
      'Postgraduate loans deducted from pay'
    ]
  },
  {
    step: 46,
    title: 'Expenses paid for you',
    rows: [
      'Vicarage or manse expenses paid for you',
      'Personal/living accommodation and card expenses paid for you',
      'Excess mileage allowance and passenger payments',
      'Round-sum expenses and rent allowances',
      'Tax taken off round-sum expenses and rent allowances',
      'Expenses payments made to you'
    ]
  },
  {
    step: 47,
    title: 'Fringe benefits',
    rows: [
      'Vicarage or manse services benefit',
      'Company cars',
      'Fuel for company cars',
      'Interest-free and low-interest loans',
      'Other benefits'
    ]
  },
  {
    step: 48,
    title: 'Expenses paid out',
    rows: [
      'Travelling expenses and capital allowances',
      'Maintenance, repairs and insurance of vicarage or manse',
      'Rent',
      'Secretarial assistance',
      'Other expenses'
    ]
  },
  {
    step: 49,
    title: 'Service benefit cap',
    rows: [
      'Gross income (excluding specific benefits/expenses)',
      '2024-25 pay received after 5 April 2025',
      "Earlier years' back pay received during 2024-25",
      'Payments to registered pension schemes',
      'Less expenses paid by you',
      'Net income',
      '10% of net income',
      'Amount paid towards service benefit received',
      'Vicarage/Manse benefits or expenses paid for you',
      'Service benefit cap'
    ]
  },
  {
    step: 50,
    title: 'Other income',
    rows: ['Chaplaincy and other income', 'Tax taken off']
  },
  {
    step: 51,
    title: 'Further posts',
    rows: [{ label: 'Did you receive income or taxable benefits from another post?', type: 'toggle' }]
  },
  {
    step: 52,
    title: 'Parliamentary pages',
    rows: [
      { label: 'Parliamentary details (SA102MP)', type: 'toggle' },
      { label: 'Northern Ireland Legislative Assembly (SA102MLA)', type: 'toggle' },
      { label: 'National Assembly for Wales (SA102MS)', type: 'toggle' },
      { label: 'Scottish Parliament (SA102MSP)', type: 'toggle' },
      { label: 'Did this employment finish during 2024-25?', type: 'toggle' }
    ]
  },
  {
    step: 53,
    title: 'Further posts',
    rows: [{ label: 'Do you have income from another post as a minister of parliament?', type: 'toggle' }]
  },
  {
    step: 54,
    title: 'Lump Sums',
    rows: [
      'Taxable lump sums and income after end of job',
      'Lump sums from employer financed retirement benefit scheme',
      'Exemptions for amount entered',
      'Redundancy and lump sum compensation in excess of £30,000',
      'Compensation and lump sum exemption up to £30,000',
      'Disability and foreign service deduction',
      'Tax deducted from these payments',
      { label: 'If empty, is amount reported elsewhere?', type: 'toggle' }
    ]
  },
  {
    step: 55,
    title: 'Work abroad',
    rows: [
      "Your own records reference",
      "Seafarers' Earnings deduction",
      'Any foreign earnings not taxable in the UK',
      'Any foreign tax paid without claiming foreign tax credit relief',
      'Exempt employer pension contributions to overseas pension scheme'
    ]
  },
  {
    step: 56,
    title: 'UK patent royalty payments',
    rows: ['UK patent royalty payments made']
  },
  {
    step: 57,
    title: 'Self Employment',
    rows: [
      'Business Name',
      { label: 'Date books/accounts start', type: 'date' },
      { label: 'Date books/accounts are made up to', type: 'date' },
      'Turnover for accounting period'
    ]
  },
  {
    step: 58,
    title: 'Annualised turnover',
    rows: [
      'Your turnover calculated on an annual basis',
      { label: 'Do special arrangements apply?', type: 'toggle' },
      { label: 'Have you already provided information about 2024-25 profit?', type: 'toggle' },
      { label: 'Any other reason to complete the Full Form?', type: 'toggle' }
    ]
  },
  {
    step: 59,
    title: 'Short Form - Details',
    rows: [
      'Business Name',
      'Description of business',
      'Post code of your business address',
      { label: 'Have these details changed in last 12 months?', type: 'toggle' },
      { label: 'Tick if you are a foster carer/shared lives carer', type: 'toggle' },
      { label: 'If started after 5 April 2024, enter start date', type: 'date' },
      { label: 'If ceased before 6 April 2025, enter final date', type: 'date' },
      { label: "Traditional accounting basis rather than cash basis? (X)", type: 'toggle' },
      { label: 'Are you claiming capital allowances?', type: 'toggle' }
    ]
  },
  {
    step: 60,
    title: 'Short Form - Income',
    rows: [
      'Other business income',
      'Trading income allowance (up to £1,000)'
    ]
  },
  {
    step: 61,
    title: 'Short Form - Allowable Expenses',
    rows: [
      'Cost of goods for re-sale or goods used',
      'Car, van and travel expenses',
      'Wages, salaries and other staff costs',
      'Rent, power, insurance and other property costs',
      'Repairs and maintenance of property and equipment',
      'Accountancy, legal and other professional fees',
      'Interest and bank/credit card financial charges',
      'Telephone, fax, stationery and office costs',
      'Other allowable business expenses',
      'Total allowable expenses'
    ]
  },
  {
    step: 62,
    title: 'Capital Allowances',
    rows: ['Capital Allowance Calculator']
  },
  {
    step: 63,
    title: 'Capital Allowances Wizard',
    rows: [
      { label: 'Date books/accounts start', type: 'date' },
      { label: 'Date books/accounts are made up to', type: 'date' },
      'Asset description',
      'Add new asset'
    ]
  },
  {
    step: 64,
    title: 'Capital Allowances Calculation Grid',
    rows: [
      'WDV @',
      'Additions in year',
      'Disposals',
      'Balancing Charge',
      'Balancing Allowance',
      'Net Qualifying Expenditure',
      'WDV C/F'
    ]
  },
  {
    step: 65,
    title: 'Short Form - Capital Allowances',
    rows: [
      'Annual Investment Allowance',
      'Allowance for small balance of unrelieved expenditure',
      'Zero-emission car allowance',
      'Other capital allowances',
      'The Structures and Buildings Allowance',
      'Freeport and Investment Zones Structures and Buildings Allowance',
      'Total balancing charges'
    ]
  },
  {
    step: 66,
    title: 'Short Form - Adjustments',
    rows: [
      'Trading income allowance (up to £1,000)',
      'Goods taken for your own personal use',
      'Any other income not included elsewhere',
      'Net business profit for tax purposes',
      'Net business loss for tax purposes',
      'Losses brought forward from earlier years',
      "Loss brought forward set off against this year's profits"
    ]
  },
  {
    step: 67,
    title: 'Short Form - Losses',
    rows: [
      '2024-25 allowable loss',
      'Set against other income for 2024-25',
      'Carry back to previous years',
      'Carry forward (including losses brought forward)'
    ]
  },
  {
    step: 68,
    title: 'Short Form - CIS and National Insurance',
    rows: [
      'CIS deductions',
      { label: 'Exempt from class 4 National Insurance on profits?', type: 'toggle' },
      { label: 'Pay voluntary Class 2 National Insurance?', type: 'toggle' }
    ]
  },
  {
    step: 69,
    title: 'Further businesses',
    rows: [{ label: 'Did you have another business in 2024-25?', type: 'toggle' }]
  },
  {
    step: 70,
    title: 'Partnership (Q3) Management',
    rows: ['Partnership description', 'UTR', 'Type', 'Status', 'Last imported']
  },
  {
    step: 71,
    title: 'Types of income',
    rows: [
      { label: 'Trading or professional income', type: 'toggle' },
      { label: 'Income with UK tax already deducted', type: 'toggle' },
      { label: 'Untaxed savings income', type: 'toggle' },
      { label: 'Profits or losses from UK land and property', type: 'toggle' },
      { label: 'Other untaxed UK income', type: 'toggle' },
      { label: 'Other untaxed foreign income', type: 'toggle' },
      { label: 'Income from offshore funds', type: 'toggle' }
    ]
  },
  {
    step: 72,
    title: 'Trading or professional income',
    rows: [
      { label: 'Partnership accounting period start date', type: 'date' },
      { label: 'Partnership accounting period end date', type: 'date' },
      'Your share of partnership profit or loss',
      { label: 'Use Adjustment calculator?', type: 'toggle' },
      'Tax year adjustment',
      'Adjustment for change of accounting practice',
      'Averaging adjustment',
      'Any foreign tax claimed as deduction',
      'Trading/professional losses brought forward',
      "Losses brought forward set off against this year's profit",
      'Any other business income not in partnership account',
      "Your share of taxable profits from partnership's business",
      'Your 2024-25 allowable loss from this partnership'
    ]
  },
  {
    step: 73,
    title: 'Trading losses',
    rows: [
      'In 2024-25 your allowable loss from this partnership was',
      'Set against other income for 2024-25',
      'Carry back to previous years and set off against income/capital gains',
      'Carry forward to future years (include unused losses brought forward)'
    ]
  },
  {
    step: 74,
    title: 'National Insurance',
    rows: [
      { label: 'Exempt from paying Class 4 NI on profits of this business?', type: 'toggle' },
      'Adjustment to profits chargeable to Class 4 NICs',
      { label: 'Do you want to voluntarily pay Class 2 NI?', type: 'toggle' }
    ]
  },
  {
    step: 75,
    title: 'Untaxed Interest - Short',
    rows: ['Please enter your share of untaxed interest']
  },
  {
    step: 76,
    title: 'Tax paid',
    rows: [
      'Share of tax deducted by contractors (construction subcontractor)',
      'Share of other UK tax deducted from trading income'
    ]
  },
  {
    step: 77,
    title: 'Further partnerships',
    rows: [{ label: 'Were you a member of any other partnership in 2024-25?', type: 'toggle' }]
  },
  {
    step: 78,
    title: 'Further partnerships',
    rows: [{ label: 'Add another set of partnership pages', type: 'toggle' }]
  },
  {
    step: 79,
    title: 'Any other income',
    rows: ['Details of any other taxable income not already entered']
  },
  {
    step: 80,
    title: 'Tax reliefs and allowances',
    rows: [
      'Payments to registered pension schemes',
      'Gift Aid payments',
      'Other reliefs'
    ]
  },
  {
    step: 81,
    title: 'Capital Gains Tax',
    rows: ['Net gains from disposals', 'Losses brought forward', 'Annual exempt amount used']
  }
];

function sanitizeName(value) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function renderSupplementalRow(step, row, index) {
  const normalized = typeof row === 'string' ? { label: row, type: 'text' } : row;
  const fieldName = `screens.s${step}.${normalized.name || sanitizeName(normalized.label) || `field_${index + 1}`}`;

  if (normalized.type === 'toggle') {
    return `
      <label class="tc-row toggle-row">
        <span>${normalized.label}</span>
        <input type="checkbox" name="${fieldName}" />
      </label>
    `;
  }

  if (normalized.type === 'textarea') {
    return `
      <label class="tc-row block-row">
        <span>${normalized.label}</span>
        <textarea name="${fieldName}" rows="5"></textarea>
      </label>
    `;
  }

  if (normalized.type === 'date') {
    return `
      <label class="tc-row">
        <span>${normalized.label}</span>
        <input type="date" name="${fieldName}" />
      </label>
    `;
  }

  if (normalized.type === 'number') {
    return `
      <label class="tc-row">
        <span>${normalized.label}</span>
        <input inputmode="decimal" name="${fieldName}" />
      </label>
    `;
  }

  return `
    <label class="tc-row">
      <span>${normalized.label}</span>
      <input name="${fieldName}" />
    </label>
  `;
}

function renderSupplementalScreens() {
  if (!form) return;

  const existing = new Set([...form.querySelectorAll('.tc-page')].map((node) => Number(node.dataset.step)));
  const html = supplementalScreens
    .filter((screen) => !existing.has(screen.step))
    .map((screen) => {
      const copy = (screen.copy || []).map((line) => `<p>${line}</p>`).join('');
      const rows = (screen.rows || []).map((row, index) => renderSupplementalRow(screen.step, row, index)).join('');

      return `
        <section class="tc-page" data-step="${screen.step}" hidden>
          <h2>${screen.title}</h2>
          ${copy}
          <div class="tc-grid-rows">${rows}</div>
        </section>
      `;
    })
    .join('');

  form.insertAdjacentHTML('beforeend', html);
}

renderSupplementalScreens();

const appRoot = document.querySelector('.tc-app');
const pages = [...document.querySelectorAll('.tc-page')];
const totalSteps = pages.length;
const treeStepButtons = [...document.querySelectorAll('[data-step-target]')];

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const deleteScheduleBtn = document.getElementById('deleteScheduleBtn');

const buildXmlBtn = document.getElementById('buildXmlBtn');
const submitBtn = document.getElementById('submitBtn');
const downloadXmlBtn = document.getElementById('downloadXmlBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const resetBtn = document.getElementById('resetBtn');

const xmlOutput = document.getElementById('xmlOutput');
const submissionOutput = document.getElementById('submissionOutput');
const saveStatus = document.getElementById('saveStatus');

const topTotalTax = document.getElementById('topTotalTax');
const balanceDueEl = document.getElementById('balanceDue');
const refundEl = document.getElementById('estimatedRefund');
const totalLiabilityEl = document.getElementById('totalLiability');
const breakdownRows = document.getElementById('breakdownRows');
const estimateWarnings = document.getElementById('estimateWarnings');
const timerText = document.getElementById('timerText');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
});

const defaultState = {
  taxYear: '2025-26',
  personal: {
    title: '',
    firstName: '',
    middleNames: '',
    lastName: '',
    maritalStatus: '',
    gender: '',
    email: '',
    dateOfBirth: '',
    utr: '',
    nino: '',
    ninoDifferent: false,
    region: 'england-wales-ni'
  },
  address: {
    line1: '',
    line2: '',
    line3: '',
    line4: '',
    postcode: '',
    phone: '',
    effectiveDate: ''
  },
  incomes: {
    employment: '',
    selfEmployment: '',
    property: '',
    pension: '',
    interest: '',
    dividends: '',
    other: ''
  },
  employment: {
    payrollBenefits: '',
    hmrcPensionPayment: '',
    tips: '',
    workAbroad: false,
    studentLoan: '',
    postgraduateLoan: '',
    offPayroll: false
  },
  reliefs: {
    pensionContributions: '',
    giftAid: '',
    losses: ''
  },
  alreadyPaid: {
    payeTax: '',
    cisTax: ''
  },
  declaration: {
    accepted: false,
    acceptedAt: ''
  },
  credentials: {
    senderId: '',
    password: '',
    channelUri: 'mvp.local.tax-software',
    product: 'TaxSoftwareMVP',
    productVersion: '0.1.0'
  },
  submission: {
    testMode: true
  },
  ui: {
    currentStep: 1,
    startedAt: Date.now()
  }
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const state = clone(defaultState);

function deepMerge(target, source) {
  Object.keys(source || {}).forEach((key) => {
    const sourceValue = source[key];

    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], sourceValue);
      return;
    }

    target[key] = sourceValue;
  });

  return target;
}

function pathToParts(path) {
  return path.split('.');
}

function getNested(path) {
  return pathToParts(path).reduce((acc, part) => (acc ? acc[part] : undefined), state);
}

function setNested(path, value) {
  const parts = pathToParts(path);
  let cursor = state;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!cursor[part] || typeof cursor[part] !== 'object') {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }

  cursor[parts[parts.length - 1]] = value;
}

function flashStatus(message, isError = false) {
  saveStatus.textContent = message;
  saveStatus.style.color = isError ? '#8d1d24' : '#244952';
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    deepMerge(state, parsed);
    currentStep = Number(parsed?.ui?.currentStep || 1);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveToStorage(message = 'Saved locally') {
  state.ui.currentStep = currentStep;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  flashStatus(message, false);
}

function populateForm() {
  [...form.querySelectorAll('[name]')].forEach((field) => {
    const value = getNested(field.name);

    if (field.type === 'checkbox') {
      field.checked = Boolean(value);
      return;
    }

    if (field.type === 'radio') {
      field.checked = String(value) === field.value;
      return;
    }

    field.value = value ?? '';
  });
}

function autoNameUnnamedFields() {
  const unnamed = [
    ...form.querySelectorAll('input:not([name]), select:not([name]), textarea:not([name])')
  ];

  unnamed.forEach((field, index) => {
    const page = field.closest('.tc-page');
    const step = page?.dataset?.step || 'x';
    field.name = `screens.auto.s${step}.field_${index + 1}`;
  });
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function updateStepUI() {
  pages.forEach((page, index) => {
    page.hidden = index !== currentStep - 1;
  });

  treeStepButtons.forEach((button) => {
    const target = Number(button.dataset.stepTarget);
    button.classList.toggle('active', target === currentStep);
  });

  prevBtn.disabled = currentStep === 1;
  nextBtn.disabled = currentStep === totalSteps;
  deleteScheduleBtn.hidden = currentStep < 5;

  if (currentStep === totalSteps) {
    nextBtn.textContent = 'Next Step ►';
  } else {
    nextBtn.textContent = 'Next Step ►';
  }
}

function setSidebarOpen(isOpen) {
  appRoot.classList.toggle('sidebar-open', isOpen);
  document.body.classList.toggle('no-scroll', isOpen);
  sidebarBackdrop.hidden = !isOpen;
}

function closeSidebarOnMobile() {
  if (window.matchMedia('(max-width: 980px)').matches) {
    setSidebarOpen(false);
  }
}

function coerceNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function payloadFromState() {
  return {
    taxYear: state.taxYear,
    personal: {
      firstName: state.personal.firstName,
      lastName: state.personal.lastName,
      email: state.personal.email,
      dateOfBirth: state.personal.dateOfBirth,
      utr: state.personal.utr,
      nino: state.personal.nino,
      region: state.personal.region
    },
    incomes: Object.fromEntries(
      Object.entries(state.incomes).map(([key, value]) => [key, coerceNumber(value)])
    ),
    reliefs: Object.fromEntries(
      Object.entries(state.reliefs).map(([key, value]) => [key, coerceNumber(value)])
    ),
    alreadyPaid: Object.fromEntries(
      Object.entries(state.alreadyPaid).map(([key, value]) => [key, coerceNumber(value)])
    ),
    declaration: {
      accepted: Boolean(state.declaration.accepted),
      acceptedAt: state.declaration.accepted
        ? state.declaration.acceptedAt || new Date().toISOString()
        : ''
    }
  };
}

function credentialsFromState() {
  return {
    senderId: state.credentials.senderId?.trim(),
    password: state.credentials.password,
    utr: state.personal.utr?.trim(),
    channelUri: state.credentials.channelUri?.trim(),
    product: state.credentials.product?.trim(),
    productVersion: state.credentials.productVersion?.trim()
  };
}

function renderEstimate(estimate) {
  if (!estimate?.breakdown) return;

  const { breakdown } = estimate;
  balanceDueEl.textContent = formatCurrency(breakdown.balanceDue);
  refundEl.textContent = formatCurrency(breakdown.estimatedRefund);
  totalLiabilityEl.textContent = formatCurrency(breakdown.totalLiability);
  topTotalTax.value = formatCurrency(breakdown.totalLiability);

  const rows = [
    ['Income tax', breakdown.incomeTax],
    ['National Insurance (Class 4)', breakdown.class4Nic],
    ['Total liability', breakdown.totalLiability],
    ['Tax already paid', breakdown.alreadyPaid],
    ['Estimated balance due', breakdown.balanceDue],
    ['Estimated refund', breakdown.estimatedRefund]
  ];

  breakdownRows.innerHTML = rows
    .map(([label, amount]) => `<tr><td>${label}</td><td>${formatCurrency(amount)}</td></tr>`)
    .join('');

  estimateWarnings.innerHTML = (estimate.warnings || [])
    .map((warning) => `<li>${warning}</li>`)
    .join('');
}

async function runEstimate() {
  const response = await fetch('/api/estimate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payloadFromState())
  });

  if (!response.ok) {
    throw new Error('Estimate failed');
  }

  const data = await response.json();
  latestEstimate = data.estimate;
  renderEstimate(latestEstimate);
}

function validateCurrentStep() {
  if (currentStep !== 3) return true;

  const required = ['personal.firstName', 'personal.lastName', 'personal.utr'];
  const missing = required.filter((key) => String(getNested(key) || '').trim() === '');

  if (missing.length) {
    flashStatus('Please complete first name, surname and UTR before moving on.', true);
    return false;
  }

  return true;
}

async function goToStep(nextStep) {
  currentStep = Math.max(1, Math.min(totalSteps, nextStep));
  updateStepUI();
  saveToStorage('Saved locally');

  if (currentStep >= 5) {
    try {
      await runEstimate();
    } catch {
      flashStatus('Unable to refresh estimate right now.', true);
    }
  }
  closeSidebarOnMobile();
}

async function handleFormChange(event) {
  const field = event.target;
  if (!field.name) return;

  let value;
  if (field.type === 'checkbox') {
    value = field.checked;
  } else if (field.type === 'radio') {
    if (!field.checked) return;
    value = field.value;
  } else {
    value = field.value;
  }

  setNested(field.name, value);

  if (field.name === 'declaration.accepted') {
    state.declaration.acceptedAt = field.checked ? new Date().toISOString() : '';
  }

  saveToStorage('Saved locally');

  if (currentStep >= 5) {
    try {
      await runEstimate();
    } catch {
      flashStatus('Could not refresh estimate.', true);
    }
  }
}

async function onBuildXml() {
  try {
    await runEstimate();

    const response = await fetch('/api/hmrc/xml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payload: payloadFromState(),
        credentials: credentialsFromState(),
        testMode: Boolean(state.submission.testMode)
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || 'Unable to build XML');
    }

    xmlOutput.value = data.xml;
    flashStatus('XML generated. Review before submitting.', false);
  } catch (error) {
    flashStatus(error.message || 'Could not build XML.', true);
  }
}

async function onSubmitHmrc() {
  if (!state.declaration.accepted) {
    flashStatus('Please confirm the declaration before submitting.', true);
    return;
  }

  const creds = credentialsFromState();
  if (!creds.senderId || !creds.password || !creds.utr) {
    flashStatus('Sender ID, password and UTR are required.', true);
    return;
  }

  submitBtn.disabled = true;
  flashStatus('Submitting to HMRC...', false);

  try {
    const response = await fetch('/api/hmrc/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payload: payloadFromState(),
        credentials: creds,
        testMode: Boolean(state.submission.testMode),
        xml: xmlOutput.value || undefined
      })
    });

    const data = await response.json();
    submissionOutput.value = JSON.stringify(data, null, 2);

    if (!response.ok || !data.ok) {
      throw new Error(data.error || data.hmrcError?.message || 'HMRC submission failed');
    }

    flashStatus('Submitted. Keep the correlation ID from the response.', false);
  } catch (error) {
    flashStatus(error.message || 'Submission failed.', true);
  } finally {
    submitBtn.disabled = false;
  }
}

function onDownloadXml() {
  if (!xmlOutput.value.trim()) {
    flashStatus('Build XML first, then download.', true);
    return;
  }

  const blob = new Blob([xmlOutput.value], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `self-assessment-${new Date().toISOString().slice(0, 10)}.xml`;
  link.click();
  URL.revokeObjectURL(url);
  flashStatus('XML downloaded.', false);
}

function loadSample() {
  deepMerge(state, {
    personal: {
      title: 'Mr',
      firstName: 'Andrew',
      middleNames: '',
      lastName: 'Baker',
      maritalStatus: 'Single',
      gender: 'male',
      email: 'andrew@example.com',
      dateOfBirth: '1988-07-14',
      utr: '1234567890',
      nino: 'QQ123456C',
      ninoDifferent: false,
      region: 'england-wales-ni'
    },
    address: {
      line1: '25 Baker Street',
      line2: 'Marylebone',
      line3: 'London',
      line4: '',
      postcode: 'W1U 8EQ',
      phone: '02079460000',
      effectiveDate: ''
    },
    incomes: {
      employment: '42000',
      selfEmployment: '8000',
      property: '2400',
      pension: '0',
      interest: '280',
      dividends: '1200',
      other: '0'
    },
    employment: {
      payrollBenefits: '0',
      hmrcPensionPayment: '0',
      tips: '0',
      workAbroad: false,
      studentLoan: '0',
      postgraduateLoan: '0',
      offPayroll: false
    },
    reliefs: {
      pensionContributions: '1800',
      giftAid: '200',
      losses: '0'
    },
    alreadyPaid: {
      payeTax: '6400',
      cisTax: '0'
    },
    declaration: {
      accepted: false,
      acceptedAt: ''
    },
    submission: {
      testMode: true
    }
  });

  populateForm();
  runEstimate().catch(() => {
    flashStatus('Sample loaded; estimate unavailable right now.', true);
  });
  saveToStorage('Sample data loaded');
}

function resetAll() {
  if (!window.confirm('Clear everything and start again?')) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

function bindEvents() {
  form.addEventListener('input', handleFormChange);
  form.addEventListener('change', handleFormChange);

  prevBtn.addEventListener('click', () => {
    goToStep(currentStep - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (!validateCurrentStep()) return;
    goToStep(currentStep + 1);
  });

  treeStepButtons.forEach((button) => {
    const target = Number(button.dataset.stepTarget);
    if (!Number.isFinite(target)) return;

    button.addEventListener('click', () => {
      goToStep(target);
    });
  });

  mobileMenuBtn?.addEventListener('click', () => {
    const isOpen = appRoot.classList.contains('sidebar-open');
    setSidebarOpen(!isOpen);
  });

  sidebarBackdrop?.addEventListener('click', () => {
    setSidebarOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 981px)').matches) {
      setSidebarOpen(false);
    }
  });

  buildXmlBtn?.addEventListener('click', onBuildXml);
  submitBtn?.addEventListener('click', onSubmitHmrc);
  downloadXmlBtn?.addEventListener('click', onDownloadXml);

  loadSampleBtn?.addEventListener('click', loadSample);
  resetBtn?.addEventListener('click', resetAll);
}

function startTimer() {
  const start = Number(state.ui.startedAt || Date.now());
  state.ui.startedAt = start;

  const tick = () => {
    const elapsedSeconds = Math.floor((Date.now() - start) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    timerText.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  tick();
  setInterval(tick, 1000);
}

async function init() {
  loadFromStorage();
  autoNameUnnamedFields();
  populateForm();
  bindEvents();
  startTimer();
  setSidebarOpen(false);
  await goToStep(currentStep);
  flashStatus('Saved locally', false);
}

init();
