# Simple UK Self Assessment MVP

A lightweight self-assessment prototype for UK individuals.

It provides:
- A plain-language, step-by-step filing journey
- Local autosave and review workflow
- 2025-26 tax estimate breakdown (England/Wales/NI assumptions)
- Draft GovTalk XML generation for the HMRC Self Assessment Online XML channel
- Optional submission to HMRC test/live Transaction Engine endpoints

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What this project is and is not

This is an MVP intended for product/UX validation and technical prototyping. It is **not production-ready filing software**.

Reasons:
- HMRC SA100 XML schemas include many mandatory fields and edge-case rules not fully modelled here.
- HMRC recognition, production credentials, and full regression against latest RIM artefacts are required for real filing software.
- Tax calculation logic here is intentionally simplified.

## API routes

- `GET /api/health`
- `POST /api/estimate`
- `POST /api/hmrc/xml`
- `POST /api/hmrc/submit`
- `POST /api/hmrc/poll`
- `POST /api/hmrc/delete`

### Sample estimate request

```json
{
  "taxYear": "2025-26",
  "personal": {
    "firstName": "Jordan",
    "lastName": "Patel",
    "utr": "1234567890",
    "region": "england-wales-ni"
  },
  "incomes": {
    "employment": 42000,
    "selfEmployment": 8000,
    "interest": 280,
    "dividends": 1200
  },
  "reliefs": {
    "pensionContributions": 1800,
    "giftAid": 200
  },
  "alreadyPaid": {
    "payeTax": 6400
  }
}
```

## HMRC references used

- Self Assessment Online XML service collection (HMRC Developer Hub):
  [https://developer.service.hmrc.gov.uk/api-documentation/docs/api/xml/Self%20Assessment%20Online](https://developer.service.hmrc.gov.uk/api-documentation/docs/api/xml/Self%20Assessment%20Online)
- HMRC SA technical specifications collection:
  [https://www.gov.uk/government/collections/self-assessment-technical-specifications-2026-for-individual-returns](https://www.gov.uk/government/collections/self-assessment-technical-specifications-2026-for-individual-returns)
- Current submission endpoints (from Transaction Engine support docs):
  - Test: `https://test-transaction-engine.tax.service.gov.uk/submission`
  - Live: `https://transaction-engine.tax.service.gov.uk/submission`
- Income tax rates and personal allowances:
  [https://www.gov.uk/income-tax-rates](https://www.gov.uk/income-tax-rates)
- Dividend tax:
  [https://www.gov.uk/tax-on-dividends](https://www.gov.uk/tax-on-dividends)

## Implementation notes

- Tax logic: `src/taxCalculator.js`
- XML builders: `src/hmrcXml.js`
- HTTP routes: `server.js`
- Frontend UI: `public/index.html`, `public/styles.css`, `public/app.js`
- Tests: `tests/taxCalculator.test.js`

## Next production-hardening steps

1. Replace draft SA100 body mapping with complete RIM artefact mapping for all supported return types.
2. Validate XML against latest HMRC schemas and enforce full field-level validation.
3. Implement authenticated user accounts, encrypted storage, audit logs, and secure secret handling.
4. Expand calculator for Scottish rates, additional reliefs, student loan plans, and payments on account.
5. Add accessibility and usability testing with individual taxpayers before launch.
