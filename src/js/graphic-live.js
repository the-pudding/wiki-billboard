/* global d3 */
import * as noUiSlider from 'nouislider';
const DAYS_TO_START = 31;
const NUM_PEOPLE = 10;

let cleanedData = [];
let nestedData = [];
let currentDay = 0;
let personHeight = 0;
let timer = null;
let autoplay = true;

const $section = d3.select('#live');
const $dayCounter = $section.select('div.live__date-counter');
const $rankList = $section.select('ul.live__ranking');
const $sliderNode = d3.select('.live__slider').node();

function handleSlide(value) {

	const [index] = value;

	if (+index < nestedData.length - 1) {
		currentDay = +index;
		console.log(currentDay)
		updateChart(true);
		autoplay = false;
	} else {
		// change style of slider to show it's disabled
		// keep slider updating to 
	}


}

function setupSlider() {

	const min = 0;
	const max = 364;
	const start = currentDay



	noUiSlider
		.create($sliderNode, {
			start,
			step: 1,
			tooltips: [{
				to: value => {
					const data = nestedData[Math.round(value)];
					return data.dateDisplay;
				}
			}],
			range: {
				min,
				max
			}
		})
		.on('slide', handleSlide);
}


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
		date: parseDate(person.date),
	}));
}

function loadData() {
	return new Promise((resolve, reject) => {
		const timeStamped = Date.now()
		const dataURL =
			`https://pudding.cool/2018/08/wiki-billboard-data/web/2018-top--appearance.csv?version=${timeStamped}`;

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
						dateDisplay: (parseDate(d.key)).toString().substring(0, 10)
					}));
				currentDay = nestedData.length - DAYS_TO_START;

				resolve();
			}
		});
	});
}

function finishTransition() {

	timer = d3.timeout(() => {

		if (autoplay && currentDay < nestedData.length - 2) {
			currentDay += 1;
			$sliderNode.noUiSlider.set(currentDay)
			updateChart();
		}
	}, 3000)
}


function updateChart(skip) {

	const data = nestedData[currentDay];

	$dayCounter.text(data.dateDisplay);

	// Select pre-existing items

	const $li = $rankList
		.selectAll('li.person')
		.data(data.values, d => d.article);



	const mergeTransition = ($enteredLi) => {

		const $mergedLi = $enteredLi.merge($li);

		let mergedDone = false;

		$mergedLi
			.text(d => `${d.rank_people + 1}. ${d.name}`)
			.transition()
			.duration(skip ? 0 : 500) // TODO
			.st('top', d => d.rank_people * personHeight)
			.st('left', '50%')
			.on('end', () => {
				if (!mergedDone) finishTransition()
				mergedDone = true;
			})

	}

	const enterTransition = () => {

		const $enteredLi = $li
			.enter()
			.append('li.person')

		$enteredLi
			.st('left', '100%')
			.st('top', d => d.rank_people * personHeight)

		mergeTransition($enteredLi)


	}

	const updateTransition = () => {

		let updateCount = 0;

		const updateSize = $li.size();

		if (updateSize === 0) {
			enterTransition()
		} else {
			$li
				.transition()
				.delay((d, i) => skip ? 0 : d.rank_people * 200)
				.duration(skip ? 0 : 500)
				.st('top', d => d.rank_people * personHeight)
				.on('end', () => {
					updateCount += 1
					if (updateCount === updateSize) enterTransition()
				});
		}

	}

	const exitTransition = () => {

		let exitDone = false;

		const $liExit = $li
			.exit()

		if ($liExit.size() === 0) {
			updateTransition()
		} else {
			$liExit
				.transition()
				.duration(skip ? 0 : 1000) // TODO
				.ease(d3.easeCubicInOut)
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

function setupTimer() {
	timer = d3.timer((elapsed) => {
		console.log(elapsed)
	})
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
			setupSlider()
			// setupTimer()
			// TODO update using d3 timer
			// setInterval(() => {		
			// }, 5000);
		})
		.catch(console.log);
}

export default {
	init,
	resize
};