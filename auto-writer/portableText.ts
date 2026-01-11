import { randomUUID } from 'crypto';

interface Section {
  heading: string;
  paragraphs: string[];
}

export function convertToPortableText(sections: Section[]) {
  const blocks: any[] = [];

  sections.forEach((section) => {
    // Add Heading
    if (section.heading) {
      blocks.push({
        _key: randomUUID(),
        _type: 'block',
        style: 'h2',
        children: [
          {
            _key: randomUUID(),
            _type: 'span',
            marks: [],
            text: section.heading,
          },
        ],
        markDefs: [],
      });
    }

    // Add Paragraphs
    section.paragraphs.forEach((para) => {
      blocks.push({
        _key: randomUUID(),
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: randomUUID(),
            _type: 'span',
            marks: [],
            text: para,
          },
        ],
        markDefs: [],
      });
    });
  });

  return blocks;
}
