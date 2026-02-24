import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  HMRC_ENDPOINTS,
  buildGovTalkDeleteXml,
  buildGovTalkPollXml,
  buildGovTalkSubmissionXml,
  detectHmrcError,
  summariseHmrcResponse
} from './src/hmrcXml.js';
import { calculateTaxEstimate } from './src/taxCalculator.js';

const app = express();
const port = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const toBool = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

const timeoutMs = Number(process.env.HMRC_TIMEOUT_MS || 25_000);

const validateCredentials = (credentials = {}) => {
  const missing = [];

  if (!credentials.senderId) missing.push('senderId');
  if (!credentials.password) missing.push('password');
  if (!credentials.utr) missing.push('utr');

  return missing;
};

async function submitToHmrc({ xml, testMode }) {
  const endpoint = testMode ? HMRC_ENDPOINTS.test : HMRC_ENDPOINTS.live;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        Accept: 'application/xml'
      },
      body: xml,
      signal: controller.signal
    });

    const body = await response.text();
    const summary = summariseHmrcResponse(body);
    const hmrcError = detectHmrcError(body);

    return {
      ok: response.ok && !hmrcError,
      endpoint,
      statusCode: response.status,
      summary,
      hmrcError,
      body
    };
  } finally {
    clearTimeout(timer);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'self-assessment-mvp',
    taxYear: '2025-26'
  });
});

app.post('/api/estimate', (req, res) => {
  const estimate = calculateTaxEstimate(req.body || {});
  res.json({ ok: true, estimate });
});

app.post('/api/hmrc/xml', (req, res) => {
  const { payload = {}, credentials = {}, testMode = true } = req.body || {};
  const estimate = calculateTaxEstimate(payload);
  const xml = buildGovTalkSubmissionXml({
    payload,
    estimate,
    credentials,
    testMode: toBool(testMode, true)
  });

  res.json({
    ok: true,
    xml,
    estimate,
    endpoints: HMRC_ENDPOINTS,
    notes: [
      'Review this XML against the latest HMRC RIM artefacts before live submission.',
      'You need HMRC-recognised software credentials and complete mandatory SA100 fields for production filing.'
    ]
  });
});

app.post('/api/hmrc/submit', async (req, res) => {
  try {
    const {
      payload,
      credentials = {},
      testMode = true,
      xml: providedXml,
      dryRun = false
    } = req.body || {};

    const missing = validateCredentials(credentials);
    if (missing.length > 0) {
      return res.status(400).json({
        ok: false,
        error: `Missing credentials: ${missing.join(', ')}`
      });
    }

    const effectiveTestMode = toBool(testMode, true);
    const estimate = payload ? calculateTaxEstimate(payload) : null;
    const xml =
      providedXml ||
      buildGovTalkSubmissionXml({
        payload: payload || {},
        estimate: estimate || {},
        credentials,
        testMode: effectiveTestMode
      });

    if (toBool(dryRun, false)) {
      return res.json({
        ok: true,
        dryRun: true,
        endpoint: effectiveTestMode ? HMRC_ENDPOINTS.test : HMRC_ENDPOINTS.live,
        xml,
        estimate
      });
    }

    const result = await submitToHmrc({ xml, testMode: effectiveTestMode });

    return res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      endpoint: result.endpoint,
      statusCode: result.statusCode,
      summary: result.summary,
      hmrcError: result.hmrcError,
      body: result.body,
      estimate
    });
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    return res.status(isAbort ? 504 : 500).json({
      ok: false,
      error: isAbort
        ? `HMRC request timed out after ${timeoutMs}ms`
        : `Failed to submit return: ${error.message}`
    });
  }
});

app.post('/api/hmrc/poll', async (req, res) => {
  try {
    const {
      credentials = {},
      correlationId,
      className = 'HMRC-SA-SA100',
      testMode = true,
      dryRun = false
    } = req.body || {};

    const missing = validateCredentials(credentials);
    if (!correlationId) missing.push('correlationId');
    if (missing.length > 0) {
      return res.status(400).json({ ok: false, error: `Missing fields: ${missing.join(', ')}` });
    }

    const effectiveTestMode = toBool(testMode, true);
    const xml = buildGovTalkPollXml({
      credentials,
      correlationId,
      className,
      testMode: effectiveTestMode
    });

    if (toBool(dryRun, false)) {
      return res.json({ ok: true, dryRun: true, xml });
    }

    const result = await submitToHmrc({ xml, testMode: effectiveTestMode });

    return res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      endpoint: result.endpoint,
      statusCode: result.statusCode,
      summary: result.summary,
      hmrcError: result.hmrcError,
      body: result.body
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: `Failed to poll submission: ${error.message}` });
  }
});

app.post('/api/hmrc/delete', async (req, res) => {
  try {
    const {
      credentials = {},
      correlationId,
      className = 'HMRC-SA-SA100',
      testMode = true,
      dryRun = false
    } = req.body || {};

    const missing = validateCredentials(credentials);
    if (!correlationId) missing.push('correlationId');
    if (missing.length > 0) {
      return res.status(400).json({ ok: false, error: `Missing fields: ${missing.join(', ')}` });
    }

    const effectiveTestMode = toBool(testMode, true);
    const xml = buildGovTalkDeleteXml({
      credentials,
      correlationId,
      className,
      testMode: effectiveTestMode
    });

    if (toBool(dryRun, false)) {
      return res.json({ ok: true, dryRun: true, xml });
    }

    const result = await submitToHmrc({ xml, testMode: effectiveTestMode });

    return res.status(result.ok ? 200 : 502).json({
      ok: result.ok,
      endpoint: result.endpoint,
      statusCode: result.statusCode,
      summary: result.summary,
      hmrcError: result.hmrcError,
      body: result.body
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: `Failed to delete submission: ${error.message}` });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Self-assessment MVP running on http://localhost:${port}`);
});
