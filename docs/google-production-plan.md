# Google production plans

The district designer stores the chosen PLA material on each printed building.
Matte and transparent materials use the shared ten-item palette in
`lib/building-materials.ts`. Wooden models use natural wood. Design JSON files
preserve materials and dimensions; earlier files default to matte cobalt blue.

The Generate production plan button fills the latest ten-column Word template
in memory, then imports it as a native Google Doc in the signed-in student's
Drive. It does not download a Word file. The plan language selector is independent
of the website language. Dimensions are physical millimetres. Identical models
with different dimensions, names or PLA materials have separate table rows.

## Google Cloud configuration

Use the existing `yuen-long-urban-studio` project and Web OAuth client.
Keep the public client ID in the GitHub Actions `GOOGLE_CLIENT_ID` repository
variable. The JavaScript origin must include `https://lkw-gif.github.io`.

Enable **Google Drive API** and declare these non-sensitive OAuth scopes:

- `openid`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/drive.file`

The token client requests only these permissions and verifies the account
using Google's UserInfo endpoint before uploading anything. It must have a
verified `@keilong.edu.hk` address, the matching Workspace domain, and the same
email as the website login. Tokens stay in memory. No client secret is used.

Each user approves Google Drive permission the first time they generate a plan.
The school administrator may need to allow this client in Workspace app access
controls. Internal audience supports school accounts directly; an external app
must be available to the intended school users rather than restricted to a
testing-only list. Do not broaden the application to full-Drive access.

Documents inherit the user's private My Drive ownership. The app makes no
sharing or permission requests. Users can edit member names and responsibilities
in Google Docs and submit their completed document to their teacher themselves.

Interrupted uploads reuse a request ID stored on the created file, allowing a
retry to recover the same document. After success the editor shows the returned
Google Docs link, which also works when the browser blocks automatic opening.

## Validation

Run `node scripts/check-district.cjs`, `node scripts/check-production-plan.cjs`
and `node scripts/check-google-drive-plan.cjs`. Checks cover colour persistence,
malformed imports, exact mm values, bilingual table fields, preserved template
parts, account/scope restrictions, native conversion and retry recovery.

For template changes, render the Chinese and English maximum-capacity examples
and inspect every page. Also inspect a native Google Docs PDF export; conversion
can change page breaks while preserving the table. The retained source template
must remain unchanged.
