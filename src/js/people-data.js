const dictionary = {
	'sports': ['basketball', 'football', 'soccer']
}

function lookup(description) {

	const tokens = description
		.toLowerCase()
		.replace(/[^a-z]/g, ' ')
		.split(' ');

	let match = false;
	let currentToken = 0;

	const keys = Object.keys(dictionary);

	while (!match && currentToken < tokens.length) {
		match = keys.find(key => dictionary[key].includes(tokens[currentToken]));
		if (match) console.log('match ' + match)

		currentToken += 1
	}

	return match

	// const occupation = tokens.find(token => {
	// 	const keys = Object.keys(dictionary);

	// 	
	// 	return ;
	// })

	// return occupation;
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