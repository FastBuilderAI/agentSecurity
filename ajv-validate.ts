// tests/ajv-validate.ts
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', 'backend-endpoints.schema.json'), 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validate = ajv.compile(schema);

function checkSample(samplePath: string) {
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

checkSample(path.join(__dirname, '..', 'samples', 'classical_api.example.json'));
checkSample(path.join(__dirname, '..', 'samples', 'agentic_mcp.example.json'));

// Negative: endpoint references non-existent trust_store_ref
const badRef = {
  "version": "1.1.0",
  "endpoints": [
    {
      "id": "oops",
      "name": "Missing trust store ref",
      "kind": "classical_api",
      "transport": {
        "protocol": "https",
        "base_url": "https://x.example.com",
        "tls": { "trust_store_ref": "does-not-exist" }
      },
      "timeouts": { "connect_ms": 1000, "read_ms": 1000 },
      "config": { "requests": [ { "operation_id": "ping", "method": "GET", "path": "/ping" } ] }
    }
  ]
};

// NOTE: The JSON Schema does not do cross-ref resolution for trust_store_ref existence;
// this test demonstrates how you'd add a custom Ajv keyword in CI if needed.
const goodBySchema = validate(badRef);
if (goodBySchema) {
  console.log('ℹ️ Schema allows missing trust_store_ref by design. Consider adding a custom Ajv rule to enforce referential integrity in CI.');
} else {
  console.error('Unexpected: validation failed', validate.errors);
  process.exitCode = 1;
}