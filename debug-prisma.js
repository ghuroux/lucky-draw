// Debug script to print available Prisma models
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Initializing Prisma client for debugging...');
  
  try {
    const prisma = new PrismaClient();
    
    console.log('Available Prisma models and properties:');
    console.log('=====================================');
    
    // Print all top-level properties of the prisma client
    const props = Object.keys(prisma);
    console.log('Top-level properties:', props);
    
    // Check for specific model names
    const modelNames = [
      'event', 'events',
      'entry', 'entries',
      'entrant', 'entrants',
      'prize', 'prizes',
      'adminUser', 'admin_users',
      'entryPackage', 'entry_packages'
    ];
    
    console.log('\nChecking specific model names:');
    modelNames.forEach(name => {
      console.log(`- ${name}: ${prisma[name] ? 'EXISTS' : 'NOT FOUND'}`);
    });
    
    // Try to query events
    console.log('\nAttempting to query events:');
    try {
      // Try camelCase
      const eventCount = await prisma.event.count();
      console.log(`- prisma.event.count(): ${eventCount}`);
    } catch (err) {
      console.log(`- prisma.event.count() ERROR: ${err.message}`);
    }
    
    try {
      // Try snake_case
      const eventsCount = await prisma.events.count();
      console.log(`- prisma.events.count(): ${eventsCount}`);
    } catch (err) {
      console.log(`- prisma.events.count() ERROR: ${err.message}`);
    }
    
  } catch (err) {
    console.error('ERROR initializing Prisma:', err);
  }
}

main()
  .then(() => console.log('Debug complete'))
  .catch(e => console.error('Debug script error:', e)); 