# Google school-account login for GitHub Pages

The GitHub Pages build displays the Google Identity Services sign-in button and only opens the studio after Google confirms all of these claims:

- the ID token audience matches this site's Web OAuth client ID;
- the token is valid and not expired;
- `email_verified` is true;
- the Google Workspace hosted domain is `keilong.edu.hk`; and
- the email ends in `@keilong.edu.hk`.

## One-time Google Cloud setup

1. In Google Cloud Console, create a **Web application** OAuth client under the school project.
2. Add this exact authorized JavaScript origin:
   `https://lkw-gif.github.io`
3. For local testing, also add the local origin and port you use.
4. Copy the Web client ID. The client ID is public; do not put a client secret in this repository.

Google's own guidance requires checking the ID token's signature, audience, issuer, expiry and hosted-domain claim when restricting access to a Workspace domain. The static Pages build verifies the signature against Google's public signing keys before checking those claims. A server-side verifier or an access proxy remains the stronger option for protecting private data because GitHub Pages serves static files publicly.

## GitHub repository setup

Create a repository variable named `GOOGLE_CLIENT_ID` under **Settings → Secrets and variables → Actions → Variables**. Set its value to the Web client ID, then run the **Deploy to GitHub Pages** workflow again. The workflow injects it as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` at build time.

If the variable is missing, the site shows a configuration message instead of opening the studio. The Site deployment continues to use its existing ChatGPT sign-in gate.
