/* global d3 */
import * as noUiSlider from 'nouislider';
import truncate from './utils/truncate';
import colors from './colors.json';

const DAYS_TO_START = 31;
const NUM_PEOPLE = 10;

let cleanedData = [];
let nestedData = [];
let peopleData = [];
let currentDay = 0;
let personHeight = 0;
let timer = null;
let autoplay = true;
let speedIndex = 0;
let isSliding = false;

const SPEEDS = [8000, 4000, 2000];
const RATES = [1, 0.5, 0.25];
const EDIT_SVG = '<polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>';

const $section = d3.select('#live');
const $dayCounter = $section.select('div.live__date-counter');
const $rankList = $section.select('ul.live__ranking');
const $sliderNode = $section.select('.live__slider').node();
const $nav = $section.select('nav');
const $autoplayButton = $nav.select('.btn--autoplay');
const $speedButton = $nav.selectAll('.btn--speed');

function getEditURL(d) {
	const base =
		'https://docs.google.com/forms/d/e/1FAIpQLSc_YJ5RxWSOuHnljC-0_igiaq_1HQs0NVM5I40AgXBjMI_vxA/viewform?usp=pp_url';
	console.log(d.dateString);
	return `${base}&entry.40479591=${d.article}&entry.789803485=${d.dateString}`;
}

function zeroPad(number) {
	return d3.format('02')(number);
}

function handleSpeedToggle() {
	speedIndex = +$speedButton.text().replace('x', '') - 1;
	speedIndex += 1;
	if (speedIndex >= SPEEDS.length) speedIndex = 0;

	$speedButton.text(`${speedIndex + 1}x`);
	advanceChart();
}

function handleAutoplayToggle() {
	autoplay = !autoplay;
	$autoplayButton
		.text(autoplay ? 'Pause' : 'Play')
		.at('alt', autoplay ? 'Pause animation' : 'Play animation');

	if (autoplay) advanceChart();
	else if (timer) timer.stop();
}

function setupNav() {
	$autoplayButton.on('click', handleAutoplayToggle);
	$speedButton.on('click', handleSpeedToggle);
}

function handleEnd() {
	isSliding = false;
}

function handleSlide(value) {
	isSliding = true;
	const [index] = value;

	if (+index < nestedData.length - 1) {
		currentDay = +index;
		updateChart(true);
	}
}

function setupSlider() {
	const min = 0;
	const max = nestedData.length - 1;
	const start = currentDay;

	const slider = noUiSlider.create($sliderNode, {
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
					if (data.key.endsWith('01')) return data.dateDisplay.substring(4, 7);
				}
			}
		},
		tooltips: [
			{
				to: value => {
					const data = nestedData[Math.round(value)];
					return data.dateDisplay.slice(4);
				}
			}
		],
		range: {
			min,
			max
		}
	});

	slider.on('slide', handleSlide);
	slider.on('end', handleEnd);
}

function parseDate(date) {
	const dates = date.split('-').map(d => +d);
	return new Date(dates[0], dates[1] - 1, dates[2]);
}

function nestData() {
	return d3
		.nest()
		.key(d => d.dateString)
		.entries(cleanedData)
		.map(d => ({
			...d,
			dateDisplay: parseDate(d.key)
				.toString()
				.substring(0, 10)
		}));
}

function getColor(article) {
	const match = peopleData.find(p => p.article === article);
	return match ? colors[match.category] : null;
}

function getThumbnail(article) {
	const match = peopleData.find(p => p.article === article);
	return match ? match.thumbnail_source : null;
}

function cleanData(data) {
	return data.map(person => ({
		article: person.article,
		name: truncate({
			text: person.article.replace(/_/g, ' '),
			chars: 22,
			ellipses: true
		}),
		color: getColor(person.article),
		thumbnail: getThumbnail(person.article),
		rank_people: +person.rank_people,
		views: +person.views,
		dateString: person.date,
		date: parseDate(person.date),
		annotation: person.annotation
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
				nestedData = nestData();

				currentDay = nestedData.length - DAYS_TO_START;

				resolve();
			}
		});
	});
}

function updateChart(skip) {
	const data = nestedData[currentDay];

	$dayCounter.text(data.dateDisplay);

	const rate = RATES[speedIndex];

	// update data join
	const $li = $rankList
		.selectAll('li.person')
		.data(data.values, d => d.article);

	// exit
	const $liExit = $li.exit();

	$liExit
		.classed('is-exit', true)
		.transition()
		.duration(skip ? 0 : 1000 * rate)
		.ease(d3.easeCubicInOut)
		.st('left', '0%')
		.st('opacity', 0)
		.remove();

	// update
	const updateDelay = 250 * rate;
	$li
		.classed('is-update', true)
		.transition()
		.delay(d => (skip ? 0 : 500 + d.rank_people * updateDelay * rate))
		.duration(skip ? 0 : 1000 * rate)
		.st('top', d => d.rank_people * personHeight);

	// enter
	const $liEnter = $li.enter().append('li.person');

	$liEnter
		.append('span.thumbnail')
		.st('background-image', d => `url(${d.thumbnail})`);
	$liEnter.append('span.rank').text(d => zeroPad(d.rank_people + 1));
	$liEnter.append('span.name').text(d => d.name);
	$liEnter.append('span.annotation');

	const $editEnter = $liEnter.append('a.edit').at('target', '_blank');

	$editEnter
		.append('svg')
		.at('width', 24)
		.at('height', 24)
		.at('viewBox', '0 0 24 24')
		.html(EDIT_SVG);

	$liEnter
		.classed('is-enter', true)
		.st('background-color', d => d.color || '#efefef')
		.st('opacity', 0)
		.st('left', '100%')
		.st('top', d => d.rank_people * personHeight);

	// merge
	const $liMerge = $liEnter.merge($li);

	const mergeDelay = (500 + $li.size() * updateDelay) * rate;

	$liMerge
		.classed('is-merge', true)
		.transition()
		.delay(
			d => (skip ? 0 : (mergeDelay + (d.rank_people * updateDelay) / 2) * rate)
		)
		.duration(skip ? 0 : 1000 * rate)
		.st('top', d => d.rank_people * personHeight)
		.st('opacity', 1)
		.st('left', '50%');

	$liMerge
		.select('.rank')
		.transition()
		.delay(
			d => (skip ? 0 : (mergeDelay + (d.rank_people * updateDelay) / 2) * rate)
		)
		.duration(skip ? 0 : 1000 * rate)
		.text(d => zeroPad(d.rank_people + 1));

	$liMerge
		.select('.annotation')
		.transition()
		.delay(
			d => (skip ? 0 : (mergeDelay + (d.rank_people * updateDelay) / 2) * rate)
		)
		.duration(skip ? 0 : 1000 * rate)
		.text(d => d.annotation || '');

	$liMerge.select('.edit').at('href', getEditURL);
}

function advanceChart() {
	if (timer) timer.stop();
	timer = d3.timeout(advanceChart, SPEEDS[speedIndex]);
	if (autoplay && !isSliding && currentDay < nestedData.length - 2) {
		currentDay += 1;
		$sliderNode.noUiSlider.set(currentDay);
		updateChart(false);
	}
}

function resize() {
	// update height of ul
	personHeight = 48;
	const height = NUM_PEOPLE * personHeight;
	$rankList.st({
		height
	});
}

function init(people) {
	peopleData = people;
	resize();
	loadData()
		.then(() => {
			setupNav();
			updateChart();
			setupSlider();
			timer = d3.timeout(advanceChart, SPEEDS[speedIndex]);
		})
		.catch(console.log);
}

export default {
	init,
	resize
};
