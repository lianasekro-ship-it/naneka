/**
 * GitHub read-only routes — internal/admin use only.
 * All endpoints require a valid Bearer token (authenticate middleware).
 *
 * GET /api/v1/github/repo           → repo metadata
 * GET /api/v1/github/commits        → recent commits  (?branch=main&limit=10)
 * GET /api/v1/github/file?path=...  → read a file     (?path=backend/package.json&ref=main)
 * GET /api/v1/github/ls?path=...    → list a directory (?path=db/migrations&ref=main)
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getFile, listDirectory, getRepoInfo, getCommits } from '../services/github.js';

const router = Router();

// All GitHub routes require authentication
router.use(authenticate);

// ─── GET /api/v1/github/repo ─────────────────────────────────────────────────
router.get('/repo', async (_req, res, next) => {
  try {
    res.json(await getRepoInfo());
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/github/commits ──────────────────────────────────────────────
router.get('/commits', async (req, res, next) => {
  try {
    const branch = req.query.branch || undefined;
    const limit  = parseInt(req.query.limit, 10) || 10;
    res.json(await getCommits(branch, limit));
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/github/file?path=<repo-relative-path> ───────────────────────
router.get('/file', async (req, res, next) => {
  try {
    const { path, ref } = req.query;
    if (!path) return res.status(400).json({ error: 'path query parameter is required' });

    // Block any path traversal attempts
    if (path.includes('..')) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    res.json(await getFile(path, ref));
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'File not found in repository' });
    }
    next(err);
  }
});

// ─── GET /api/v1/github/ls?path=<dir> ────────────────────────────────────────
router.get('/ls', async (req, res, next) => {
  try {
    const { path = '', ref } = req.query;

    if (path.includes('..')) {
      return res.status(400).json({ error: 'Invalid path' });
    }

    res.json(await listDirectory(path, ref));
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Directory not found in repository' });
    }
    next(err);
  }
});

export default router;
