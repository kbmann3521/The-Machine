export const JWT_TEST_PACK = {
  meta: {
    description: 'JWT Crypto Test Pack – Phase 3-5 (HS256/384/512, RS256/384/512 + alg:none + JWKS)',
    defaultSecrets: {
      hs256_main: 'a-string-secret-at-least-256-bits-long',
      hs384_main: 'a-string-secret-at-least-256-bits-long-for-hs384',
      hs512_main: 'a-string-secret-at-least-256-bits-long-for-hs512-verification'
    },
    defaultPublicKeys: {
      rs256_main: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3s8SkjLFE
7xqGi2WrVRAyXWPnX7jK0rZkWFhqhCuJRXNvTAH4yGWcZCG6I6gBfVDNNvNAqBhO
s7J6T/VeCJEYIZHfpL+bV0pIGpQVjIZpRyHzfEfjuA7X6cxVvvT9qTdXMCbpvPMu
JBpNy5BvZ/trmXlRfBVL/mECVjwRzwL4cLPZrBQ6ueGRGx0lCXLbM5hZTp3UJH6r
0iN0mCvNhL5ydNh5y0KXBv7gQvS5F7k3ELdnMM6J9vWlFhkIx+lxr/kNJrWzFGAa
d4hJKJZLW3Tq2UGGHl1WKsxdkiUJqMvDvI9VVKvqTNxQRxlvqL5f7qZjX9lZgCqG
vQIDAQAB
-----END PUBLIC KEY-----`,
      rs384_main: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3s8SkjLFE
7xqGi2WrVRAyXWPnX7jK0rZkWFhqhCuJRXNvTAH4yGWcZCG6I6gBfVDNNvNAqBhO
s7J6T/VeCJEYIZHfpL+bV0pIGpQVjIZpRyHzfEfjuA7X6cxVvvT9qTdXMCbpvPMu
JBpNy5BvZ/trmXlRfBVL/mECVjwRzwL4cLPZrBQ6ueGRGx0lCXLbM5hZTp3UJH6r
0iN0mCvNhL5ydNh5y0KXBv7gQvS5F7k3ELdnMM6J9vWlFhkIx+lxr/kNJrWzFGAa
d4hJKJZLW3Tq2UGGHl1WKsxdkiUJqMvDvI9VVKvqTNxQRxlvqL5f7qZjX9lZgCqG
vQIDAQAB
-----END PUBLIC KEY-----`,
      rs512_main: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Z3VS5JJcds3s8SkjLFE
7xqGi2WrVRAyXWPnX7jK0rZkWFhqhCuJRXNvTAH4yGWcZCG6I6gBfVDNNvNAqBhO
s7J6T/VeCJEYIZHfpL+bV0pIGpQVjIZpRyHzfEfjuA7X6cxVvvT9qTdXMCbpvPMu
JBpNy5BvZ/trmXlRfBVL/mECVjwRzwL4cLPZrBQ6ueGRGx0lCXLbM5hZTp3UJH6r
0iN0mCvNhL5ydNh5y0KXBv7gQvS5F7k3ELdnMM6J9vWlFhkIx+lxr/kNJrWzFGAa
d4hJKJZLW3Tq2UGGHl1WKsxdkiUJqMvDvI9VVKvqTNxQRxlvqL5f7qZjX9lZgCqG
vQIDAQAB
-----END PUBLIC KEY-----`,
      es256_main: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4fqY4ilv37wvU08KfRi7ASYflFza
pH9raPC5JJq8/wu7/cpcDxeNhEMwPHqhBVQoGs+DpaM6vQ3B3W49qwghjQ==
-----END PUBLIC KEY-----`,
      es384_main: `-----BEGIN PUBLIC KEY-----
MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEv+ABQH+AXaEUvw7Z5AWyffSRjblctySh
hZPnv+lJiZeZjaw4YFlw7OJapKC4PwEdzR3wXjYequZYg5TB5CTEIQ1F2Wdm4GGE
0FSZ7ZV4eL3TO/KRN02cPX1M2vm6DY2D
-----END PUBLIC KEY-----`,
      es512_main: `-----BEGIN PUBLIC KEY-----
MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQA0MSL2dyU63SLmN+oCpQtz5i9GBNy
TcmsE1P56xtpLLjfruTM67hb2QBfr9H3gmGINZ1Idkv0m8T6LL2AAsY0fnQAseUD
X0dyp6nKYEeQT3/alNfvaOdvFUzwXNsr0kiHaLsbIWvo64bE86f+pGf+RPq0MuPV
xGGs7NLUtWidgYGQmzs=
-----END PUBLIC KEY-----`
    }
  },
  tests: [
    {
      id: 'HS256_VALID_BASE',
      description: 'Canonical HS256 token – signature must verify with correct secret.',
      algorithm: 'HS256',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
      secret: 'a-string-secret-at-least-256-bits-long',
      expected: {
        signatureVerification: {
          algorithm: 'HS256',
          verified: true,
          reasonIncludes: 'HS256 (SHA-256) HMAC matches token signature'
        }
      }
    },

    {
      id: 'HS256_WRONG_SECRET',
      description: 'Same token as base, but with wrong secret – must fail verification.',
      algorithm: 'HS256',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
      secret: 'not-the-right-secret',
      expected: {
        signatureVerification: {
          algorithm: 'HS256',
          verified: false,
          reasonIncludes: 'Signature does not match'
        }
      }
    },

    {
      id: 'HS256_NO_SECRET',
      description: 'Base token but secret omitted/empty – tool should report "cannot verify".',
      algorithm: 'HS256',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
      secret: '',
      expected: {
        signatureVerification: {
          algorithm: 'HS256',
          verified: null,
          reasonIncludes: 'Secret not provided — cannot verify signature'
        }
      }
    },

    {
      id: 'HS256_WHITESPACE_TOKEN',
      description: 'Same token as base but spread across multiple lines; whitespace must be ignored before verification.',
      algorithm: 'HS256',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.\neyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.\nKMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
      secret: 'a-string-secret-at-least-256-bits-long',
      expected: {
        signatureVerification: {
          algorithm: 'HS256',
          verified: true,
          reasonIncludes: 'HS256 (SHA-256) HMAC matches token signature'
        }
      }
    },

    {
      id: 'HS256_TAMPERED_PAYLOAD',
      description: 'Payload changed (admin: true → false) but signature kept the same – must fail verification.',
      algorithm: 'HS256',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOmZhbHNlLCJpYXQiOjE1MTYyMzkwMjJ9.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
      secret: 'a-string-secret-at-least-256-bits-long',
      expected: {
        signatureVerification: {
          algorithm: 'HS256',
          verified: false,
          reasonIncludes: 'Signature does not match'
        }
      }
    },

    {
      id: 'HS256_TAMPERED_HEADER',
      description: 'Header changed (typ: "JWT" → "JOSE") but signature kept the same – must fail verification.',
      algorithm: 'HS256',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpPU0UifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30',
      secret: 'a-string-secret-at-least-256-bits-long',
      expected: {
        signatureVerification: {
          algorithm: 'HS256',
          verified: false,
          reasonIncludes: 'Signature does not match'
        }
      }
    },

    {
      id: 'HS256_EMPTY_SIGNATURE',
      description: 'alg = HS256 but signature part is empty (trailing dot). Should be treated as invalid signature/structural error.',
      algorithm: 'HS256',
      token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlbXB0eS1zaWduYXR1cmUtdXNlciIsImlhdCI6MTUxNjIzOTAyMn0.',
      secret: 'a-string-secret-at-least-256-bits-long',
      expected: {
        signatureVerification: {
          algorithm: 'HS256',
          verified: false
        }
      }
    },

    {
      id: 'ALG_NONE_UNSIGNED',
      description: 'alg: "none" with no signature. Must be flagged as a critical security issue and considered invalid.',
      algorithm: 'none',
      token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyMTIzIiwiYXVkIjoidGVzdC1hcHAiLCJpc3MiOiJ0ZXN0LWlzc3VlciIsImV4cCI6MjAwMDAwMDAwMCwiaWF0IjoxNzAwMDAwMDAwfQ.',
      secret: null,
      expected: {
        signatureVerification: {
          algorithm: 'none',
          verified: false,
          reasonIncludes: 'alg: "none" has no signature to verify'
        },
        headerSecurityWarningsIncludes: 'CRITICAL SECURITY VULNERABILITY'
      }
    },

    {
      id: 'HS384_NO_SECRET',
      description: 'HS384 token but secret omitted/empty – tool should report "cannot verify".',
      algorithm: 'HS384',
      token: 'eyJhbGciOiJIUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.',
      secret: '',
      expected: {
        signatureVerification: {
          algorithm: 'HS384',
          verified: null,
          reasonIncludes: 'Secret not provided — cannot verify signature'
        }
      }
    },

    {
      id: 'HS512_NO_SECRET',
      description: 'HS512 token but secret omitted/empty – tool should report "cannot verify".',
      algorithm: 'HS512',
      token: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.',
      secret: '',
      expected: {
        signatureVerification: {
          algorithm: 'HS512',
          verified: null,
          reasonIncludes: 'Secret not provided — cannot verify signature'
        }
      }
    },

    {
      id: 'RS256_VALID_WITH_KID',
      description: 'RS256 token with kid (key ID) header for key rotation support.',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1haW4ta2V5In0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.dummy_signature',
      publicKey: 'defaultPublicKeys.rs256_main',
      expected: {
        signatureVerification: {
          algorithm: 'RS256',
          verified: false
        }
      }
    },

    {
      id: 'RS256_NO_PUBLIC_KEY',
      description: 'RS256 token but public key omitted/empty – tool should report "cannot verify".',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.CeKwW1jALGNRoTxGHwW-mfqW_c9sXZlLNSVMW9xJQlKAZKPfZHLc9hQmKgKXeY5cANtKdVq0hLCx6YqrRGJWNPgXVb_VPxd7Wkm5fvwLDRLNXdkPVUh0Z5lUk-s6_K0PL9RuY3PYcXQKzRQZoJmF0T5NrLnLJKXRLx4VwJVG4P3Q5HY8OzF-Lw0_WqLY_4-Zl8FhWqVqZa0BqZO8E1QZp5K7J5Vm1F1a9mD1mLgPxRe9qLaLd5Z0PqXDjEq9VN6W0KvL0oX-Q_WcL1qZd5sF7QqS0f1mJ5l-y9Oj5gB3n7eF_X1vL5wC7R8hL9_w0X3t9',
      publicKey: '',
      expected: {
        signatureVerification: {
          algorithm: 'RS256',
          verified: null,
          reasonIncludes: 'Public key not provided — cannot verify signature'
        }
      }
    },


    {
      id: 'RS256_INVALID_PEM_FORMAT',
      description: 'RS256 token but public key is not valid PEM format – tool should report parse error.',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.CeKwW1jALGNRoTxGHwW-mfqW_c9sXZlLNSVMW9xJQlKAZKPfZHLc9hQmKgKXeY5cANtKdVq0hLCx6YqrRGJWNPgXVb_VPxd7Wkm5fvwLDRLNXdkPVUh0Z5lUk-s6_K0PL9RuY3PYcXQKzRQZoJmF0T5NrLnLJKXRLx4VwJVG4P3Q5HY8OzF-Lw0_WqLY_4-Zl8FhWqVqZa0BqZO8E1QZp5K7J5Vm1F1a9mD1mLgPxRe9qLaLd5Z0PqXDjEq9VN6W0KvL0oX-Q_WcL1qZd5sF7QqS0f1mJ5l-y9Oj5gB3n7eF_X1vL5wC7R8hL9_w0X3t9',
      publicKey: 'not a valid pem key',
      expected: {
        signatureVerification: {
          algorithm: 'RS256',
          verified: false,
          reasonIncludes: 'Failed to parse public key'
        }
      }
    },

    {
      id: 'RS384_NO_PUBLIC_KEY',
      description: 'RS384 token but public key omitted/empty – tool should report "cannot verify".',
      algorithm: 'RS384',
      token: 'eyJhbGciOiJSUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.',
      publicKey: '',
      expected: {
        signatureVerification: {
          algorithm: 'RS384',
          verified: null,
          reasonIncludes: 'Public key not provided — cannot verify signature'
        }
      }
    },

    {
      id: 'RS512_NO_PUBLIC_KEY',
      description: 'RS512 token but public key omitted/empty – tool should report "cannot verify".',
      algorithm: 'RS512',
      token: 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.',
      publicKey: '',
      expected: {
        signatureVerification: {
          algorithm: 'RS512',
          verified: null,
          reasonIncludes: 'Public key not provided — cannot verify signature'
        }
      }
    },

    {
      id: 'RS256_WITH_KID_ISS_HEADERS',
      description: 'RS256 token with kid and iss in header and payload for JWKS discovery. Structure validates even without JWKS.',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xMjM0NTYifQ.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aGV4YW1wbGUuY29tIiwiYXVkIjoieW91ci1hcHAiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTcwMDAwMDAwMH0.dummy_sig_placeholder',
      publicKey: '',
      options: {
        skipVerification: true
      },
      expected: {
        decodedHeader: {
          alg: 'RS256',
          typ: 'JWT',
          kid: 'key-123456'
        },
        decodedPayload: {
          sub: 'user-123',
          iss: 'https://authexample.com',
          aud: 'your-app'
        },
        headerInfo: 'JWKS auto-discovery indicators present'
      }
    },

    {
      id: 'RS256_MISSING_KID',
      description: 'RS256 token missing kid header. JWKS discovery may not work without kid to identify the correct key.',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aGV4YW1wbGUuY29tIiwiYXV1IjoieW91ci1hcHAiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTcwMDAwMDAwMH0.dummy_sig',
      publicKey: '',
      options: {
        skipVerification: true
      },
      expected: {
        decodedHeader: {
          alg: 'RS256',
          typ: 'JWT'
        },
        headerWarning: 'kid (Key ID) not present - JWKS discovery may fail'
      }
    },

    {
      id: 'RS256_MISSING_ISS',
      description: 'RS256 token missing iss claim. JWKS URL cannot be built without issuer.',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS04OTAxMjMifQ.eyJzdWIiOiJ1c2VyLTEyMyIsImF1ZCI6InlvdXItYXBwIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE3MDAwMDAwMDB9.dummy_sig',
      publicKey: '',
      options: {
        skipVerification: true
      },
      expected: {
        decodedPayload: {
          sub: 'user-123',
          aud: 'your-app'
        },
        payloadWarning: 'iss (Issuer) not present - JWKS auto-discovery cannot proceed'
      }
    },

    {
      id: 'RS256_INVALID_ISS_FORMAT',
      description: 'RS256 token with iss that is not a valid URL. JWKS discovery should fail gracefully.',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS04OTAxMjMifQ.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Im5vdC1hLXZhbGlkLXVybCIsImF1ZCI6InlvdXItYXBwIiwiZXhwIjo5OTk5OTk5OTk5LCJpYXQiOjE3MDAwMDAwMDB9.dummy_sig',
      publicKey: '',
      options: {
        skipVerification: true
      },
      expected: {
        decodedPayload: {
          iss: 'not-a-valid-url'
        },
        issWarning: 'iss is not a valid HTTPS URL'
      }
    },

    {
      id: 'RS256_HTTP_ISS_NOT_HTTPS',
      description: 'RS256 token with iss using HTTP instead of HTTPS. JWKS fetching should reject for security.',
      algorithm: 'RS256',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS04OTAxMjMifQ.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHA6Ly9pbnNlY3VyZS5jb20iLCJhdWQiOiJ5b3VyLWFwcCIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzAwMDAwMDAwfQ.dummy_sig',
      publicKey: '',
      options: {
        skipVerification: true
      },
      expected: {
        decodedPayload: {
          iss: 'http://insecure.com'
        },
        securityWarning: 'iss must use HTTPS for secure JWKS fetching'
      }
    },

    {
      id: 'ES256_VALID',
      description: 'ES256 token with valid ECDSA signature using P-256 curve.',
      algorithm: 'ES256',
      token: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.MEQCIDMn4o75yl0E_W2MPAdvXz_3Hax2JshcfR3fmndxye1EAiBUsxy9aci3ywDkJK2cijAzYGvkVKvyf7wPHu36WRkALA',
      publicKey: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4fqY4ilv37wvU08KfRi7ASYflFza
pH9raPC5JJq8/wu7/cpcDxeNhEMwPHqhBVQoGs+DpaM6vQ3B3W49qwghjQ==
-----END PUBLIC KEY-----`,
      expected: {
        signatureVerification: {
          algorithm: 'ES256',
          verified: true,
          reasonIncludes: 'ES256 (SHA-256 with P-256 curve) signature matches'
        }
      }
    },

    {
      id: 'ES256_NO_PUBLIC_KEY',
      description: 'ES256 token but public key omitted/empty – tool should report "cannot verify".',
      algorithm: 'ES256',
      token: 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.MEQCIDMn4o75yl0E_W2MPAdvXz_3Hax2JshcfR3fmndxye1EAiBUsxy9aci3ywDkJK2cijAzYGvkVKvyf7wPHu36WRkALA',
      publicKey: '',
      expected: {
        signatureVerification: {
          algorithm: 'ES256',
          verified: null,
          reasonIncludes: 'Public key not provided — cannot verify signature'
        }
      }
    },

    {
      id: 'ES384_VALID',
      description: 'ES384 token with valid ECDSA signature using P-384 curve.',
      algorithm: 'ES384',
      token: 'eyJhbGciOiJFUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.MGUCMQDvnwRYSdjDcle9ELvwqUHwg71PhYbMrTqaVXFxR1WbCM3-QQ4N6leet0F_OUHl-_wCMEm83HnFZUY6cyLQx0dZbv0_ep9JiBnVjifT9OGsfklX8qV3YVKm4d2QBZoey3ZNnQ',
      publicKey: `-----BEGIN PUBLIC KEY-----
MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEv+ABQH+AXaEUvw7Z5AWyffSRjblctySh
hZPnv+lJiZeZjaw4YFlw7OJapKC4PwEdzR3wXjYequZYg5TB5CTEIQ1F2Wdm4GGE
0FSZ7ZV4eL3TO/KRN02cPX1M2vm6DY2D
-----END PUBLIC KEY-----`,
      expected: {
        signatureVerification: {
          algorithm: 'ES384',
          verified: true,
          reasonIncludes: 'ES384 (SHA-384 with P-384 curve) signature matches'
        }
      }
    },

    {
      id: 'ES384_NO_PUBLIC_KEY',
      description: 'ES384 token but public key omitted/empty – tool should report "cannot verify".',
      algorithm: 'ES384',
      token: 'eyJhbGciOiJFUzM4NCIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.MGUCMQDvnwRYSdjDcle9ELvwqUHwg71PhYbMrTqaVXFxR1WbCM3-QQ4N6leet0F_OUHl-_wCMEm83HnFZUY6cyLQx0dZbv0_ep9JiBnVjifT9OGsfklX8qV3YVKm4d2QBZoey3ZNnQ',
      publicKey: '',
      expected: {
        signatureVerification: {
          algorithm: 'ES384',
          verified: null,
          reasonIncludes: 'Public key not provided — cannot verify signature'
        }
      }
    },

    {
      id: 'ES512_VALID',
      description: 'ES512 token with valid ECDSA signature using P-521 curve.',
      algorithm: 'ES512',
      token: 'eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.MIGIAkIAhWo3ADDi4ixZFtVVroM3HGGECzddgB4ZG-g2g1jfwNH8xPrZYR-SiI6JkbYyayioW8CD-tLX9KItmDeaeV498W8CQgE5wMZWTLRFqtVVtjIyvw3d3NRn8I96CZSt59t6dWtOspT0SPWn-QxIiCETlcSvK9tPb4pWFmZxWwV7gQgJsCvNZYIg',
      publicKey: `-----BEGIN PUBLIC KEY-----
MIGbMBAGByqGSM49AgEGBSuBBAAjA4GGAAQA0MSL2dyU63SLmN+oCpQtz5i9GBNy
TcmsE1P56xtpLLjfruTM67hb2QBfr9H3gmGINZ1Idkv0m8T6LL2AAsY0fnQAseUD
X0dyp6nKYEeQT3/alNfvaOdvFUzwXNsr0kiHaLsbIWvo64bE86f+pGf+RPq0MuPV
xGGs7NLUtWidgYGQmzs=
-----END PUBLIC KEY-----`,
      expected: {
        signatureVerification: {
          algorithm: 'ES512',
          verified: true,
          reasonIncludes: 'ES512 (SHA-512 with P-521 curve) signature matches'
        }
      }
    },

    {
      id: 'ES512_NO_PUBLIC_KEY',
      description: 'ES512 token but public key omitted/empty – tool should report "cannot verify".',
      algorithm: 'ES512',
      token: 'eyJhbGciOiJFUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.MIGIAkIAhWo3ADDi4ixZFtVVroM3HGGECzddgB4ZG-g2g1jfwNH8xPrZYR-SiI6JkbYyayioW8CD-tLX9KItmDeaeV498W8CQgE5wMZWTLRFqtVVtjIyvw3d3NRn8I96CZSt59t6dWtOspT0SPWn-QxIiCETlcSvK9tPb4pWFmZxWwV7gQgJsCvNZYIg',
      publicKey: '',
      expected: {
        signatureVerification: {
          algorithm: 'ES512',
          verified: null,
          reasonIncludes: 'Public key not provided — cannot verify signature'
        }
      }
    }
  ]
}
