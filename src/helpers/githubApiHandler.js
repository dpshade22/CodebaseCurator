import { fetch } from 'bun';

export async function getRepoContents(user, repo, path = '', token = '') {
    const headers = token ? { 'Authorization': `token ${token}` } : {};
    const url = `https://api.github.com/repos/${user}/${repo}/contents/${path}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch repo contents');
    return await response.json();
}