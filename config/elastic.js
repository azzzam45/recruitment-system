const { Client } = require('@elastic/elasticsearch');

const esClient = new Client({
    node: process.env.ELASTICSEARCH_NODE || 'http://elasticsearch:9200',
    enableProductCheck: false
});

const checkElasticConnection = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const health = await esClient.cluster.health({});
            console.log(' Elasticsearch Connected Successfully. Cluster status:', health.status);
            return true;
        } catch (error) {
            console.error(` Elasticsearch connection attempt ${i + 1}/${retries} failed: ${error.message}`);
            if (i < retries - 1) {
                console.log(` Retrying connection in ${delay / 1000} seconds...`);
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
    console.error(' Could not connect to Elasticsearch after multiple attempts.');
    return false;
};

module.exports = { esClient, checkElasticConnection };