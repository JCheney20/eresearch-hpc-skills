// Headless level validation: node tools/validate.mjs (node >= 19).
// Same checks as validateLevels() in the browser console.
import { validateLevels } from "../js/levels/index.js";

const ok = await validateLevels();
process.exit(ok ? 0 : 1);
