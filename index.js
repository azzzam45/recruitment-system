const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); 
require('./config/redis');                
const { checkElasticConnection } = require('./config/elastic');
const { initJobChangeStream } = require('./config/mongoChangeStream');

// --- Bull Board---
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const { emailQueue, setupDailyReportJob, addReminderNotification } = require('./queues/emailQueue');
require('./queues/emailWorker');

const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

dotenv.config();
const app = express();

// دالة تجميعية لتهيئة الاتصالات والخدمات بشكل منظّم
const startApp = async () => {
    try {
        await connectDB();
        initJobChangeStream();
        checkElasticConnection();
    } catch (err) {
        console.error('Failed to initialize database or services:', err);
    }
};

startApp();

app.use(express.static('public'));
app.use(express.json());

// ---  (Queue Monitoring Dashboard) ---
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
// --------------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/api/test-reminder', async (req, res) => {
    await addReminderNotification({ email: 'azaam@example.com' }, 10000);
    res.json({ message: 'Reminder notification scheduled in 10 seconds!' });
});

app.get('/', (req, res) => {
    res.send('Recruitment System API is running...');
});

const PORT = process.env.PORT || 8002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    
    setupDailyReportJob();
});