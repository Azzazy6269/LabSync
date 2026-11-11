const redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 10000, 
    keepAlive: 10000, 
    retryStrategy: (times) => {
        const delay = Math.min(times * 200, 3000);
        return delay;
    }
};

module.exports = redisConnection;