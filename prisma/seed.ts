import { PrismaClient, Role, ProjectStatus, LeadStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting clean database seed (Projects, Leads, Testimonials, Users)...');

  // 1. Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@attiks.in' },
    update: {
      name: 'Attiks Principal Architect',
      role: Role.ADMIN,
    },
    create: {
      email: 'admin@attiks.in',
      password: hashedPassword,
      name: 'Attiks Principal Architect',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Seeded default admin: ${admin.email}`);

  // 2. Projects
  const projectsData = [
    {
      id: 'soori-residence',
      title: 'Soori Residence',
      slug: 'soori-residence',
      category: 'residential',
      location: 'Coimbatore, Tamil Nadu',
      year: '2026',
      image: '/uploads/img_1788003575720_attiks-136.jpg',
      description: 'A home shaped by its context, its climate, and the everyday life of its occupants.\n\nDesigned as a composition of volumes, courtyards, transitions and carefully considered spaces, Soori Residence explores a quiet dialogue between architecture and nature.\n\nThe experience unfolds gradually from the approach and arrival to the more intimate spaces within with light, landscape, material and scale working together to create a sense of continuity throughout the home.\n\nEvery element was considered not only as an object, but as part of the experience of living.',
      highlights: ['Soori Residence | Coimbatore'],
      gallery: [
        '/uploads/img_1788003644615_attiks-46.jpg',
        '/uploads/img_1788003645062_attiks-58.jpg',
        '/uploads/img_1788003645619_attiks-60.jpg',
        '/uploads/img_1788003646043_attiks-136.jpg',
        '/uploads/img_1788003646576_attiks-28.jpg',
      ],
      scope: 'Masterplanning & Architecture',
      area: '7800 Sqf',
      status: ProjectStatus.PUBLISHED,
      featured: true,
      order: 1,
    },
    {
      id: 'jannath-ayisha',
      title: 'Jannath Ayisha',
      slug: 'jannath-ayisha',
      category: 'residential',
      location: 'Varkala, Kerala',
      year: '2024',
      image: '/uploads/img_1788004263217_x-20.jpg',
      description: 'Jannath Ayisha Residence is conceived as a tropical modern home that celebrates scale, light, and landscape. The design embraces generous volumes that create a sense of openness, while expansive openings allow natural light to define and transform the interiors throughout the day.',
      highlights: [
        'Panoramic Ocean Vistas',
        'Locally Sourced Laterite',
        'Natural Sea Breeze Corridors',
      ],
      gallery: [
        '/uploads/img_1788004496155_UC_TH--12.jpg',
        '/uploads/img_1788004496285_x-17.jpg',
        '/uploads/img_1788004496450_x-22.jpg',
      ],
      scope: 'Residential Architecture & Landscape',
      area: '6,200 sq.ft',
      status: ProjectStatus.PUBLISHED,
      featured: true,
      order: 2,
    },
    {
      id: 'the-edge-convention-center',
      title: 'The Edge Convention Center',
      slug: 'the-edge-convention-center',
      category: 'commercial',
      location: 'Malappuram, Kerala',
      year: '2024',
      image: '/uploads/img_1788004592408_Set01__34_.jpg',
      description: 'The Edge by Attiks Architecture. This convention center gives a modern and contemporary outlook with which building itself creates uniqueness and brings harmony to its surrounding spaces.',
      highlights: [
        'Acoustic Auditorium',
        'Open-Air Amphitheater',
        'Daylight-Filtered Galleries',
      ],
      gallery: [
        '/uploads/img_1788004679585_Set01__34_.jpg',
        '/uploads/img_1788004680124_Set01__5_.jpg',
      ],
      scope: 'Institutional & Cultural Campus',
      area: '33,765 sq.ft',
      status: ProjectStatus.PUBLISHED,
      featured: true,
      order: 3,
    },
    {
      id: 'pavilion-house',
      title: 'Pavilion House',
      slug: 'pavilion-house',
      category: 'interior',
      location: 'Ponnani, Kerala',
      year: '2023',
      image: '/uploads/img_1788005063615_DSC08120-Edit-1.jpg.jpeg',
      description: 'The main idea was to merge the built with in the landscape. As the building ages and trees grow, the built and unbuilt will become more and more seamless.',
      highlights: [
        'Vernacular Sloping Roofs',
        'Private Plunge Pools',
      ],
      gallery: [
        '/uploads/img_1788005098374_DSC08069-Edit-18.jpg.jpeg',
      ],
      scope: 'Hospitality Architecture & Interiors',
      area: '72,000 sq.ft',
      status: ProjectStatus.PUBLISHED,
      featured: true,
      order: 4,
    },
    {
      id: 'heritage-academy',
      title: 'Heritage Academy',
      slug: 'heritage-academy',
      category: 'institutional',
      location: 'Malappuram, Kerala',
      year: '2023',
      image: '/uploads/img_1788005287699_42.png',
      description: 'An educational campus that reinterprets traditional Kerala architectural motifs within a contemporary institutional framework.',
      highlights: [
        'Shaded Verandah Corridors',
        'Central Amphitheater Plaza',
      ],
      gallery: [
        '/uploads/img_1788005339901_bridge_003.png',
      ],
      scope: 'Educational Campus Masterplan',
      area: '95,000 sq.ft',
      status: ProjectStatus.PUBLISHED,
      featured: false,
      order: 5,
    },
    {
      id: 'al-jamia-campus',
      title: 'Al Jamia Knowledge World',
      slug: 'al-jamia-campus',
      category: 'institutional',
      location: 'Malappuram, Kerala',
      year: '2025',
      image: '/uploads/img_1788005358786_53.png',
      description: 'Al Jamia Knowledge World is a sprawling educational campus designed by Attiks Architecture for the Al Jamia educational institutions in Malappuram, Kerala.',
      highlights: [
        'Al Jamia Arts & Science School Campus',
        'Grand Jury Shortlisted Design',
      ],
      gallery: [
        '/uploads/img_1788005339901_bridge_003.png',
      ],
      scope: 'Institutional Campus Masterplan & Architecture',
      area: '95,000 sq.ft',
      status: ProjectStatus.PUBLISHED,
      featured: true,
      order: 6,
    },
  ];

  for (const proj of projectsData) {
    await prisma.project.upsert({
      where: { slug: proj.slug },
      update: proj,
      create: proj,
    });
  }
  console.log(`✅ Seeded ${projectsData.length} projects`);

  // 3. Testimonials (added by users/clients)
  const testimonialsData = [
    {
      id: 'testi-1',
      quote: 'Attiks Architecture creates architecture that responds thoughtfully to context, material, climate and the experience of space.',
      author: 'Arjun Menon',
      designation: 'Director, Greenfield Developments',
      order: 1,
      active: true,
    },
    {
      id: 'testi-2',
      quote: 'Their ability to translate complex requirements into elegant, timeless forms is what sets them apart. Every detail is considered.',
      author: 'Priya Nair',
      designation: 'Founder, Bayshore Hospitality',
      order: 2,
      active: true,
    },
    {
      id: 'testi-3',
      quote: 'Working with the Attiks team was a deeply collaborative experience. They brought genuine vision and sensitivity to our project.',
      author: 'Ravi Shankar',
      designation: 'Trustee, Kerala Arts Foundation',
      order: 3,
      active: true,
    },
  ];

  for (const t of testimonialsData) {
    await prisma.testimonial.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }
  console.log(`✅ Seeded ${testimonialsData.length} testimonials`);

  // 4. Sample Enquiry Leads linked to Project
  const sampleLead = await prisma.lead.upsert({
    where: { id: 'lead-sample-1' },
    update: {
      projectId: 'soori-residence',
    },
    create: {
      id: 'lead-sample-1',
      name: 'Nikhil Verma',
      email: 'nikhil.v@example.com',
      phone: '+91 98765 43210',
      message: 'Interested in bespoke tropical residential architecture design similar to Soori Residence.',
      projectTitle: 'Soori Residence',
      projectId: 'soori-residence',
      status: LeadStatus.NEW,
      notes: 'Initial website consultation request.',
    },
  });
  console.log(`✅ Seeded sample enquiry lead linked to project: ${sampleLead.name}`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });