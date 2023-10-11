import { getRepoContents } from './githubApiHandler.js';

const PROGRAMMING_EXTENSIONS = ['.py', '.js', '.java', '.c', '.cpp', '.go', '.rb', '.php', '.cs', '.m', '.r', '.swift', '.kt', '.ts', '.scala', '.rs', '.hs', '.lua', '.groovy', '.pl', '.sh', '.html', '.css', '.sass', '.scss', 'Dockerfile', '.toml'];

export async function getLatestCommitSha(user, repo, token = '') {
  const headers = token ? { 'Authorization': `token ${token}` } : {};
  const url = `https://api.github.com/repos/${user}/${repo}/commits`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch latest commit sha');
  const data = await response.json();
  return data[0]['sha'];
}

export async function getTreeContents(user, repo, token = '') {
  const headers = token ? { 'Authorization': `token ${token}` } : {};
  const tree_sha = await getLatestCommitSha(user, repo, token);
  const url = `https://api.github.com/repos/${user}/${repo}/git/trees/${tree_sha}?recursive=true`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch tree contents');
  return await response.json();
}

export function isProgrammingFile(file_name) {
  const extension = file_name.slice(file_name.lastIndexOf('.'));
  const filename = file_name.slice(0, file_name.lastIndexOf('.'));
  return PROGRAMMING_EXTENSIONS.includes(extension) || PROGRAMMING_EXTENSIONS.includes(filename);
}

export function decodeContent(file_contents) {
  if ('content' in file_contents && file_contents['encoding'] === 'base64') {
    return Buffer.from(file_contents['content'], 'base64').toString('utf-8');
  }
  return null;
}

export async function traverseRepo(tree, user, repo, token = '') {
  const repo_dict = {};
  for (const item of tree['tree']) {
    if (item['type'] === 'blob' && isProgrammingFile(item['path'])) {
      const file_contents = await getRepoContents(user, repo, item['path'], token);
      repo_dict[item['path']] = {
        'type': 'file',
        'name': item['path'],
        'content': decodeContent(file_contents)
      };
    } else if (item['type'] === 'tree') {
      repo_dict[item['path']] = {
        'type': 'dir',
        'name': item['path']
      };
    }
  }
  return repo_dict;
}
