interface MailtoOptions {
  to?: string;
  subject: string;
  body: string;
}

/**
 * Build a mailto: link with properly encoded subject and body.
 * The "to" field is optional — the senior can fill it in their email app.
 * Opens via window.location.href for best mobile compatibility
 * (iOS Mail, Gmail app, Orange Mail).
 */
export function buildMailtoLink(options: MailtoOptions): string {
  const params = new URLSearchParams();
  params.set("subject", options.subject);
  params.set("body", options.body);

  const to = options.to ? encodeURIComponent(options.to) : "";
  // URLSearchParams encodes spaces as '+', but mailto requires '%20'
  const queryString = params.toString().replace(/\+/g, "%20");

  return `mailto:${to}?${queryString}`;
}

/**
 * Open a mailto link. Uses window.location.href for maximum
 * compatibility on mobile devices (iOS Safari, Android Chrome).
 */
export function openMailtoLink(options: MailtoOptions): void {
  const link = buildMailtoLink(options);
  window.location.href = link;
}
