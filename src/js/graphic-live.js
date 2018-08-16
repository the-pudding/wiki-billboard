/* global d3 */

let cleanedData;
let nestedData;
let currentDay;

const $section = d3.select('#live')
const $dayCounter = $section.select('div.live__date-counter')
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
	const dateForCounter = data.values[0]['date'].toDateString().split(' ')

	$dayCounter.text(dateForCounter[0] + ' ' + dateForCounter[1] + ' ' + dateForCounter[2] + ' ' + dateForCounter[3])

	// Select pre-existing items

	const $li = $rankList
		.selectAll('li.person')
		.data(data.values, d => d.article)

	$li
		.transition()
		.delay(200)
		.st('top', d => d.rank_people * 20)


	// Enter new items

	const $enteredLi = $li
		.enter()
		.append('li.person')
		.st('right', (-2000))
		.text(d => (d.rank_people + 1) + ' ' + d.article.replace(/_/g, ' '))


	// Exit old items

	$li.exit()
		.transition()
		.duration(500)
		.st('top', 1000)
		.st('opacity', 0)
		.remove()

	// Fourth step: update all current items

	const $mergedLi = $enteredLi
		.merge($li)

	$mergedLi
		.transition()
		.duration(500)
		.st('top', d => d.rank_people * 20)
		.text(d => (d.rank_people + 1) + '. ' + d.article.replace(/_/g, ' '))
		.st('right', )
}

function resize() {}

function init() {

	loadData()
		.then(() => {
			updateChart();
			setInterval(() => {
				if (currentDay < nestedData.length - 1) {
					currentDay += 1
					updateChart()
				} else {
					clearInterval()
				}
			}, 3000)
		})
		.catch(console.log)
}

export default {
	init,
	resize
}