import { client } from '@utils/sanity-client';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export interface Author {
    _id: string;
    name: string;
    slug: { current: string };
    image?: SanityImageSource & { alt?: string };
    bio?: any[];
    socialLinks?: {
        twitter?: string;
        github?: string;
        linkedin?: string;
        website?: string;
    };
}

export interface Category {
    _id: string;
    name: string;
    slug: { current: string };
    description?: string;
    color?: string;
}

export interface Post {
    _id: string;
    title: string;
    slug: { current: string };
    excerpt: string;
    featuredImage: SanityImageSource & { alt: string };
    author: Author;
    publishedAt: string;
    content: any[];
    categories?: Category[];
    tags?: string[];
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        ogImage?: SanityImageSource;
    };
}

/**
 * Calculate reading time based on word count
 * Assumes average reading speed of 200 words per minute
 */
export function calculateReadingTime(content: any[]): number {
    if (!content || !Array.isArray(content)) return 1;

    let wordCount = 0;
    
    content.forEach((block: any) => {
        if (block._type === 'block' && block.children) {
            block.children.forEach((child: any) => {
                if (child.text) {
                    wordCount += child.text.split(/\s+/).filter(Boolean).length;
                }
            });
        }
    });

    const minutes = Math.ceil(wordCount / 200);
    return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Fetch all published blog posts
 * Sorted by publish date (newest first)
 */
export async function fetchAllPosts(): Promise<Post[]> {
    const query = `*[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        excerpt,
        featuredImage {
            ...,
            asset->
        },
        author->{
            _id,
            name,
            slug,
            image {
                ...,
                asset->
            },
            bio,
            socialLinks
        },
        publishedAt,
        content,
        categories[]->{
            _id,
            name,
            slug,
            description,
            color
        },
        tags,
        seo
    }`;

    return await client.fetch(query);
}

/**
 * Fetch a single blog post by slug
 */
export async function fetchPostBySlug(slug: string): Promise<Post | null> {
    const query = `*[_type == "post" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        excerpt,
        featuredImage {
            ...,
            asset->
        },
        author->{
            _id,
            name,
            slug,
            image {
                ...,
                asset->
            },
            bio,
            socialLinks
        },
        publishedAt,
        content,
        categories[]->{
            _id,
            name,
            slug,
            description,
            color
        },
        tags,
        seo
    }`;

    return await client.fetch(query, { slug });
}

/**
 * Fetch posts by category slug
 */
export async function fetchPostsByCategory(categorySlug: string): Promise<Post[]> {
    const query = `*[_type == "post" && $categorySlug in categories[]->slug.current] | order(publishedAt desc) {
        _id,
        title,
        slug,
        excerpt,
        featuredImage {
            ...,
            asset->
        },
        author->{
            _id,
            name,
            slug,
            image {
                ...,
                asset->
            },
            bio,
            socialLinks
        },
        publishedAt,
        content,
        categories[]->{
            _id,
            name,
            slug,
            description,
            color
        },
        tags,
        seo
    }`;

    return await client.fetch(query, { categorySlug });
}

/**
 * Fetch related posts by category (excluding current post)
 * Returns up to 'limit' posts
 */
export async function fetchRelatedPosts(postId: string, categoryIds: string[], limit: number = 3): Promise<Post[]> {
    if (!categoryIds || categoryIds.length === 0) return [];

    const query = `*[_type == "post" && _id != $postId && count((categories[]._ref)[@ in $categoryIds]) > 0] | order(publishedAt desc) [0...$limit] {
        _id,
        title,
        slug,
        excerpt,
        featuredImage {
            ...,
            asset->
        },
        author->{
            _id,
            name,
            slug
        },
        publishedAt,
        categories[]->{
            _id,
            name,
            slug,
            color
        }
    }`;

    return await client.fetch(query, { postId, categoryIds, limit });
}
