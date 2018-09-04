import loadImage from './utils/load-image';

let loading = false;
const cache = new Map();
const queue = [];

function advanceQueue() {
	const url = queue.shift();
	loading = true;
	loadImage(url, () => {
		cache.set(url, true);
		if (queue.length) advanceQueue();
		else loading = false;
	});
}

function preloadImage(url) {
	if (!cache.has(url)) {
		queue.push(url);
		if (!loading) advanceQueue();
	}
}

export default preloadImage;
