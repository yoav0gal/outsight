const DEFAULT_PATIENT_AUTH_ISSUER = "https://outsight.patient-auth";
const DEFAULT_PATIENT_AUTH_AUDIENCE = "outsight-patient-auth";
const DEFAULT_PATIENT_AUTH_KID = "patient-auth-key";

type JsonWebKeyShape = Record<string, string>;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

export function getPatientAuthIssuer() {
  return process.env.PATIENT_AUTH_JWT_ISSUER ?? DEFAULT_PATIENT_AUTH_ISSUER;
}

export function getPatientAuthAudience() {
  return process.env.PATIENT_AUTH_JWT_AUDIENCE ?? DEFAULT_PATIENT_AUTH_AUDIENCE;
}

export function getPatientAuthKeyId() {
  return process.env.PATIENT_AUTH_JWT_KID ?? DEFAULT_PATIENT_AUTH_KID;
}

export function getPatientAuthPrivateKeyPem() {
  return requireEnv("PATIENT_AUTH_JWT_PRIVATE_KEY").replace(/\\n/g, "\n");
}

export function getPatientAuthPublicJwk() {
  const parsed = JSON.parse(requireEnv("PATIENT_AUTH_JWT_PUBLIC_JWK")) as JsonWebKeyShape;

  return {
    ...parsed,
    kid: parsed.kid ?? getPatientAuthKeyId(),
    alg: parsed.alg ?? "RS256",
    use: parsed.use ?? "sig",
  };
}

export function getPatientAuthJwks() {
  return {
    keys: [getPatientAuthPublicJwk()],
  };
}

export function getPatientAuthJwksDataUri() {
  const jwksJson = JSON.stringify(getPatientAuthJwks());
  return `data:application/json,${encodeURIComponent(jwksJson)}`;
}

export function getPatientAuthApiSecret() {
  return requireEnv("PATIENT_AUTH_API_SECRET");
}
