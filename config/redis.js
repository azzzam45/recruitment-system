const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
});

redisClient.on('error', (err) => console.error(' Redis Client Error:', err));
redisClient.on('connect', () => console.log(' Redis Server Connected Successfully!'));

(async () => {
    await redisClient.connect();
})();

module.exports = redisClient;