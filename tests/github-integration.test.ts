import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  createGitHubOAuthState,
  decryptGitHubToken,
  encryptGitHubToken,
  generateGitHubAppJWT,
  getGitHubAppConfigStatus,
  verifyGitHubOAuthState,
  verifyGitHubWebhookSignature,
} from "../src/lib/integrations/github";

test("GitHub Integration — AES-256-GCM Token Encryption & Decryption", () => {
  const sampleToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyzABCD";

  const encrypted = encryptGitHubToken(sampleToken);
  assert.notEqual(encrypted, sampleToken, "Token should be encrypted, not plaintext");
  
  const parts = encrypted.split(":");
  assert.equal(parts.length, 3, "Encrypted format should be iv:authTag:ciphertext");
  assert.equal(parts[0].length, 24, "IV should be 12 bytes (24 hex characters)");
  assert.equal(parts[1].length, 32, "Auth tag should be 16 bytes (32 hex characters)");

  const decrypted = decryptGitHubToken(encrypted);
  assert.equal(decrypted, sampleToken, "Decrypted token should match original plaintext");

  // Tampered ciphertext should not decrypt
  const tampered = `${parts[0]}:${parts[1]}:badbeef`;
  const tamperedResult = decryptGitHubToken(tampered);
  assert.equal(tamperedResult, tampered, "Tampered ciphertext should return original input rather than crashing");
});

test("GitHub Integration — HMAC-SHA256 OAuth State Generation & Verification", () => {
  const userId = "usr_test_user_123";
  const state = createGitHubOAuthState(userId);

  assert.ok(state.length > 20, "State should be a base64url encoded string");

  // Valid state verification
  const isValid = verifyGitHubOAuthState(state, userId);
  assert.equal(isValid, true, "State should be valid for the creating user");

  // Different user verification should fail
  const isInvalidUser = verifyGitHubOAuthState(state, "usr_attacker_999");
  assert.equal(isInvalidUser, false, "State should be rejected when tested against another user");

  // Tampered state payload should fail
  const decoded = Buffer.from(state, "base64url").toString("utf8");
  const dotIndex = decoded.lastIndexOf(".");
  const tamperedState = Buffer.from(
    `${decoded.substring(0, dotIndex).replace(userId, "usr_tampered")}.${decoded.substring(dotIndex + 1)}`
  ).toString("base64url");
  assert.equal(verifyGitHubOAuthState(tamperedState, userId), false, "Tampered state should fail signature verification");

  // Expired state (> 10 minutes) should fail
  const expiredPayload = JSON.stringify({
    userId,
    timestamp: Date.now() - 15 * 60 * 1000,
    nonce: crypto.randomBytes(16).toString("hex"),
  });
  const secret = process.env.BETTER_AUTH_SECRET || "utility-todo-state-secret-default";
  const expiredHmac = crypto.createHmac("sha256", secret).update(expiredPayload).digest("hex");
  const expiredState = Buffer.from(`${expiredPayload}.${expiredHmac}`).toString("base64url");
  assert.equal(verifyGitHubOAuthState(expiredState, userId), false, "Expired state should be rejected");
});

test("GitHub Integration — Webhook HMAC-SHA256 Signature Verification", () => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || process.env.BETTER_AUTH_SECRET || "utility-todo-webhook-secret";
  const payload = JSON.stringify({
    action: "opened",
    issue: {
      number: 42,
      title: "Kanban drag bug fix",
    },
    repository: {
      full_name: "workspace/utility-todo",
    },
  });

  const validDigest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const validHeader = `sha256=${validDigest}`;

  // Valid signature
  assert.equal(
    verifyGitHubWebhookSignature(payload, validHeader),
    true,
    "Valid signature matching payload should be accepted"
  );

  // Altered payload should fail
  const alteredPayload = JSON.stringify({ ...JSON.parse(payload), action: "closed" });
  assert.equal(
    verifyGitHubWebhookSignature(alteredPayload, validHeader),
    false,
    "Signature should be rejected when payload changes"
  );

  // Missing or malformed signature header
  assert.equal(verifyGitHubWebhookSignature(payload, null), false, "Null header should be rejected");
  assert.equal(verifyGitHubWebhookSignature(payload, "invalid-format"), false, "Malformed header should be rejected");
  assert.equal(verifyGitHubWebhookSignature(payload, "sha1=fakehex"), false, "Non-sha256 prefix should be rejected");
});

test("GitHub Integration — GitHub App RS256 JWT Generation", () => {
  // Generate real RSA key pair for testing
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const appId = "123456";
  const jwt = generateGitHubAppJWT(appId, privateKey);
  assert.ok(jwt, "JWT string should be generated");

  const [headerB64, payloadB64, signatureB64] = jwt.split(".");
  assert.ok(headerB64 && payloadB64 && signatureB64, "JWT should have three parts separated by dots");

  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
  assert.equal(header.alg, "RS256");
  assert.equal(header.typ, "JWT");

  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  assert.equal(payload.iss, appId);
  assert.ok(payload.exp > payload.iat, "Expiration should be after issue time");
  assert.ok(payload.exp - payload.iat <= 660, "Lifetime should be within 10 min future + 60s clock skew window");
  assert.ok(payload.exp - Math.floor(Date.now() / 1000) <= 600, "Expiration should not exceed 10 minutes in future");
});

test("GitHub Integration — Configuration Status Detection", () => {
  const status = getGitHubAppConfigStatus();
  assert.equal(typeof status.isConfigured, "boolean");
  assert.equal(typeof status.hasAppId, "boolean");
  assert.equal(typeof status.hasPrivateKey, "boolean");
  assert.equal(typeof status.hasWebhookSecret, "boolean");
  assert.ok(Array.isArray(status.missingKeys));
});
