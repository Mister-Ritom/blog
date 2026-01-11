import OpenAI from 'openai';
import { BLOG_PROMPT, IMAGE_PROMPT_PREFIX, IMAGE_PROMPT_SUFFIX } from './prompt';
import * as dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedBlog {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  category: string;
  content: {
    heading: string;
    paragraphs: string[];
  }[];
}

export async function generateBlogContent(topic: string): Promise<GeneratedBlog> {
  console.log(`[AI] Generating blog for topic: "${topic}"...`);
  const compliance = "RETURN JSON ONLY.";
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: BLOG_PROMPT + "\n" + compliance },
      { role: "user", content: `Topic: ${topic}` },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No content returned from OpenAI");

  return JSON.parse(content) as GeneratedBlog;
}

export async function generateThumbnail(topic: string): Promise<Buffer> {
  console.log(`[AI] Generating thumbnail for topic: "${topic}"...`);
  
  const prompt = `${IMAGE_PROMPT_PREFIX}${topic}${IMAGE_PROMPT_SUFFIX}`;
  
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1792x1024",
    response_format: "b64_json",
  });

  const b64 = response.data[0].b64_json;
  if (!b64) throw new Error("No image generated");

  return Buffer.from(b64, 'base64');
}
