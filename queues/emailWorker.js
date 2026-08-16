const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

const emailWorker = new Worker('emailQueue', async (job) => {
    console.log(`⏳ Processing Job ID: ${job.id} | Type: ${job.name}`);

    switch (job.name) {
        case 'sendWelcomeEmail':
            console.log(`🚀 [Welcome Email] To: ${job.data.to}`);
            break;

        case 'sendReminderNotification':
            console.log(`🔔 [Reminder Notification] To: ${job.data.email} -> Don't forget to complete your application profile!`);
            break;

        case 'generateDailyReport':
            console.log(`📊 [Daily Report] Generating system summary report at ${new Date().toLocaleTimeString()}...`);
            break;

        default:
            console.log(`Unknown job type: ${job.name}`);
    }
}, {
    connection: redisConnection,
    concurrency: 5 
});

emailWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed: ${err.message}`);
});

module.exports = emailWorker;