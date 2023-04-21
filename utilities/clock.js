let startTimestamp = null;

function startClock() {
	startTimestamp = Date.now();
}

function getUptime() {
	return Math.floor((Date.now() - startTimestamp) / 1000);
}

function formatTime(seconds) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;
	const pad = (num) => String(num).padStart(2, '0');
	return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
}

module.exports = {
	startClock,
	getUptime,
	formatTime,
};