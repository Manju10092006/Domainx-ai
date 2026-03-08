const amqp = require('amqplib');

let channel = null;
let connection = null;

const connectRabbitMQ = async () => {
    try {
        const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
        connection = await amqp.connect(RABBITMQ_URL);

        console.log('RabbitMQ Connected');

        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            console.log('RabbitMQ connection closed');
        });

        return connection;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        throw error;
    }
};

const createChannel = async () => {
    try {
        if (!connection) {
            await connectRabbitMQ();
        }

        channel = await connection.createChannel();
        console.log('RabbitMQ Channel created');

        return channel;
    } catch (error) {
        console.error('Failed to create RabbitMQ channel:', error);
        throw error;
    }
};

const getChannel = () => {
    return channel;
};

const publishToQueue = async (queueName, message) => {
    try {
        if (!channel) {
            await createChannel();
        }

        // Ensure queue exists
        await channel.assertQueue(queueName, { durable: true });

        // Convert message to JSON buffer
        const messageBuffer = Buffer.from(JSON.stringify(message));

        // Publish message
        const sent = channel.sendToQueue(queueName, messageBuffer, {
            persistent: true,
        });

        if (sent) {
            console.log(`Message published to queue: ${queueName}`);
            return true;
        } else {
            console.error('Failed to publish message - channel buffer full');
            return false;
        }
    } catch (error) {
        console.error('Error publishing to queue:', error);
        throw error;
    }
};

const closeConnection = async () => {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        console.log('RabbitMQ connection closed gracefully');
    } catch (error) {
        console.error('Error closing RabbitMQ connection:', error);
    }
};

module.exports = {
    connectRabbitMQ,
    createChannel,
    getChannel,
    publishToQueue,
    closeConnection,
};
