// tests/ajv-validate.js
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv').default;
const addFormats = require('ajv-formats');

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', 'backend-endpoints.schema.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validate = ajv.compile(schema);

function checkSample(samplePath) {
  const data = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
  const valid = validate(data);
  if (!valid) {
    console.error(`❌ ${path.basename(samplePath)} failed validation:`);
    console.error(validate.errors);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${path.basename(samplePath)} passed`);
  }
}

// Positive cases
checkSample(path.join(__dirname, '..', 'samples', 'classical_api.example.json'));
checkSample(path.join(__dirname, '..', 'samples', 'agentic_mcp.example.json'));

// Negative case: wrong pin hash length (should be 64 hex)
const bad = {
  "version": "1.1.0",
  "trust_stores": [
    {
      "id": "bad-store",
      "ca_bundle_ref": { "ref": "CA", "source": "env" },
      "pinset": { "type": "spki_sha256", "hashes": ["ABCDEF"] }
    }
  ],
  "endpoints": [
    {
      "id": "bad.ep",
      "name": "Bad EP",
      "kind": "classical_api",
      "transport": { "protocol": "https", "base_url": "https://bad.example.com" },
      "timeouts": { "connect_ms": 1000, "read_ms": 1000 },
      "config": { "requests": [ { "operation_id": "ping", "method": "GET", "path": "/ping" } ] }
    }
  ]
};

const ok = validate(bad);
if (ok) {
  console.error('❌ Negative test unexpectedly passed');
  process.exitCode = 1;
} else {
  console.log('✅ Negative test correctly failed for bad pinset:', validate.errors[0].message);
}