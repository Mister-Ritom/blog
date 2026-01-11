export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start
    .replace(/-+$/, '');      // Trim - from end
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Deterministic topic selection based on day of year
export function getTopicsForToday(allTopics: string[], count: number = 4): string[] {
  const today = new Date();
  // Simple hash of the date string to jump around the list
  const seed = today.getFullYear() * 1000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  // Create a copy to shuffle
  const shuffled = [...allTopics].sort((a, b) => {
    // Deterministic random-like sort based on seed and string char codes
    const hashA = a.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + seed;
    const hashB = b.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + seed;
    // Use a simple pseudo-random mechanism
    return (Math.sin(hashA) - Math.sin(hashB));
  });

  return shuffled.slice(0, count);
}
