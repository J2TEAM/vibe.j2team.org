/**
 * Cognito Identity Pool — Basic Authentication Flow
 *
 * Uses the three-step basic flow instead of the enhanced flow because
 * AWS Cost Explorer (ce:*) is not included in Cognito's enhanced-flow
 * session policy allow-list and would be blocked with AccessDeniedException.
 *
 * Basic flow (no SigV4 signing required for any step):
 *  1. GetId                    → resolve a stable IdentityId for this browser
 *  2. GetOpenIdToken            → exchange IdentityId for a short-lived OIDC token
 *  3. STS AssumeRoleWithWebIdentity → exchange OIDC token for STS credentials
 *
 * The STS call uses the unauthenticated IAM role ARN configured on the pool.
 * This role's trust policy restricts assumption to this specific Identity Pool,
 * so the role ARN itself is not a secret.
 */

interface CognitoGetIdResponse {
  IdentityId: string
}

interface CognitoGetOpenIdTokenResponse {
  Token: string
  IdentityId: string
}

export interface CognitoTemporaryCredentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
  identityId: string
}

// ─── Cognito helpers ──────────────────────────────────────────────────────────

async function cognitoPost<T>(
  region: string,
  target: string,
  body: Record<string, string>,
): Promise<T> {
  const response = await fetch(`https://cognito-identity.${region}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityService.${target}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    let message = `${target} failed (HTTP ${response.status})`
    try {
      const err = (await response.json()) as { message?: string; Message?: string; __type?: string }
      const detail = err.message ?? err.Message
      const type = err.__type?.split('#').pop()
      if (type) message = type
      if (detail) message += `: ${detail}`
    } catch {
      // body not parseable — keep generic message
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

// ─── STS helper ───────────────────────────────────────────────────────────────

function parseXmlText(doc: Document, tag: string): string {
  return doc.querySelector(tag)?.textContent ?? ''
}

async function assumeRoleWithWebIdentity(
  roleArn: string,
  webIdentityToken: string,
): Promise<{ accessKeyId: string; secretAccessKey: string; sessionToken: string }> {
  const params = new URLSearchParams({
    Action: 'AssumeRoleWithWebIdentity',
    Version: '2011-06-15',
    RoleArn: roleArn,
    RoleSessionName: 'MyAwsDashboard',
    WebIdentityToken: webIdentityToken,
    DurationSeconds: '900', // STS minimum; app enforces 5-min logout independently
  })

  // AssumeRoleWithWebIdentity does not require SigV4 signing — designed for browser/mobile use
  const response = await fetch('https://sts.amazonaws.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    signal: AbortSignal.timeout(15000),
  })

  const text = await response.text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')

  if (!response.ok) {
    const msg =
      parseXmlText(doc, 'Message') ||
      parseXmlText(doc, 'message') ||
      `AssumeRoleWithWebIdentity failed (HTTP ${response.status})`
    throw new Error(msg)
  }

  const accessKeyId = parseXmlText(doc, 'AccessKeyId')
  const secretAccessKey = parseXmlText(doc, 'SecretAccessKey')
  const sessionToken = parseXmlText(doc, 'SessionToken')

  if (!accessKeyId || !secretAccessKey || !sessionToken) {
    throw new Error('STS returned an incomplete credentials response.')
  }

  return { accessKeyId, secretAccessKey, sessionToken }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Exchange a Cognito Identity Pool ID + unauthenticated IAM role for
 * temporary AWS credentials using the basic (classic) auth flow.
 */
export async function getCognitoCredentials(
  identityPoolId: string,
  region: string,
  roleArn: string,
): Promise<CognitoTemporaryCredentials> {
  // Step 1 — resolve a stable IdentityId for this browser
  const { IdentityId } = await cognitoPost<CognitoGetIdResponse>(region, 'GetId', {
    IdentityPoolId: identityPoolId,
  })

  // Step 2 — exchange IdentityId for a short-lived OIDC token
  const { Token } = await cognitoPost<CognitoGetOpenIdTokenResponse>(region, 'GetOpenIdToken', {
    IdentityId,
  })

  // Step 3 — exchange OIDC token for STS credentials (no signing needed)
  const stsCreds = await assumeRoleWithWebIdentity(roleArn, Token)

  return { ...stsCreds, identityId: IdentityId }
}
