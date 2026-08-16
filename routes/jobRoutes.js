const express = require('express');
const router = express.Router();
const { 
    createJob, 
    getAllJobs, 
    searchJobs, 
    getMyJobs, 
    deleteJob 
} = require('../controllers/jobController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const rateLimiter = require('../middlewares/rateLimiter');

router.get('/search', rateLimiter, searchJobs);

router.get('/', rateLimiter, getAllJobs);

router.get('/my-jobs', rateLimiter, protect, authorize('recruiter'), getMyJobs);

router.post('/', protect, authorize('recruiter'), createJob);

router.delete('/:id', protect, authorize('recruiter'), deleteJob);

module.exports = router;