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
let transitionDuration = 4000;

const $section = d3.select('#live');
const $dayCounter = $section.select('div.live__date-counter');
const $rankList = $section.select('ul.live__ranking');
const $sliderNode = $section.select('.live__slider').node();
const $nav = $section.select('nav');
const $autoplayButton = $nav.select('.autoplay__toggle');
const $speedButtons = $nav.selectAll('.speed button');
const $fastButton = $nav.select('.speed__fast');
const $slowButton = $nav.select('.speed__slow');

function handleSpeedToggle() {
	const $btn = d3.select(this);
	transitionDuration = +$btn.at('data-speed');
	$speedButtons.classed('is-selected', false);
	$btn.classed('is-selected', true);
}

function handleAutoplayToggle() {
	// console.log('play button pushed');
	autoplay = !autoplay;
	$autoplayButton
		.text(autoplay ? 'Pause' : 'Play')
		.at('alt', autoplay ? 'Pause animation' : 'Play animation');
	advanceChart();
}

function setupNav() {
	$autoplayButton.on('click', handleAutoplayToggle);
	$fastButton.on('click', handleSpeedToggle);
	$slowButton.on('click', handleSpeedToggle);
}

function handleSlide(value) {
	const [index] = value;

	// console.log(`slide pre-increment ${currentDay}`);
	if (+index < nestedData.length - 1) {
		currentDay = +index;
		// console.log(`slide post-increment ${currentDay}`);
		updateChart(true);
		autoplay = false;
		$autoplayButton.text('Play').at('alt', 'Play animation');
	} else {
		// change style of slider to show it's disabled
		// keep slider updating without updating data
	}
}

function setupSlider() {
	const min = 0;
	const max = nestedData.length - 1;
	const start = currentDay;

	noUiSlider
		.create($sliderNode, {
			start,
			step: 1,
			pips: {
				filter: value => {
					const data = nestedData[Math.round(value)];
					return data.key.endsWith('01') ? 1 : 0;
				},
				mode: 'steps',
				format: {
					to: value => {
						const data = nestedData[Math.round(value)];
						if (data.key.endsWith('01'))
							return data.dateDisplay.substring(4, 7);
					}
				}
			},
			tooltips: [
				{
					to: value => {
						const data = nestedData[Math.round(value)];
						return data.dateDisplay;
					}
				}
			],
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
		date: parseDate(person.date)
	}));
}

function loadData() {
	return new Promise((resolve, reject) => {
		const timeStamped = Date.now();
		const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-top--appearance.csv?version=${timeStamped}`;

		d3.loadData(dataURL, (error, response) => {
			if (error) reject(error);
			else {
				cleanedData = cleanData(response[0]);

				// console.log(`cleandata: ${  cleanedData}`);
				// console.log(`nesteddata: ${nestedData}`);

				nestedData = d3
					.nest()
					.key(d => d.dateString)
					.entries(cleanedData)
					.map(d => ({
						...d,
						dateDisplay: parseDate(d.key)
							.toString()
							.substring(0, 10)
					}));
				currentDay = nestedData.length - DAYS_TO_START;

				// console.log(nestedData);

				resolve();
			}
		});
	});
}

function advanceChart() {
	if (autoplay && currentDay < nestedData.length - 2) {
		// console.log(`advance chart fires, day ${currentDay}`);
		currentDay += 1;
		$sliderNode.noUiSlider.set(currentDay);
		updateChart(false);
	}
}

function finishTransition() {
	// console.log('finish transition fires');
	timer = d3.timeout(advanceChart, transitionDuration);
}

function updateChart(skip) {
	// console.log('chart updating');
	const data = nestedData[currentDay];

	$dayCounter.text(data.dateDisplay);

	// unfinished business
	$rankList.selectAll('.is-exit').remove();

	$rankList
		.selectAll('.is-merge')
		.st('top', d => d.rank_people * personHeight)
		.st('opacity', 1)
		.st('left', '50%')
		.classed('is-merge', false);

	// update data join
	const $li = $rankList
		.selectAll('li.person')
		.data(data.values, d => d.article);

	// exit
	const $liExit = $li.exit();

	$liExit
		.classed('is-exit', true)
		.transition()
		.duration(1000)
		.ease(d3.easeCubicInOut)
		.st('left', '0%')
		.st('opacity', 0)
		.remove();

	// update
	$li
		// .classed('is-update', true)
		.transition()
		.delay(d => 1000 + d.rank_people * 200)
		.duration(1000)
		.st('top', d => d.rank_people * personHeight);

	// enter
	const $liEnter = $li.enter().append('li.person');

	$liEnter
		.classed('is-enter', true)
		.st('opacity', 0)
		.st('left', '100%')
		.st('top', d => d.rank_people * personHeight);

	// merge
	const $liMerge = $liEnter.merge($li);

	$liMerge
		.transition()
		.delay(2000)
		.duration(1000)
		.text(d => `${d.rank_people + 1}. ${d.name}`)
		.st('top', d => d.rank_people * personHeight)
		.st('opacity', 1)
		.st('left', '50%');
}

// function updateChart(skip) {
// 	// console.log('chart updating');
// 	const data = nestedData[currentDay];

// 	$dayCounter.text(data.dateDisplay);

// 	// Select pre-existing items

// 	const $li = $rankList
// 		.selectAll('li.person')
// 		.data(data.values, d => d.article);

// 	const mergeTransition = $enteredLi => {
// 		// console.log('merged transition fires');
// 		const $mergedLi = $enteredLi.merge($li);

// 		let mergedDone = false;

// 		$mergedLi
// 			.text(d => `${d.rank_people + 1}. ${d.name}`)
// 			.transition()
// 			.duration(skip ? 0 : 500) // TODO
// 			.st('top', d => d.rank_people * personHeight)
// 			.st('left', '50%')
// 			.on('end', () => {
// 				if (!mergedDone) finishTransition();
// 				mergedDone = true;
// 			});
// 	};

// 	const enterTransition = () => {
// 		// console.log('enter transition fires');
// 		const $enteredLi = $li.enter().append('li.person');

// 		$enteredLi.st('left', '100%').st('top', d => d.rank_people * personHeight);

// 		mergeTransition($enteredLi);
// 	};

// 	const updateTransition = () => {
// 		// console.log('update transition fires');
// 		let updateCount = 0;

// 		const updateSize = $li.size();
// 		// console.log(`update size ${updateSize}`);

// 		if (updateSize === 0) {
// 			enterTransition();
// 		} else {
// 			$li
// 				.transition()
// 				.delay((d, i) => (skip ? 0 : d.rank_people * 200))
// 				.duration(skip ? 0 : 500)
// 				.st('top', d => d.rank_people * personHeight)
// 				.on('end', () => {
// 					updateCount += 1;
// 					// console.log(`update count is ${updateCount}`);
// 					// console.log(`update size is ${updateSize}`);
// 					if (updateCount === updateSize) enterTransition();
// 				});
// 		}
// 	};

// 	const exitTransition = () => {
// 		// console.log('exit transition fires');
// 		let exitDone = false;

// 		const $liExit = $li.exit();

// 		// console.log(`exit array size ${$liExit.size()}`);
// 		// console.log(`skip? ${skip}`);
// 		if ($liExit.size() === 0) {
// 			updateTransition();
// 		} else {
// 			$liExit
// 				.transition()
// 				.duration(skip ? 0 : 1000) // TODO
// 				.ease(d3.easeCubicInOut)
// 				.st('left', '0%') // TODO
// 				.st('opacity', 0)
// 				.on('end', () => {
// 					// console.log(`is exit done? ${exitDone}`);
// 					if (!exitDone) updateTransition();
// 					exitDone = true;
// 				})
// 				.remove();
// 		}
// 	};

// 	exitTransition();
// }

function resize() {
	// update height of ul
	personHeight = 32;
	const height = NUM_PEOPLE * personHeight;
	$rankList.st({
		height
	});
}

function init(dataPeople) {
	// console.log(dataPeople)
	resize();
	loadData()
		.then(() => {
			setupNav();
			updateChart();
			setupSlider();
		})
		.catch(console.log);
}

export default {
	init,
	resize
};
