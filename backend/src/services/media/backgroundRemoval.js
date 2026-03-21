/**
 * Background Removal Service — SAFE MODE
 *
 * The local @imgly/background-removal-node AI engine is fully disabled.
 * It caused OOM server crashes and must not be re-enabled until a cloud
 * API key (e.g. remove.bg / Clipdrop) is configured and tested.
 *
 * Safe Mode behaviour:
 *   - Original buffer is returned untouched.
 *   - message: 'Cloud API Required' signals to callers why removal was skipped.
 *   - Watermark and all other pipeline steps continue as normal.
 *
 * To re-enable: replace this stub with a cloud API call and set skipped: false.
 */

/**
 * @param {Buffer} inputBuffer  Raw image buffer (JPEG, PNG, WebP, etc.)
 * @returns {Promise<{ buffer: Buffer, creditsCharged: number, skipped: boolean, message: string }>}
 */
export async function removeBackground(inputBuffer) {
  console.log('[media/bgRemoval] SAFE MODE — local AI engine disabled. Cloud API Required.');
  return { buffer: inputBuffer, creditsCharged: 0, skipped: true, message: 'Cloud API Required' };
}
