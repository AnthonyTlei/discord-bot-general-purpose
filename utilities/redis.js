const Redis = require('ioredis');
const cacheExp = 3600 * 24;
let client = null;

const initializeRedis = () => {
	client = new Redis({ host: 'localhost', port: 6379 });
	client.on('connect', () => {
		console.log('\nConnected to Redis\n');
	});

	client.on('error', (err) => {
		console.error('Error connecting to Redis:', err);
	});
};

const clientGetAsync = async (key) => {
	return await client.get(key);
};

const clientSetAsync = async (key, value, expiration) => {
	await client.set(key, value, 'EX', expiration);
};

async function clearCache() {
	try {
		await client.flushdb();
		console.log('Cache cleared.');
	}
	catch (error) {
		console.error('Error clearing cache:', error);
	}
}

async function printCurrentCache() {
	try {
		let cursor = '0';
		const keys = [];

		do {
			const response = await client.scan(cursor, 'MATCH', '*');
			cursor = response[0];
			keys.push(...response[1]);
		} while (cursor !== '0');

		if (keys.length === 0) {
			console.log('Cache is empty.');
			return;
		}
		console.log('Current cache:');
		for (const key of keys) {
			const value = await client.get(key);
			console.log(`${key}: ${value}`);
		}
	}
	catch (error) {
		console.error('Error printing current cache:', error);
	}
}

module.exports = {
	get: clientGetAsync,
	set: clientSetAsync,
	printCurrentCache,
	cacheExp,
	initializeRedis,
	clearCache,
};
