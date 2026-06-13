// ------------------------------------------------------------------
// OIDC signing key (MOCK ONLY)
//
// This is a FIXED RSA-2048 keypair embedded directly in the repo.
// That is intentional: this project is an Auth0 *mock* for local
// development. The private key here is NOT secret and MUST NOT be
// used for anything real. Anyone with this repo can forge tokens.
//
// To rotate, run:
//   node -e "const{generateKeyPairSync}=require('crypto');const{publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:2048});console.log(JSON.stringify({priv:privateKey.export({format:'jwk'}),pub:publicKey.export({format:'jwk'})}))"
// then paste the result below.
// ------------------------------------------------------------------

export const KID = 'tobira-mock-key-1'

// Full private JWK (used for signing id_tokens).
export const PRIVATE_JWK: JsonWebKey = {
  kty: 'RSA',
  n: 'uPNtI3i5H8z0wt21dIO-DkS4CRnPaqtYwxI7Hsesyr310Wz8VrfgGgNmWBSH3S0f9HjOhyUJZo0YB3psYrh7xezKrwzMP88z5JBB6Cjd1cYZ_fhEbUgKMQobWhVKLnw2f6FWZRGW0qULq93JeTakIdSLtstc4IzSdI3RsH77yxgJgsIWwZpTTyuRXLsG5Xw1wSengr5ZC8FLlnYErY9jkhjo4_0sMbZ1bm5Wt2WalV4cgnCsaOoBtOrgW_4adNGob49tTCAbnpi0gdLwZiqYTiHUYcF3AYGW8Ju_sD_qJrYyt_ItdxjqfBqHvEpNfDkog40cNZMFlw004-RtjjPxiQ',
  e: 'AQAB',
  d: 'Ce83akuahAkGD66Jh-XosEsEKKb8g3ILPUUuLEfU8fn0qYhlYIIVdUg_99S4fIqnOAJCM7OrVtkW1JYAmufmbBn9RBxXn0jRtIIELER_r_MpY8Exab5QH9S3ZeYVWzxcUAw6QAkLFSr83sE1yH9FHzUTwSCYz035Iv4YKJcVjtHXFqNKD2xcLNYEf7NM-UBAJ9gwHHs9teOg7ObcwCSJ0XFftTZEoAnA6bUenvFb0LPmqPpFhJL0iPguUri6FAl9fZbt5Mt1WKAzfYYmgZsmYUhktNZb7BElMpR0SYnYko5vJlAszwQoYW_H49CUg4kAVrXb5_bo7KO40KXxOKu9RQ',
  p: '2j9nPjR2niG4-OsIUCdwtLQvFFCb5q-rBac1AneJL2alHh8__4QBnJG30zvZS_BmvmM5GumVhQJl78LatcdY85gh2Q4pfyIlVrChdIfHxu3Irir5oq2g26lvGTTGe7ZoVeo_HVQ-bPx5AQPyJRyuxNaoBwP9yCdQTzWwwTKjZ-0',
  q: '2PGNJ7rxKKC3Ymn3wDXt4Gs2SGzZp_bxN3FHQGynZSrpPthNjtTEW9G_apbEDFE_Vg8BSBh8GDNr9OoAaQo5PHZi3zht1DQNZtF9_D2tTfRID3QP-BNw8D1dM7WNKtnAL1M64YHisnhBkFlMeueHopUw9bfExZ-KwjOXgxRkBI0',
  dp: 'ruA4-OYO2dyJm6KwUZGYxKLQSoXgtfKypd_6INTpbrrfuYguvq3moK8-TZraHfguS4Wz_zWFokNurLREjX2DcATJsmOfqogQxSrY5EfcMzDbKXuz9b8McpaMN_VKyVw6tATzt6uGLcwLpV2lDEm0XHLnxl9TXarqtd1-mP_bYW0',
  dq: 'bDO18n3z8A6QyJ4PuqdrOIZgsajQukyZLMzr-771kqjfYr_hlv6Z3S31KcV-jKItU8_yFLJZmnxzONlJURqPR4_IaosrhC5eDM0p6BgfCwVut35sxI91wezpQnQnr5qhlzkM4hK1Lcx67vMLCTXXWYjNvZBlrSeQvqGazP7rj7U',
  qi: 'i-rDY13-juL2BfJX7Ku1sTFz5Zvlk_gXX_6oaFcuLxSqsSstB4_HjRtPozweBv85RW-Y72jCXCBo5TXfsAlih8hqWZc8DIB8zfV4_k9_WDT4pBGf9FnO7JXE7H6WNE-76RH56BgtOqHUXUsZIBydFVwnXR14utWKZW6Sb1iKlAA',
  alg: 'RS256',
  use: 'sig',
  ext: true,
}

// Public JWK exposed at /.well-known/jwks.json (only n/e are public).
export const PUBLIC_JWK = {
  kty: 'RSA',
  n: PRIVATE_JWK.n,
  e: PRIVATE_JWK.e,
  alg: 'RS256',
  use: 'sig',
  kid: KID,
}
