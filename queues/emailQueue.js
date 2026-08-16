const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

const emailQueue = new Queue('emailQueue', {
    connection: redisConnection
});

const addEmailToQueue = async (emailData) => {
    await emailQueue.add('sendWelcomeEmail', emailData, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
    });
};

const addReminderNotification = async (userData, delayInMs) => {
    await emailQueue.add('sendReminderNotification', userData, {
        delay: delayInMs
    });
    console.log(`⏰ Reminder scheduled for ${userData.email} in ${delayInMs / 1000} seconds.`);
};

const setupDailyReportJob = async () => {
    await emailQueue.add(
        'generateDailyReport',
        { reportType: 'Daily Applications Summary' },
        {
            repeat: {
                pattern: '0 0 * * *' 
            }
        }
    );
    console.log('🔄 Daily Report Cron Job configured successfully!');
};

module.exports = { 
    emailQueue, 
    addEmailToQueue, 
    addReminderNotification, 
    setupDailyReportJob 
};