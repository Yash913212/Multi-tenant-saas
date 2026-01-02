import app from './app.js';
import db from './config/db.js';

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        await db.migrate.latest();
        await db.seed.run();
        app.listen(PORT, () => {
            console.log(`Backend listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server', err);
        process.exit(1);
    }
}

start();