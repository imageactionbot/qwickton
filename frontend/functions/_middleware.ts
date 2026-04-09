type PagesMiddlewareContext = {
  request: Request;
  next: () => Promise<Response>;
};

/**
 * 301 apex → www so AdSense / users hit the hostname that has a valid Pages + SSL setup.
 * Runs on Cloudflare edge after TLS (both hostnames need custom domains on the project).
 */
export async function onRequest(context: PagesMiddlewareContext): Promise<Response> {
  const url = new URL(context.request.url);
  if (url.hostname === "qwickton.com") {
    url.hostname = "www.qwickton.com";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
