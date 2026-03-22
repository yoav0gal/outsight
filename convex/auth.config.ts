import { getPatientAuthAudience, getPatientAuthIssuer, getPatientAuthJwksDataUri } from "@/lib/patientAuth/config";

const clientId = process.env.WORKOS_CLIENT_ID;

const authConfig = {
  providers: [
    {
      type: "customJwt",
      issuer: `https://api.workos.com/`,
      algorithm: "RS256",
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
    {
      type: "customJwt",
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: "RS256",
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
    {
      type: "customJwt",
      applicationID: getPatientAuthAudience(),
      issuer: getPatientAuthIssuer(),
      algorithm: "RS256",
      jwks: getPatientAuthJwksDataUri(),
    },
  ],
};

export default authConfig;
