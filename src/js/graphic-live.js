let cleanedData;
let nestedData;
let currentDay;

const $section = d3.select('#live')
const $rankList = $section.select('ul.live__ranking')

function parseDate(date) {
	const dates = date.split('-')
		.map(d => +d);

	return new Date(dates[0], dates[1] - 1, dates[2])
}

function cleanData(data) {
	return data.map(person => ({
		article: person.article,
		rank_people: +person.rank_people,
		views: +person.views,
		dateString: person.date,
		date: parseDate(person.date)
	}))
}


function loadData() {
	return new Promise((resolve, reject) => {
		const dataURL = 'https://pudding.cool/2018/08/wiki-billboard-data/web/2018-top--appearance.csv'

		d3.loadData(dataURL, (error, response) => {
			if (error) reject(error);
			else {
				cleanedData = cleanData(response[0])

				nestedData = d3.nest()
					.key(d => d.dateString)
					.entries(cleanedData)
					.map(d => ({
						...d,
						date: parseDate(d.key)
					}))
				currentDay = nestedData.length - 31;

				resolve()
			}
		})
	})
}




function updateChart() {
	const data = nestedData[currentDay]

	const $li = $rankList
		.selectAll('li.person')
		.data(data.values, d => d.article)

	$li
		.st('color', 'pink')

	// First step: enter new items

	const $enteredLi = $li
		.enter()
		.append('li.person')
		.text(d => d.article)


	// Second step: exit old items

	$li.exit()
		.transition()
		.st('opacity', 0)
		.remove()

	// Third step: update pre-existing items


	// Fourth step: update all current items

	const $mergedLi = $enteredLi
		.merge($li)

	$mergedLi
		.transition()
		.st('top', d => d.rank_people * 20)


}

function resize() {}

function init() {

	loadData()
		.then(() => {
			updateChart();
			setInterval(() => {
				currentDay += 1
				updateChart()
			}, 2000)
		})
		.catch(console.log)
}

export default {
	init,
	resize
}