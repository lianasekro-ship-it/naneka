/**
 * GitHub REST API v3 client — read-only access to the Naneka repository.
 *
 * Uses GITHUB_TOKEN (Personal Access Token) for authentication.
 * Required token scopes: `repo` (private) or `public_repo` (public).
 *
 * Repo: lianasekro-ship-it/naneka
 */
import axios from 'axios';

const GITHUB_API  = 'https://api.github.com';
const REPO_OWNER  = process.env.GITHUB_REPO_OWNER || 'lianasekro-ship-it';
const REPO_NAME   = process.env.GITHUB_REPO_NAME  || 'naneka';

function githubClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');

  return axios.create({
    baseURL: GITHUB_API,
    timeout: 15_000,
    headers: {
      Authorization:        `Bearer ${token}`,
      Accept:               'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
}

/**
 * Read a file from the repository.
 * Returns the decoded text content + file metadata.
 *
 * @param {string} filePath  Repo-relative path, e.g. 'backend/package.json'
 * @param {string} [ref]     Branch, tag, or commit SHA. Defaults to repo default branch.
 * @returns {{ path, content, sha, size, html_url }}
 */
export async function getFile(filePath, ref) {
  const client = githubClient();
  const params = ref ? { ref } : {};

  const { data } = await client.get(
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
    { params },
  );

  if (data.type !== 'file') {
    throw Object.assign(new Error(`${filePath} is a directory, not a file`), { status: 400 });
  }

  return {
    path:     data.path,
    content:  Buffer.from(data.content, 'base64').toString('utf8'),
    sha:      data.sha,
    size:     data.size,
    html_url: data.html_url,
  };
}

/**
 * List the contents of a directory in the repository.
 *
 * @param {string} dirPath   Repo-relative directory path, e.g. 'db/migrations'
 * @param {string} [ref]     Branch/tag/SHA. Defaults to default branch.
 * @returns {Array<{ name, path, type, size, sha, html_url }>}
 */
export async function listDirectory(dirPath = '', ref) {
  const client = githubClient();
  const params = ref ? { ref } : {};

  const { data } = await client.get(
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${dirPath}`,
    { params },
  );

  const entries = Array.isArray(data) ? data : [data];
  return entries.map(({ name, path, type, size, sha, html_url }) => ({
    name, path, type, size, sha, html_url,
  }));
}

/**
 * Get repository metadata (description, default branch, topics, etc.)
 */
export async function getRepoInfo() {
  const client   = githubClient();
  const { data } = await client.get(`/repos/${REPO_OWNER}/${REPO_NAME}`);

  return {
    name:           data.name,
    full_name:      data.full_name,
    description:    data.description,
    default_branch: data.default_branch,
    topics:         data.topics,
    visibility:     data.visibility,
    updated_at:     data.updated_at,
    html_url:       data.html_url,
  };
}

/**
 * Get the latest commits on a branch.
 *
 * @param {string} [branch]  Defaults to repo default branch.
 * @param {number} [limit]   Max number of commits to return (1–100).
 */
export async function getCommits(branch, limit = 10) {
  const client = githubClient();
  const params = { per_page: Math.min(limit, 100) };
  if (branch) params.sha = branch;

  const { data } = await client.get(
    `/repos/${REPO_OWNER}/${REPO_NAME}/commits`,
    { params },
  );

  return data.map(c => ({
    sha:     c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0], // first line only
    author:  c.commit.author.name,
    date:    c.commit.author.date,
    url:     c.html_url,
  }));
}
