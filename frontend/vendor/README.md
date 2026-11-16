# Third-party assets

All runtime dependencies that would otherwise come from a CDN live here:
fonts, JavaScript and CSS libraries, and other static assets. The app must
reference local files from this folder, never remote CDN or font-service URLs.

When adding an asset:

1. Download the files into `frontend/vendor/<name>/<version>/`.
2. Include the project's license and a short note about its origin and the
   exact files downloaded.
3. Reference the local path from the frontend (for example a `@font-face`
   rule pointing at `vendor/<name>/<version>/<file>.woff2`).
4. Exclude the folder from formatting; it is already listed in
   `.prettierignore`, so third-party files stay byte-identical.

Nothing is vendored yet. The design system uses system font stacks. If a
custom font is ever needed, pick an open-licensed one and vendor it here with
its license.
