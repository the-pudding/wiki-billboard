/* global d3 */
const DAYS_TO_START = 31;
const NUM_PEOPLE = 10;

let cleanedData = [];
let nestedData = [];
let currentDay = 0;
let personHeight = 0;

const $section = d3.select('#live');
const $dayCounter = $section.select('div.live__date-counter');
const $rankList = $section.select('ul.live__ranking');

function parseDate(date) {
	const dates = date.split('-').map(d => +d);

	return new Date(dates[0], dates[1] - 1, dates[2]);
}

function cleanData(data) {
	return data.map(person => ({
		article: person.article,
		name: person.article.replace(/_/g, ' '),
		rank_people: +person.rank_people,
		views: +person.views,
		dateString: person.date,
		date: parseDate(person.date)
	}));
}

function loadData() {
	return new Promise((resolve, reject) => {
		const dataURL =
			'https://pudding.cool/2018/08/wiki-billboard-data/web/2018-top--appearance.csv';

		d3.loadData(dataURL, (error, response) => {
			if (error) reject(error);
			else {
				cleanedData = cleanData(response[0]);

				nestedData = d3
					.nest()
					.key(d => d.dateString)
					.entries(cleanedData)
					.map(d => ({
						...d,
						date: parseDate(d.key)
					}));
				currentDay = nestedData.length - DAYS_TO_START;

				resolve();
			}
		});
	});
}

function updateChart() {

	const data = nestedData[currentDay];
	const dateForCounter = data.date.toString().substring(0, 16);

	$dayCounter.text(dateForCounter);

	// Select pre-existing items

	const $li = $rankList
		.selectAll('li.person')
		.data(data.values, d => d.article);



	const mergeTransition = ($enteredLi) => {

		console.log('merge transition')
		const $mergedLi = $enteredLi.merge($li);

		$mergedLi
			.text(d => `${d.rank_people + 1}. ${d.name}`)
			.transition()
			.duration(500) // TODO
			.st('top', d => d.rank_people * personHeight)
			.st('left', '50%');

	}

	const enterTransition = () => {
		console.log('enter transition')

		const $enteredLi = $li
			.enter()
			.append('li.person')

		$enteredLi
			.st('left', '100%')
			.st('top', d => d.rank_people * personHeight)

		mergeTransition($enteredLi)


	}

	const updateTransition = () => {

		console.log('update transition')
		let updateDone = false;

		if ($li.size() === 0) {
			enterTransition()
		} else {
			$li
				.transition()
				.delay(200) // TODO
				.st('top', d => d.rank_people * personHeight)
				.on('end', () => {
					if (!updateDone) enterTransition()
					updateDone = true;
				});
		}

	}

	const exitTransition = () => {

		console.log('exit transition')
		let exitDone = false;

		const $liExit = $li
			.exit()

		if ($liExit.size() === 0) {
			updateTransition()
		} else {
			$liExit
				.transition()
				.duration(500) // TODO
				.st('left', '0%') // TODO
				.st('opacity', 0)
				.on('end', () => {
					if (!exitDone) updateTransition()
					exitDone = true;
				})
				.remove();
		}
	}



	exitTransition()





	// Updating current items






	// Update all current items

}

function resize() {
	// update height of ul
	personHeight = 20;
	const height = NUM_PEOPLE * personHeight;
	$rankList.st({
		height
	});
}

function init() {
	resize();
	loadData()
		.then(() => {
			updateChart();
			// TODO update using d3 timer
			setInterval(() => {
				if (currentDay < nestedData.length - 1) {
					currentDay += 1;
					updateChart();
				} else {
					clearInterval();
				}
			}, 3000);
		})
		.catch(console.log);
}

export default {
	init,
	resize
};