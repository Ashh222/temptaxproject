const STORAGE_KEY = 'simple-sa-mvp-state-v1';
const totalSteps = 5;
let currentStep = 1;
let latestEstimate = null;

const form = document.getElementById('returnForm');
const stepCards = [...document.querySelectorAll('.step-card')];
const stepDots = [...document.querySelectorAll('#stepDots li')];
const meterFill = document.getElementById('meterFill');
const saveStatus = document.getElementById('saveStatus');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const buildXmlBtn = document.getElementById('buildXmlBtn');
const submitBtn = document.getElementById('submitBtn');
const downloadXmlBtn = document.getElementById('downloadXmlBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const resetBtn = document.getElementById('resetBtn');

const xmlOutput = document.getElementById('xmlOutput');
const submissionOutput = document.getElementById('submissionOutput');

const balanceDueEl = document.getElementById('balanceDue');
const refundEl = document.getElementById('estimatedRefund');
const totalLiabilityEl = document.getElementById('totalLiability');
const breakdownRows = document.getElementById('breakdownRows');
const estimateWarnings = document.getElementById('estimateWarnings');

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
});

const defaultState = {
  taxYear: '2025-26',
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    utr: '',
    nino: '',
    region: 'england-wales-ni'
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
    currentStep: 1
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

function flashStatus(message, isError) {
  saveStatus.textContent = message;
  saveStatus.style.color = isError ? '#8a2e1c' : '#2f5f55';
}

function populateForm() {
  [...form.querySelectorAll('[name]')].forEach((field) => {
    const path = field.name;
    const value = getNested(path);

    if (field.type === 'checkbox') {
      field.checked = Boolean(value);
      return;
    }

    field.value = value ?? '';
  });
}

function coerceNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function payloadFromState() {
  return {
    taxYear: state.taxYear,
    personal: { ...state.personal },
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

function updateStepUi() {
  stepCards.forEach((card, index) => {
    card.hidden = index !== currentStep - 1;
  });

  stepDots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentStep - 1);
  });

  const pct = (currentStep / totalSteps) * 100;
  meterFill.style.width = `${pct}%`;
  meterFill.parentElement.setAttribute('aria-valuenow', String(Math.round(pct)));

  prevBtn.disabled = currentStep === 1;
  nextBtn.textContent = currentStep === totalSteps ? 'Stay on this step' : 'Continue';
  nextBtn.disabled = currentStep === totalSteps;
}

function formatCurrency(value) {
  return currencyFormatter.format(Number(value || 0));
}

function renderEstimate(estimate) {
  if (!estimate?.breakdown) return;

  const { breakdown } = estimate;
  balanceDueEl.textContent = formatCurrency(breakdown.balanceDue);
  refundEl.textContent = formatCurrency(breakdown.estimatedRefund);
  totalLiabilityEl.textContent = formatCurrency(breakdown.totalLiability);

  const rows = [
    ['Income tax', breakdown.incomeTax],
    ['National Insurance (Class 4)', breakdown.class4Nic],
    ['Total liability', breakdown.totalLiability],
    ['Tax already paid', breakdown.alreadyPaid],
    ['Estimated balance due', breakdown.balanceDue],
    ['Estimated refund', breakdown.estimatedRefund]
  ];

  breakdownRows.innerHTML = rows
    .map(
      ([label, value]) =>
        `<tr><td>${label}</td><td>${formatCurrency(value)}</td></tr>`
    )
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
  if (currentStep !== 1) return true;

  const requiredNames = ['personal.firstName', 'personal.lastName', 'personal.utr'];
  const missing = requiredNames.filter((name) => {
    const value = String(getNested(name) || '').trim();
    return value.length === 0;
  });

  if (missing.length > 0) {
    flashStatus('Please complete first name, last name, and UTR to continue.', true);
    return false;
  }

  return true;
}

async function handleFormChange(event) {
  const field = event.target;
  if (!field.name) return;

  const value = field.type === 'checkbox' ? field.checked : field.value;
  setNested(field.name, value);

  if (field.name === 'declaration.accepted') {
    state.declaration.acceptedAt = field.checked ? new Date().toISOString() : '';
  }

  saveToStorage('Saved locally');

  if (currentStep >= 4) {
    try {
      await runEstimate();
    } catch {
      flashStatus('Could not refresh estimate right now.', true);
    }
  }
}

async function goToStep(nextStep) {
  currentStep = Math.max(1, Math.min(totalSteps, nextStep));
  updateStepUi();
  saveToStorage();

  if (currentStep >= 4) {
    try {
      await runEstimate();
    } catch {
      flashStatus('Estimate refresh failed. Please try again.', true);
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
    flashStatus(error.message || 'Could not build XML', true);
  }
}

async function onSubmitHmrc() {
  if (!state.declaration.accepted) {
    flashStatus('Accept the declaration before submitting.', true);
    return;
  }

  const creds = credentialsFromState();
  if (!creds.senderId || !creds.password || !creds.utr) {
    flashStatus('Sender ID, password, and UTR are required for submission.', true);
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

    flashStatus('Submitted successfully. Save the correlation ID from the response.', false);
  } catch (error) {
    flashStatus(error.message || 'Submission failed', true);
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
      firstName: 'Jordan',
      lastName: 'Patel',
      email: 'jordan@example.com',
      dateOfBirth: '1988-07-14',
      utr: '1234567890',
      nino: 'QQ123456C',
      region: 'england-wales-ni'
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
  saveToStorage('Sample data loaded');
}

function resetAll() {
  if (!window.confirm('Clear everything and start again?')) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

function registerEvents() {
  form.addEventListener('input', handleFormChange);
  form.addEventListener('change', handleFormChange);

  nextBtn.addEventListener('click', async () => {
    if (!validateCurrentStep()) return;
    await goToStep(currentStep + 1);
  });

  prevBtn.addEventListener('click', async () => {
    await goToStep(currentStep - 1);
  });

  buildXmlBtn.addEventListener('click', onBuildXml);
  submitBtn.addEventListener('click', onSubmitHmrc);
  downloadXmlBtn.addEventListener('click', onDownloadXml);
  loadSampleBtn.addEventListener('click', loadSample);
  resetBtn.addEventListener('click', resetAll);
}

async function init() {
  loadFromStorage();
  populateForm();
  registerEvents();
  await goToStep(currentStep);
  flashStatus('Saved locally', false);
}

init();
