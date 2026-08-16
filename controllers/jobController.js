const Job = require('../models/jobModel');
const redisClient = require('../config/redis'); 
const { esClient } = require('../config/elastic');

// @desc    Create a new job
// @route   POST /api/jobs
exports.createJob = async (req, res) => {
    try {
        const { title, description, company, location, requirements } = req.body;

        const job = await Job.create({
            title,
            description,
            company,
            location,
            requirements,
            postedBy: req.user.id 
        });

        await redisClient.del('all_jobs');

        res.status(201).json({ message: 'Job posted successfully', job });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all jobs (Cached via Redis)
// @route   GET /api/jobs
exports.getAllJobs = async (req, res) => {
    try {
        const cacheKey = 'all_jobs';
        
        const cachedJobs = await redisClient.get(cacheKey); 

        if (cachedJobs) { 
            console.log('Cache Hit! Serving jobs from Redis RAM...');
            return res.status(200).json(JSON.parse(cachedJobs));
        }
        console.log('Cache Miss! Fetching jobs from MongoDB Disk...');
        const jobs = await Job.find().populate('postedBy', 'username email'); 
        
        await redisClient.setEx(cacheKey, 600, JSON.stringify(jobs)); 

        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Search jobs using Elasticsearch Full-Text Search
// @route   GET /api/jobs/search?q=query
exports.searchJobs = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.status(400).json({ message: 'Search query parameter (q) is required' });
        }

        const cleanQuery = q.trim();

        const result = await esClient.search({
            index: 'jobs',
            query: {
                bool: {
                    should: [
                        {
                            multi_match: {
                                query: cleanQuery,
                                type: 'phrase_prefix',
                                fields: ['title^3', 'requirements^2', 'description', 'company', 'location']
                            }
                        },
                        {
                            multi_match: {
                                query: cleanQuery,
                                fields: ['title^3', 'requirements^2', 'description', 'company', 'location'],
                                fuzziness: cleanQuery.length > 3 ? 'AUTO' : 0
                            }
                        }
                    ]
                }
            }
        });

        const jobs = result.hits.hits.map(hit => ({
            _id: hit._id,
            ...hit._source
        }));

        res.status(200).json({
            success: true,
            total: result.hits.total.value,
            jobs
        });
    } catch (error) {
        res.status(500).json({ message: 'Elasticsearch Search Error', error: error.message });
    }
};

// @desc    Get recruiter's posted jobs
// @route   GET /api/jobs/my-jobs
exports.getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.find({ postedBy: req.user.id });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.postedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this job' });
        }

        await job.deleteOne();

        await redisClient.del('all_jobs');

        res.status(200).json({ message: 'Job removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};