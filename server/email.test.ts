import { afterEach, describe, expect, spyOn, test } from 'bun:test'
import { sendVerificationEmail } from './email'

describe('sendVerificationEmail', () => {
  const originalKey = process.env.EMAIL_PROVIDER_KEY

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.EMAIL_PROVIDER_KEY
    } else {
      process.env.EMAIL_PROVIDER_KEY = originalKey
    }
  })

  test('with no EMAIL_PROVIDER_KEY, resolves and logs the link', async () => {
    delete process.env.EMAIL_PROVIDER_KEY
    const logSpy = spyOn(console, 'log').mockImplementation(() => {})

    await expect(
      sendVerificationEmail({ user: { email: 'a@example.com' }, url: 'http://x/verify' }),
    ).resolves.toBeUndefined()

    expect(logSpy).toHaveBeenCalled()
    logSpy.mockRestore()
  })

  test('with a key set and fetch rejecting, resolves without throwing', async () => {
    process.env.EMAIL_PROVIDER_KEY = 'test-key'
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    const originalFetch = globalThis.fetch
    globalThis.fetch = (() => Promise.reject(new Error('network down'))) as unknown as typeof fetch

    try {
      await expect(
        sendVerificationEmail({ user: { email: 'b@example.com' }, url: 'http://x/verify' }),
      ).resolves.toBeUndefined()
    } finally {
      globalThis.fetch = originalFetch
      errorSpy.mockRestore()
    }
  })
})
