import createApp from './factories/createApp.factorie.js';
import prisma from './database/db.js';

const app = createApp();

try {
    await prisma.$connect();
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
} catch (error) {
    console.error('Could not connect to the database. Check DATABASE_URL and that MySQL is running.');
    console.error(error.message);
    process.exit(1);
}