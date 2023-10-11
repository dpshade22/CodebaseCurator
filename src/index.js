import { Hono } from 'hono';
import { getRepoContents } from './helpers/githubApiHandler.js';
import { getLlmResponses, interactWithLlm } from './helpers/perplexityApiHandler.js';
import { traverseRepo, getTreeContents, isProgrammingFile, decodeContent } from './helpers/githubTreeHandler.js'

const app = new Hono();

const TOKEN = process.env.GIT_PAT

app.get('/summarize_codebase', async (c) => {
    const user = c.req.query('user');
    const repo = c.req.query('repo');

    const tree = await getTreeContents(user, repo, TOKEN);
    const repo_dict = await traverseRepo(tree, user, repo, TOKEN);
    const llm_dict = await getLlmResponses(repo_dict);
    return c.json(llm_dict);
});

app.get('/file_summary', async (c) => {
    const user = c.req.query('user');
    const repo = c.req.query('repo');
    const filepath = c.req.query('filepath');

    const contents = await getRepoContents(user, repo, filepath, TOKEN);
    if (isProgrammingFile(contents['name'])) {
        const file_content = decodeContent(contents);
        const summary = await interactWithLlm(`Summarize this file: ${file_content}`);
        return c.json({ 'summary': summary });
    }
    throw new Error('File not found or not a programming file');
});

app.get('/list_files', async (c) => {
    const user = c.req.query('user');
    const repo = c.req.query('repo');

    const tree = await getTreeContents(user, repo, TOKEN);
    const files = tree['tree'].filter(el => el['type'] === 'blob').map(el => el['path']);
    const folders = tree['tree'].filter(el => el['type'] === 'tree').map(el => el['path']);
    return c.json({ 'files': files, 'folders': folders });
});

app.get('/get_tree', async (c) => {
    const user = c.req.query('user');
    const repo = c.req.query('repo');

    const tree = await getTreeContents(user, repo, TOKEN);
    return c.json({ 'tree': tree });
});

app.showRoutes()

export default {
    port: 3000,
    fetch: app.fetch,
}
