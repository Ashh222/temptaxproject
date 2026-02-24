const STORAGE_KEY = 'simple-sa-mvp-state-v2';

let currentStep = 1;
let latestEstimate = null;

const form = document.getElementById('returnForm');
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
  populateForm();
  bindEvents();
  startTimer();
  setSidebarOpen(false);
  await goToStep(currentStep);
  flashStatus('Saved locally', false);
}

init();
