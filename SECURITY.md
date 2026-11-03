# Security and privacy

MatterForge Lab keeps experiments and settings on the local computer. It has no analytics, account service or cloud sync. The optional local AI explainer contacts a loopback endpoint only on request. Update checks and downloads contact GitHub only on request. Opening a research reference or release link opens the system browser.

The renderer is sandboxed, uses context isolation and cannot call Node.js. A restricted bridge exposes only app update actions. Navigation and permission requests are restricted. The application renders local packaged code through a dedicated protocol with a content security policy.

Updates must match a release manifest signed by the embedded public key. A missing, wrong or altered signature prevents installation. The private signing key is not part of the repository, CI artifacts or installer.

Report a vulnerability privately through the repository's GitHub security reporting feature when enabled. Do not put credentials, private experiments or personal machine paths in a public issue. This educational app is not a validated scientific or safety-critical system.
