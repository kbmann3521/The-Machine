// Phase 5 Test Pack: JWKS Auto-Discovery and Real JWT Token Validation
// Tests RS256 tokens with kid/iss headers, JWKS discovery, and signature verification

export const PHASE_5_TEST_PACK = {
  meta: {
    description: 'Phase 5: JWKS Auto-Discovery and RSA Signature Verification (RS256/384/512)',
    notes: [
      'These tests focus on real-world JWT token structures from major identity providers',
      'Tests validate kid (Key ID) and iss (Issuer) extraction for JWKS discovery',
      'Real JWKS endpoint validation requires active identity provider credentials',
      'Test tokens use realistic structures but dummy signatures (not cryptographically valid)',
      'For production testing, use tokens from Auth0, Firebase, Okta, Azure AD, etc.'
    ],
    testingGuidance: {
      auth0: {
        issuer: 'https://YOUR_DOMAIN.auth0.com/',
        jwksEndpoint: 'https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json',
        documentationUrl: 'https://auth0.com/docs/get-started/backend-auth/securing-spas-with-tokens'
      },
      firebase: {
        issuer: 'https://securetoken.google.com/YOUR_PROJECT_ID',
        jwksEndpoint: 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
        documentationUrl: 'https://firebase.google.com/docs/auth/admin/verify-id-tokens'
      },
      okta: {
        issuer: 'https://YOUR_DOMAIN.okta.com',
        jwksEndpoint: 'https://YOUR_DOMAIN.okta.com/oauth2/v1/keys',
        documentationUrl: 'https://developer.okta.com/docs/guides/validate-id-tokens/'
      },
      azureAD: {
        issuer: 'https://login.microsoftonline.com/TENANT_ID/v2.0',
        jwksEndpoint: 'https://login.microsoftonline.com/TENANT_ID/discovery/v2.0/keys',
        documentationUrl: 'https://learn.microsoft.com/en-us/azure/active-directory/develop/access-tokens'
      }
    }
  },

  tests: [
    {
      id: 'PHASE5_JWKS_DISCOVERY_INDICATORS',
      description: 'Token with proper kid and iss for JWKS auto-discovery indicators present.',
      category: 'JWKS Structure',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xMjM0NTYifQ.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aGV4YW1wbGUuY29tIiwiYXVkIjoieW91ci1hcHAiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTcwMDAwMDAwMH0.dummy_sig_placeholder',
      expectedElements: {
        headerKid: 'key-123456',
        issuer: 'https://authexample.com',
        jwksUrl: 'https://authexample.com/.well-known/jwks.json'
      },
      notes: 'Both kid and iss present - JWKS discovery can proceed'
    },

    {
      id: 'PHASE5_MISSING_KID_HEADER',
      description: 'RS256 token missing kid header - cannot identify which key in JWKS to use.',
      category: 'JWKS Discovery Issues',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aGV4YW1wbGUuY29tIiwiYXVkIjoieW91ci1hcHAiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTcwMDAwMDAwMH0.dummy_sig',
      expectedElements: {
        kid: null,
        issuer: 'https://authexample.com'
      },
      expectedBehavior: 'warn_no_kid',
      notes: 'Cannot match key to JWKS without kid - may try first key or fail'
    },

    {
      id: 'PHASE5_MISSING_ISS_CLAIM',
      description: 'RS256 token missing iss claim - cannot build JWKS URL without issuer.',
      category: 'JWKS Discovery Issues',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS04OTAxMjMifQ.eyJzdWIiOiJ1c2VyLTEyMyIsImF1ZCI6InlvdXItYXBwIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE3MDAwMDAwMDB9.dummy_sig',
      expectedElements: {
        kid: 'key-890123',
        issuer: null
      },
      expectedBehavior: 'warn_no_iss',
      notes: 'Cannot discover JWKS endpoint without issuer'
    },

    {
      id: 'PHASE5_INVALID_ISS_NOT_URL',
      description: 'RS256 token with iss that is not a valid URL format.',
      category: 'JWKS Discovery Issues',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS04OTAxMjMifQ.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Im5vdC1hLXZhbGlkLXVybCIsImF1ZCI6InlvdXItYXBwIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE3MDAwMDAwMDB9.dummy_sig',
      expectedElements: {
        issuer: 'not-a-valid-url'
      },
      expectedBehavior: 'warn_invalid_iss_format',
      notes: 'iss must be a valid HTTPS URL'
    },

    {
      id: 'PHASE5_HTTP_ISS_INSECURE',
      description: 'RS256 token with iss using HTTP instead of HTTPS - security risk.',
      category: 'JWKS Discovery Issues',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS04OTAxMjMifQ.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHA6Ly9pbnNlY3VyZS5jb20iLCJhdWQiOiJ5b3VyLWFwcCIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzAwMDAwMDAwfQ.dummy_sig',
      expectedElements: {
        issuer: 'http://insecure.com'
      },
      expectedBehavior: 'reject_http_issuer',
      notes: 'HTTP issuers rejected - JWKS must be fetched over HTTPS'
    },

    {
      id: 'PHASE5_AUTH0_ID_TOKEN_STRUCTURE',
      description: 'Real-world Auth0 ID token with standard OIDC claims and kid/iss.',
      category: 'Real-World Token Structures',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkY4MEE0MzI1RDY2QzRGNDI5NzM5MDkyQzlGQzVBOUE3In0.eyJnaXZlbl9uYW1lIjoiSm9obiIsImZhbWlseV9uYW1lIjoiRG9lIiwibmlja25hbWUiOiJqZG9lIiwibmFtZSI6IkpvaG4gRG9lIiwicGljdHVyZSI6Imh0dHBzOi8vZXhhbXBsZS5jb20vcGljdHVyZS5qcGciLCJ1cGRhdGVkX2F0IjoxNzAwMDAwMDAwLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9leGFtcGxlLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw2MDlkMjlhMmJjNjU0ZTRjNTBhMTJiNTYiLCJhdWQiOiJ5b3VyLWFwcC1jbGllbnQtaWQiLCJjbGllbnRfaWQiOiJ5b3VyLWFwcC1jbGllbnQtaWQiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.dummy_signature',
      expectedElements: {
        headerKid: 'F80A4325D66C4F42973909C9FC5A9A7',
        issuer: 'https://example.auth0.com/',
        tokenType: 'ID Token (OIDC/OAuth2)',
        claims: ['email', 'email_verified', 'name', 'picture', 'sub', 'aud']
      },
      notes: 'Standard Auth0 ID token with profile claims and proper JWKS indicators'
    },

    {
      id: 'PHASE5_FIREBASE_ID_TOKEN_STRUCTURE',
      description: 'Real-world Firebase ID token with Firebase-specific claims.',
      category: 'Real-World Token Structures',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZpcmViYXNlLWtleSJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbXktcHJvamVjdCIsImF1ZCI6Im15LXByb2plY3QiLCJhdXRoX3RpbWUiOjE3MDAwMDAwMDAsInVzZXJfaWQiOiJmaXJlYmFzZS11c2VyLWlkIiwic3ViIjoiZmlyZWJhc2UtdXNlci1pZCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAzNjAwLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidXNlckBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.dummy_signature',
      expectedElements: {
        headerKid: 'firebase-key',
        issuer: 'https://securetoken.google.com/my-project',
        tokenType: 'ID Token (OIDC/OAuth2)',
        customClaims: ['firebase'],
        claims: ['user_id', 'auth_time', 'email']
      },
      notes: 'Firebase tokens use Google securetoken.google.com issuer'
    },

    {
      id: 'PHASE5_OKTA_ID_TOKEN_STRUCTURE',
      description: 'Real-world Okta ID token with Okta-specific claims.',
      category: 'Real-World Token Structures',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IktFWV8xMjM0In0.eyJzdWIiOiIwMGFiYzEyZDNlRk1VQmNER1d3MCIsIm5hbWUiOiJKb2huIERvZSIsInZlciI6MSwiaXNzIjoiaHR0cHM6Ly9kZXYtMTIzNDU2Ny5va3RhLmNvbSIsImF1ZCI6IjBvYTB4YmN0ZDVLSVFUVzBzMC43IiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDM2MDAsImp0aSI6IklELlozUmhhNDFpS3Y5dnlEVnJOelJWNEVNSHc3bjJXQW9LRF91VGhEM1VXSSIsImFtciI6WyJwd2QiXSwiYXV0aF90aW1lIjoxNzAwMDAwMDAwLCJhdHgiOnsicm0iOiJQS0NFIiwibXNpcyI6ZmFsc2V9fQ.dummy_signature',
      expectedElements: {
        headerKid: 'KEY_1234',
        issuer: 'https://dev-123456.okta.com',
        tokenType: 'ID Token (OIDC/OAuth2)',
        claims: ['name', 'jti', 'amr', 'auth_time', 'atx']
      },
      notes: 'Okta ID tokens include extra security context (atx, jti, amr claims)'
    },

    {
      id: 'PHASE5_AZURE_AD_ID_TOKEN_STRUCTURE',
      description: 'Real-world Azure AD ID token with Microsoft-specific claims.',
      category: 'Real-World Token Structures',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlhYWFhYWFhYWFhYWFhYWFhYWCJ9.eyJhdWQiOiJ5b3VyLWFwcC1pZCIsImlzcyI6Imh0dHBzOi8vbG9naW4ubWljcm9zb2Z0b25saW5lLmNvbS85YWIxZjZmOS0xZTAyLTQ3MzAtYjAwMS1hMDAwYjBiZjU3OWEvdjIuMCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAzNjAwLCJuYW1lIjoiSm9obiBEb2UiLCJvaWQiOiI5YWIxZjZmOS0xZTAyLTQ3MzAtYjAwMS1hMDAwYjBiZjU3OWEiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJqb2huQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiQWRtaW4iLCJVc2VyIl0sInN1YiI6IjlhYjFmNmY5LTFlMDItNDczMC1iMDAxLWEwMDBiMGJmNTc5YSIsInRpZCI6IjlhYjFmNmY5LTFlMDItNDczMC1iMDAxLWEwMDBiMGJmNTc5YSJ9.dummy_signature',
      expectedElements: {
        headerKid: 'XXXXXXXXXXXXXXXX',
        issuer: 'https://login.microsoftonline.com/9ab1f6f9-1e02-4730-b001-a000b0bf579a/v2.0',
        tokenType: 'ID Token (OIDC/OAuth2)',
        claims: ['oid', 'tid', 'preferred_username', 'roles']
      },
      notes: 'Azure AD tokens include tenant ID (tid) and object ID (oid)'
    },

    {
      id: 'PHASE5_BOTH_KID_AND_ISS_MISSING',
      description: 'RS256 token missing both kid and iss - JWKS discovery completely impossible.',
      category: 'JWKS Discovery Issues',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImF1ZCI6InlvdXItYXBwIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE3MDAwMDAwMDB9.dummy_sig',
      expectedElements: {
        kid: null,
        issuer: null
      },
      expectedBehavior: 'warn_no_jwks_discovery_possible',
      notes: 'JWKS auto-discovery impossible - must use manual key entry'
    },

    {
      id: 'PHASE5_KID_HEADER_VS_PAYLOAD',
      description: 'Some issuers include kid in header, some also repeat in payload - test structure.',
      category: 'JWKS Structure',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS1pZCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aGV4YW1wbGUuY29tIiwiYXVkIjoieW91ci1hcHAiLCJraWQiOiJrZXktaWQiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTcwMDAwMDAwMH0.dummy_sig',
      expectedElements: {
        headerKid: 'key-id',
        payloadKid: 'key-id',
        issuer: 'https://authexample.com'
      },
      notes: 'Standard JWKS lookup uses kid from header, not payload'
    }
  ]
}
