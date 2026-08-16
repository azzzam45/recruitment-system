const express = require('express');
const router = express.Router();
const { 
    applyToJob, 
    getMyApplications, 
    getRecruiterDashboard, 
    updateApplicationStatus 
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', protect, authorize('candidate'), applyToJob);
router.get('/my-applications', protect, authorize('candidate'), getMyApplications);

router.get('/recruiter/dashboard', protect, authorize('recruiter', 'admin'), getRecruiterDashboard);
router.patch('/:id/status', protect, authorize('recruiter', 'admin'), updateApplicationStatus);

module.exports = router;