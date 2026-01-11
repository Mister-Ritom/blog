import { topics } from './topics';
import { getTopicsForToday, sleep, slugify } from './utils';
import { generateBlogContent, generateThumbnail } from './ai';
import { createPost, ensureAuthor, ensureCategory, uploadImage, slugExists } from './sanity';
import { convertToPortableText } from './portableText';

// Config
const AUTHOR_NAME = "AI-GPT-4o";
const POSTS_PER_RUN = 5; 

async function main() {
  console.log("=== AUTO-BLOG RUN STARTED ===");
  
  // 1. Select Topics
  // We use deterministic selection + a slice to pick 4-5 topics
  // Logic: getTopicsForToday uses date seed. 
  const selectedTopics = getTopicsForToday(topics, POSTS_PER_RUN);
  console.log(`Selected Topics: ${selectedTopics.join(', ')}`);

  // 2. Process each topic sequentially to respect rate limits
  for (const topic of selectedTopics) {
    try {
      console.log(`\n--- Processing Topic: ${topic} ---`);
      
      // A. Generate Text
      const blogData = await generateBlogContent(topic);
      
      // B. Check uniqueness
      let cleanSlug = slugify(blogData.slug || blogData.title);
      if (await slugExists(cleanSlug)) {
        console.warn(`[Skip] Slug "${cleanSlug}" already exists. Skipping to prevent duplicates.`);
        continue;
      }

      // C. Generate Image
      const imageBuffer = await generateThumbnail(topic);
      
      // D. Upload Assets & Prepare Metadata
      const imageAsset = await uploadImage(imageBuffer, `${cleanSlug}.png`);
      const authorId = await ensureAuthor(AUTHOR_NAME);
      const categoryId = await ensureCategory(blogData.category);
      const bodyBlocks = convertToPortableText(blogData.content);

      // E. Create Post Document
      const autoPublish = process.env.AUTO_PUBLISH === 'true';
      
      const postDoc = {
        _type: 'post',
        title: blogData.title,
        slug: { _type: 'slug', current: cleanSlug },
        excerpt: blogData.excerpt,
        publishedAt: new Date().toISOString(),
        author: { _type: 'reference', _ref: authorId },
        categories: [{ _type: 'reference', _ref: categoryId, _key: categoryId }], // Sanity array refs often need keys
        mainImage: {
          _type: 'image',
          asset: { _type: "reference", _ref: imageAsset._id }
        },
        body: bodyBlocks, 
        seo: {
          metaTitle: blogData.seoTitle,
          metaDescription: blogData.seoDescription
        }
      };

      // Create (and optionally publish logic could be added, creates draft by default)
      // If we want to publish, we can create normally (draft) and then patch to publish, 
      // or just create directly if dataset is public (not fully correct, Sanity uses "drafts." prefix for drafts).
      // By default `client.create` creates a published doc unless _id starts with `drafts.`.
      // The prompt says "Create posts as drafts (default) - Optionally publish if AUTO_PUBLISH=true".
      
      // Sanity convention: Documents without `drafts.` prefix are published. 
      // Documents WITH `drafts.` prefix are drafts.
      // So if AUTO_PUBLISH=false, we should prefix _id with `drafts.`.
      
      const docId = autoPublish ? undefined : `drafts.${cleanSlug}`; // undefined lets Sanity gen ID
      
      // If we force ID, we must use createOrReplace or createIfNotExists usually, but create works if ID is new.
      // Ideally we let Sanity gen ID. 
      // For draft/publish: 
      // If we want DRAFT: create doc with `_id: drafts.<guid>`.
      // If we want PUBLISHED: create doc with `_id: <guid>` (and no drafts. version pending).
      
      // Safe approach: Let Sanity generate ID.
      // If DRAFT needed: The standard approach is to create a document. 
      // If we simply `create` it, it is LIVE.
      // To make it a DRAFT, we must specify `_id` starting with `drafts.`.
      
      if (!autoPublish) {
         // Create as draft
         // We'll use the slug as the ID base for predictability or random
         postDoc['_id'] = `drafts.${cleanSlug}`; 
         // If collision on simple ID, sanity errors. But we checked slug uniqueness above. 
      }

      await createPost(postDoc);
      console.log(`[Success] Post created: ${blogData.title} (${autoPublish ? 'Published' : 'Draft'})`);

    } catch (error) {
      console.error(`[Error] Failed to process topic "${topic}":`, error);
      // Continue to next topic
    }

    // Brief pause to be nice to APIs
    await sleep(2000);
  }
}

main().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
