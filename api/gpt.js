import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,  // Use the environment variable defined in Vercel
});

export async function sendPrompt(content) {
    const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: content }],
        stream: true,
    });

    let result = '';
    for await (const chunk of stream) {
        result += chunk.choices[0]?.delta?.content || "";
    }
    return result;
}
