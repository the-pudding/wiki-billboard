import nGram from 'n-gram';
import dictionary from './people-dictionary.json';
import categories from './people-categories.json';
import truncate from './utils/truncate';

function lookupOccupation(description) {
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

function lookupCategory(occupation) {
	const keys = Object.keys(categories);
	const match = keys.find(key => categories[key].includes(occupation));
	return match || 'misc';
}

function addOccupation(data) {
	return data.map(person => {
		const occupation = lookupOccupation(person.description);
		const category = lookupCategory(occupation);
		return {
			...person,
			id: person.article.replace(/([^a-zA-Z])/g, ''),
			occupation,
			category
		};
	});
}

function cleanDisplay(str) {
	const t = truncate({
		text: str,
		chars: 20,
		clean: false,
		ellipses: true
	});
	const i = t.indexOf('(');
	if (i > -1) return t.substring(0, i);
	return t;
}

function cleanDescription(str) {
	return truncate({
		text: str,
		chars: 40,
		ellipses: true,
		clean: true
	});
}

function cleanData(data) {
	return data.map(d => ({
		...d,
		display: cleanDisplay(d.display),
		description: cleanDescription(d.description)
	}));
}
function init() {
	return new Promise((resolve, reject) => {
		const timeStamped = Date.now();
		const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-people.csv?version=${timeStamped}`;

		d3.loadData(dataURL, (error, response) => {
			if (error) reject(error);
			else {
				const withOccupation = addOccupation(response[0]);
				const clean = cleanData(withOccupation);
				resolve(clean);
			}
		});
	});
}

export default init;
