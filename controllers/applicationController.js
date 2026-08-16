const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');

// @desc    Apply for a job
// @route   POST /api/applications
exports.applyToJob = async (req, res) => {
    try {
        const { jobId, resumeUrl } = req.body;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const alreadyApplied = await Application.findOne({ jobId, candidateId: req.user.id });
        if (alreadyApplied) {
            return res.status(400).json({ message: 'You have already applied for this job' });
        }

        const application = await Application.create({
            jobId,
            candidateId: req.user.id, 
            resumeUrl
        });

        res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all applications for logged-in candidate
// @route   GET /api/applications/my-applications
exports.getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ candidateId: req.user.id }).populate('jobId', 'title company location');
        res.status(200).json(applications);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get recruiter dashboard metrics and applications
// @route   GET /api/applications/recruiter/dashboard
exports.getRecruiterDashboard = async (req, res) => {
    try {
        const recruiterJobs = await Job.find({ postedBy: req.user.id }).select('_id title company location');
        const jobIds = recruiterJobs.map(job => job._id);

        const applications = await Application.find({ jobId: { $in: jobIds } })
            .populate('candidateId', 'name email resume')
            .populate('jobId', 'title company')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            totalJobs: recruiterJobs.length,
            totalApplications: applications.length,
            applications
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update application status (e.g. accepted, rejected)
// @route   PATCH /api/applications/:id/status
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        const application = await Application.findById(id).populate('jobId');
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // التحقق من ملكية الـ Recruiter للوظيفة
        if (application.jobId.postedBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this application' });
        }

        application.status = status;
        await application.save();

        res.status(200).json({
            success: true,
            message: `Application status updated to ${status}`,
            application
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};