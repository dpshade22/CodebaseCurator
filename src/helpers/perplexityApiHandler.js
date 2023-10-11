import { fetch } from 'bun';

const DECLARATIVE_SYSTEM_MSG = "You are a professional programmer completing a code review. Summarize the file at the end of your review.";
const API_BASE = 'https://api.perplexity.ai/chat/completions';

export async function getLlmResponses(repo_dict) {
    const llm_responses_dict = {};
    for (const [path, item] of Object.entries(repo_dict)) {
        if (item['type'] === 'file') {
            const llm_response = await interactWithLlm(item['content'], DECLARATIVE_SYSTEM_MSG);
            llm_responses_dict[path] = llm_response;
        }
    }
    return llm_responses_dict;
}

export async function interactWithLlm(message, systemMessage = 'Be precise and concise') {
    const api_key = process.env.PPLX_API_KEY;
    const headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": `Bearer ${api_key}`
    };
    const payload = {
        "model": "mistral-7b-instruct",
        "messages": [
            { "role": "system", "content": systemMessage },
            { "role": "user", "content": message }
        ]
    };
    const response = await fetch(API_BASE, { method: 'POST', body: JSON.stringify(payload), headers });
    if (!response.ok) throw new Error('Failed to interact with LLM');
    return await response.json();
}
