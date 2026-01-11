import { createClient } from '@sanity/client';
import type { SanityDocumentStub } from '@sanity/client';
import * as dotenv from 'dotenv';
import { slugify } from './utils';

dotenv.config();

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false, // We need fresh data for checks
  apiVersion: '2024-01-01',
});

export async function uploadImage(imageBuffer: Buffer, filename: string) {
  console.log(`[Sanity] Uploading image: ${filename}...`);
  return client.assets.upload('image', imageBuffer, {
    filename: filename,
  });
}

export async function ensureAuthor(name: string) {
  const slug = slugify(name);
  const existing = await client.fetch(`*[_type == "author" && slug.current == $slug][0]`, { slug });
  
  if (existing) return existing._id;

  console.log(`[Sanity] Creating author: ${name}`);
  const newAuthor = await client.create({
    _type: 'author',
    name: name,
    slug: { _type: 'slug', current: slug },
  });
  return newAuthor._id;
}

export async function ensureCategory(title: string) {
  // Use title for lookup to avoid duplicates if slug varies
  const existing = await client.fetch(`*[_type == "category" && title == $title][0]`, { title });
  
  if (existing) return existing._id;

  console.log(`[Sanity] Creating category: ${title}`);
  const slug = slugify(title);
  const newCategory = await client.create({
    _type: 'category',
    title: title,
    slug: { _type: 'slug', current: slug },
  });
  return newCategory._id;
}

export async function slugExists(slug: string): Promise<boolean> {
  const existing = await client.fetch(`count(*[_type == "post" && slug.current == $slug])`, { slug });
  return existing > 0;
}

export async function createPost(postDoc: SanityDocumentStub) {
  console.log(`[Sanity] Creating post: ${postDoc.title}`);
  return client.create(postDoc);
}
