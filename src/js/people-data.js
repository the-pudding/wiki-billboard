import nGram from 'n-gram'



const dictionary = {
	'music': ['conductor', 'singer', 'singer-songwriter', 'musician', 'rapper', 'trumpeter', 'record producer', 'drummer', 'composer', 'dj', 'vocalist', 'guitarist', 'music'],
	'sports': ['football', 'pole vaulter', 'athletics', 'figure skater', 'basketball', 'footballer', 'racecar', 'tennis player', 'gymnast', 'martial artist', 'wrestler', 'gymnastics', 'skier', 'cricket', 'snowboarder', 'skateboarder', 'speed skating', 'ice dancer', 'ski racer', 'skater', 'racing driver', 'golfer', 'soccer', 'cricketer', 'darts', 'athlete', 'chess', 'ice hockey', 'snooker', 'swimmer', 'boxer', 'baseball'],
	'entertainment': ['mamasita', 'model', 'comedian', 'socialite', 'game show', 'talk show', 'stunt performer', 'illusionist'],
	'artist': ['artist'],
	'internet': ['youtuber', 'social media'],
	'film/tv/theater': ['broadcaster', 'actress', 'television', 'actor', 'director', 'screenwriter', 'presenter', 'radio', 'film', 'playwright'],
	'royalty': ['king', 'queen', 'royal', 'prince', 'elizabeth ii'],
	'science': ['space', 'molecular biologist', 'mathematician', 'physicist', 'astronaut', 'physician', 'primatologist', 'flown in space'],
	'politics': ['white house', 'chief strategist', 'activist', 'civil rights', 'president', 'politician', 'prime minister', 'supreme court', 'kennedy', 'representative', 'senator', 'congressional', 'secretary', 'diplomat', 'philanthropist', 'director of', 'first lady', 'statesman', 'sultan', 'governor', 'secretary-general', 'political', 'mccain', 'soldier', 'lieutenant', 'admiral'],
	'law/crime': ['lawyer', 'attorney', 'abused child', 'serial killer', 'assassin', 'murder', 'criminal', 'assassination', 'crime boss', 'holocaust'],
	'religion': ['religious', 'evangelist', 'christian', 'pontiff', 'archbishop', 'spiritual', 'pope'],
	'business': ['businesswoman', 'entrepreneur', 'couturier', 'fashion designer', 'business', 'heiress', 'industrialist', 'businessperson', 'businessman', 'nightclub owner', 'chef', 'pawnbroker'],
	'writing': ['journalist', 'author', 'writer', 'poet', 'novelist', 'essayist']
}

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
			const [a, b] = biGrams[currentBiGram]
			return dictionary[key].includes(`${a} ${b}`)
		});
		currentBiGram += 1
	}
	while (!match && currentToken < tokens.length) {
		match = keys.find(key => dictionary[key].includes(tokens[currentToken]));

		currentToken += 1
	}

	if (!match) console.log(description)
	return match

}

function addOccupation(data) {
	return data.map(person => ({
		...person,
		occupation: lookup(person.description)
	}))
}

function init() {
	return new Promise((resolve, reject) => {

		const timeStamped = Date.now()
		const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-people.csv?version=${timeStamped}`


		d3.loadData(dataURL, (error, response) => {
			if (error) reject(error)
			else resolve(addOccupation(response[0]))
		})
	})
}

export default init