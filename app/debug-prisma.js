// Debug script to check Prisma models
const { PrismaClient } = require('@prisma/client');

async function debugPrisma() {
  try {
    const prisma = new PrismaClient();
    
    console.log('Prisma client initialized successfully');
    console.log('Available models:');
    console.log(Object.keys(prisma));
    
    // Try to access the admin_users model directly
    console.log('\nTrying to access admin_users model:');
    if (prisma.admin_users) {
      console.log('prisma.admin_users exists');
    } else {
      console.log('prisma.admin_users does not exist');
    }
    
    // Try to access the adminUser model directly 
    console.log('\nTrying to access adminUser model:');
    if (prisma.adminUser) {
      console.log('prisma.adminUser exists');
    } else {
      console.log('prisma.adminUser does not exist');
    }
    
    // List all model names correctly
    console.log('\nDumpAll method names on prisma:');
    for (const key in prisma) {
      if (typeof prisma[key] === 'object' && prisma[key] !== null) {
        console.log(`- ${key}`);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error debugging Prisma:', error);
  }
}

debugPrisma(); 