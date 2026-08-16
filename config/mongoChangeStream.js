const Job = require('../models/jobModel');
const { esClient } = require('../config/elastic');

const initJobChangeStream = () => {
    try {
        // فتح الـ Change Stream مع خيار fullDocument لضمان وصول البيانات كاملة عند التحديث
        const changeStream = Job.watch([], { fullDocument: 'updateLookup' });

        console.log('🔄 MongoDB Change Stream is active for Elasticsearch sync...');

        changeStream.on('change', async (change) => {
            console.log(`🔔 DB Change Detected: [${change.operationType}]`);

            try {
                // 1️⃣ عند إضافة وظيفة جديدة أو تعديل قائمة
                if (change.operationType === 'insert' || change.operationType === 'update') {
                    const doc = change.fullDocument;
                    if (doc) {
                        await esClient.index({
                            index: 'jobs',
                            id: doc._id.toString(),
                            document: {
                                title: doc.title || '',
                                description: doc.description || '',
                                company: doc.company || '',
                                location: doc.location || '',
                                requirements: doc.requirements || []
                            }
                        });
                        console.log(`✅ Job indexed/updated in Elasticsearch: ${doc._id}`);
                    }
                }

                // 2️⃣ عند حذف وظيفة
                else if (change.operationType === 'delete') {
                    const idToDelete = change.documentKey._id.toString();
                    await esClient.delete({
                        index: 'jobs',
                        id: idToDelete
                    }).catch(err => {
                        // التجاهل في حال كان الملف غير موجود أصلاً في إيلاستيك
                        if (err.meta && err.meta.statusCode !== 404) {
                            throw err;
                        }
                    });
                    console.log(`🗑️ Job deleted from Elasticsearch: ${idToDelete}`);
                }
            } catch (err) {
                console.error('⚠️ Change Stream Sync Error:', err.message);
            }
        });

        changeStream.on('error', (error) => {
            console.error('❌ Change Stream Error:', error.message);
        });

    } catch (error) {
        console.error('❌ Failed to initialize Change Stream:', error.message);
    }
};

module.exports = { initJobChangeStream };