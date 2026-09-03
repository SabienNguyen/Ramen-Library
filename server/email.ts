export async function sendVerificationEmail({
  user,
  url,
}: {
  user: { email: string }
  url: string
}): Promise<void> {
  const key = process.env.EMAIL_PROVIDER_KEY
  if (!key) {
    console.log(`[email] verification link for ${user.email}: ${url}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'Ramen Library <onboarding@resend.dev>',
      to: user.email,
      subject: 'Verify your email',
      html: `<p>Click the link below to verify your email address.</p><p><a href="${url}">${url}</a></p>`,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[email] failed to send verification email: ${res.status} ${body}`)
  }
}
