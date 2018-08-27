let cleanedData = []
let nestedData = []

const $section = d3.select('#tally')
const $tallyEstablished = $section.select('.tally__established')
const $figure = $tallyEstablished.select('figure')
const $svg = $figure.select('svg')
const $gAxes = $svg.select('.g-axes')
const $gViz = $svg.select('.g-viz')

const scaleX = d3.scaleTime();
const scaleY = d3.scaleLinear();


function parseDate(date) {
	const dates = date.split('-').map(d => +d);
	return new Date(dates[0], dates[1] - 1, dates[2]);
}

function cleanTheData(data) {
	return data.map(person => ({
		article: person.article,
		name: person.article.replace(/_/g, ' '),
		rank_people: +person.rank_people,
		views: +person.views,
		score: +person.score,
		dateString: person.date,
		// score_sum: +person.score_sum,
		views_sum: +person.views_sum,
		date: parseDate(person.date)
	}));
}

function loadData() {
	return new Promise((resolve, reject) => {
		const timeStamped = Date.now()
		// const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-tally--score.csv?version=${timeStamped}`
		const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-tally--views.csv?version=${timeStamped}`

		d3.loadData(dataURL, (error, response) => {

			if (error) reject(error)
			else {
				cleanedData = cleanTheData(response[0])

				console.log(response[0])

				nestedData = d3
					.nest()
					.key(d => d.name)
					.entries(cleanedData);

				resolve()
			}
		})
	})
}

// function getMaxSum(data) {
// const maxes = data.map(person => d3.sum(person.values, v => v.score))
// return d3.max(maxes)
// }

function setupChart() {
	// bind data to dom elements
	const $person = $gViz
		.selectAll('g.person')
		.data(nestedData)

	// create elements
	const $personEnter = $person
		.enter()
		.append('g.person')

	$personEnter
		.append('path')

	$personEnter
		.append('text')
		.text(d => d.key)
		.at('x', 0)
		.at('y', 0)

	// setup scales
	scaleX
		.domain(d3.extent(cleanedData, d => d.date))

	scaleY
		.domain([0, d3.max(cleanedData, d => d.views_sum)])

	console.log(scaleY
		.domain())

}


function render() {

	const line = d3.line()
		.x(d => scaleX(d.date))
		.y(d => scaleY(d.views_sum))

	$gViz
		.selectAll('.person path')
		.datum(d => d.values)
		.at('d', line)
}

function resize() {
	// Grab width
	const width = $figure
		.node()
		.offsetWidth

	const height = window
		.innerHeight

	// update range
	scaleX
		.range([0, width])

	scaleY
		.range([height, 0])

	$svg
		.at('width', width)
		.at('height', height)

	render()
}

function init() {
	loadData()
		.then(() => {
			setupChart()
			resize()
		})
		.catch(console.log)
}


export default {
	init,
	resize
};