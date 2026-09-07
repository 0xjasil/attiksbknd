import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function seedGalleryFromJson() {
  const jsonPath = path.resolve('f:/attiks/src/data/gallery-posts.json');
  console.log('Reading gallery posts from:', jsonPath);
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found: ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const posts = JSON.parse(rawData);

  console.log(`Found ${posts.length} posts to upsert.`);

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const createdDate = p.createdAt ? new Date(p.createdAt) : new Date();

    const data = {
      id: p.id || `gallery-${i + 1}`,
      image: p.image || '',
      caption: p.caption || 'Attiks Architectural Highlight',
      altText: p.altText || p.caption || 'Attiks Architecture Gallery Feature',
      description: p.description || '',
      location: p.location || '',
      aspectRatio: p.aspectRatio || 'square',
      order: typeof p.order === 'number' ? p.order : i + 1,
      active: p.active !== undefined ? Boolean(p.active) : true,
      createdAt: isNaN(createdDate.getTime()) ? new Date() : createdDate,
    };

    await prisma.galleryPost.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
    console.log(`[${i + 1}/${posts.length}] Upserted gallery post: ${data.id} - ${data.caption}`);
  }

  const totalCount = await prisma.galleryPost.count();
  console.log(`\nSuccessfully synced all gallery posts! Total posts in DB: ${totalCount}`);
}

seedGalleryFromJson()
  .catch((e) => {
    console.error('Error seeding gallery posts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
