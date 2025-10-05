## 📘 FastAgent Security Schema Validation Framework

### Overview

This repository provides a **complete schema validation suite** for verifying external backend configurations used by **FastAgent**.
It ensures that all API and MCP (Model Context Protocol) endpoints — especially those using **advanced security protocols like mTLS, shared trust stores, and certificate pinning** — are **schema-compliant and safely configured** before deployment.

---

## 🧩 Features

### 🔒 Security Protocol Coverage

The schema fully supports and validates:

| Security Feature                                 | Description                                                                                          |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **mTLS (Mutual TLS)**                            | Client certificate authentication with optional private keys, PKCS#12, JWK, PEM, or HSM-backed keys. |
| **Shared CA Trust Stores**                       | Define reusable trust anchors (`TrustStore` objects) for multiple endpoints.                         |
| **Certificate Pinning**                          | SPKI or certificate SHA-256 pinning, including backup pins and enforcement.                          |
| **OAuth2 mTLS-Bound Tokens (RFC 8705)**          | Validates the structure for mTLS-bound client authentication during token exchange.                  |
| **DPoP (Demonstration of Proof-of-Possession)**  | Verifies configuration for DPoP proofs attached to bearer tokens.                                    |
| **JWT Client Assertions (OIDC Private Key JWT)** | Supports client assertion JWT signing with JWK, PEM, or KMS keys.                                    |
| **Composable Security (security_set)**           | Combine multiple security mechanisms (e.g., OAuth2 + mTLS) with `mode: all` or `any`.                |

---

## 🗂 Directory Structure

```
fastagent-security-schema/
├── package.json
├── tsconfig.json
├── schemas/
│   └── backend-endpoints.schema.json     # Main JSON Schema definition
├── samples/
│   ├── classical_api.example.json        # Example using shared CA + mTLS + OAuth2 mTLS-bound
│   └── agentic_mcp.example.json          # Example using shared CA + mTLS for MCP endpoint
└── tests/
    ├── ajv-validate.js                   # JS test suite using Ajv
    └── ajv-validate.ts                   # TypeScript version with optional cross-ref checks
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run validation tests

```bash
npm test
# or individually:
npm run test:js
npm run test:ts
```

### 3. Expected output

```
✅ classical_api.example.json passed
✅ agentic_mcp.example.json passed
✅ Negative test correctly failed for bad pinset: must match pattern "^[A-Fa-f0-9]{64}$"
ℹ️ Schema allows missing trust_store_ref by design. Consider adding a custom Ajv rule to enforce referential integrity in CI.
```

---

## 🧠 How It Works

The schema is validated using **[Ajv](https://ajv.js.org/)**, a high-performance JSON Schema validator supporting Draft 2020-12.
All tests run two main checks:

1. **Positive validation**
   Validates both sample configurations (`classical_api.example.json` and `agentic_mcp.example.json`) against the schema.

2. **Negative validation**
   Intentionally invalid configurations (e.g., malformed certificate pin hashes) should fail validation.

Each test prints detailed schema errors on failure, including the offending JSON path and expected pattern.

---

## 🧪 Test Scripts Explained

### **`tests/ajv-validate.js`**

A plain JavaScript test runner:

* Uses `ajv` and `ajv-formats` for validation.
* Runs all sample configs.
* Adds a **negative test** for malformed pinsets.
* Exits with non-zero code on validation failure (suitable for CI/CD).

### **`tests/ajv-validate.ts`**

A TypeScript version that includes:

* Type safety and static checks.
* A **custom note** on cross-referential validation (trust store references).
* Can be extended with **Ajv custom keywords** to verify:

  * That `transport.tls.trust_store_ref` exists in the document’s `trust_stores` list.
  * That all referenced `SecretRef` or `KeyMaterialRef` objects follow project naming conventions.

Example CI extension:

```ts
ajv.addKeyword({
  keyword: 'trustStoreRefExists',
  validate: (schema: boolean, data, parentSchema, ctx) => {
    const root = ctx.parentData?.$root || ctx.rootData;
    if (!root?.trust_stores) return true;
    return root.trust_stores.some((t: any) => t.id === data);
  }
});
```

---

## 🧰 Extending Schema Validation

You can add more checks or CI enforcement in three main ways:

| Extension               | Description                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Ajv Custom Keywords** | Enforce referential integrity between `trust_stores` and endpoint references. |
| **Lint Rules**          | Integrate JSON Schema validation with eslint or pre-commit hooks.             |
| **Custom CI Steps**     | Run `npm test` during CI/CD to block invalid configs before merge/deploy.     |

Example CI command in GitHub Actions:

```yaml
jobs:
  validate-configs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
```

---

## 🧩 Schema Validation Highlights

### Key Entities

| Definition                                | Purpose                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| **TrustStore**                            | Centralized CA bundle, pinset, and allowed DNS list.                     |
| **PinSet**                                | Certificate or SPKI pinning configuration.                               |
| **SecurityScheme**                        | Describes a single auth mechanism (e.g., OAuth2, mTLS, HMAC).            |
| **SecuritySet**                           | Combines multiple schemes using logical `all` or `any` mode.             |
| **KeyMaterialRef**                        | Describes where to fetch private key material (env, vault, KMS, HSM).    |
| **ClassicalApiConfig / AgenticMcpConfig** | Distinct per-endpoint configuration templates for REST or MCP endpoints. |

---

## 🔧 Validation Scenarios Covered

* ✅ Valid `trust_store_ref` usage
* ✅ Valid pinset SHA-256 format (64 hex chars)
* ✅ Valid TLS config with ALPN and mTLS client certs
* ✅ OAuth2 mTLS-bound client config structure
* ✅ DPoP key and algorithm config
* ✅ JSON Schema draft 2020-12 compliance
* ✅ Backward compatibility with simple APIs
* ❌ Invalid pinset pattern detection (tested)

---

## 🧱 Integrating With FastAgent Runtime

You can embed the schema into FastAgent’s configuration loader:

```js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';

const schema = JSON.parse(fs.readFileSync('schemas/backend-endpoints.schema.json', 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const config = JSON.parse(fs.readFileSync('fastagent-config.json', 'utf8'));
if (!validate(config)) {
  console.error('Config validation failed:', validate.errors);
  process.exit(1);
}
```

---

## 🧰 Recommended CI Integration

| Tool                        | Purpose                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------ |
| **GitHub Actions**          | Validate every commit or PR automatically.                                           |
| **Pre-commit hook (Husky)** | Block commits containing invalid schema configs.                                     |
| **Docker healthcheck**      | Run schema validation at container startup before FastAgent runtime loads endpoints. |

---

## 🧾 License

This testing framework and schema are released under the **MIT License**.
You’re free to adapt and extend them in your own FastAgent-based systems.

---

## 🧩 Authors & Maintainers

**ParamTatva Engineering (FastAgent Project)**
Maintained by the **Security & Infrastructure Layer** team.
For questions or extensions, open an issue or PR in your FastAgent repo.
