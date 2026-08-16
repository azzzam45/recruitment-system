const redisClient = require('../config/redis');

const rateLimiter = async (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'];
    const key = `rate-limit:${ip}`;
    
    const LIMIT = 100; 
    const WINDOW_SECONDS = 60; 

    try {
        const requests = await redisClient.get(key);

        if (requests) {
            const currentRequests = parseInt(requests, 10);

            if (currentRequests >= LIMIT) {
                console.log(` Rate limit exceeded for IP: ${ip}`);
                return res.status(429).json({
                    message: 'Too many requests, please try again after a minute.'
                });
            }

            await redisClient.incr(key);
            console.log(`  Request count for ${ip}: ${currentRequests + 1}/${LIMIT}`);
        } else {
            await redisClient.setEx(key, WINDOW_SECONDS, '1');
            console.log(` First request from IP: ${ip}. Starting rate limit window.`);
        }

        next(); 
    } catch (error) {
        console.error('Rate Limiter Error:', error);
        next(); 
    }
};

module.exports = rateLimiter;