import nGram from 'n-gram';
import dictionary from './people-dictionary.json';

function lookup(description) {
	const tokens = description
		.toLowerCase()
		.replace(/[^a-z]/g, ' ')
		.split(' ');

	const biGrams = nGram.bigram(tokens);

	let match = false;
	let currentToken = 0;
	let currentBiGram = 0;

	const keys = Object.keys(dictionary);

	while (!match && currentBiGram < biGrams.length) {
		match = keys.find(key => {
			const [a, b] = biGrams[currentBiGram];
			return dictionary[key].includes(`${a} ${b}`);
		});
		currentBiGram += 1;
	}
	while (!match && currentToken < tokens.length) {
		match = keys.find(key => dictionary[key].includes(tokens[currentToken]));

		currentToken += 1;
	}

	if (!match) console.log('missing description:', description);
	return match;
}

function addOccupation(data) {
	return data.map(person => ({
		...person,
		occupation: lookup(person.description)
	}));
}

function init() {
	return new Promise((resolve, reject) => {
		const timeStamped = Date.now();
		const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-people.csv?version=${timeStamped}`;

		d3.loadData(dataURL, (error, response) => {
			if (error) reject(error);
			else resolve(addOccupation(response[0]));
		});
	});
}

export default init;
