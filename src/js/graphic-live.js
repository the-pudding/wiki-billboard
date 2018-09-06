/* global d3 */
import * as noUiSlider from 'nouislider';
import truncate from './utils/truncate';
import colors from './colors.json';
import preloadImage from './preload-image';

const DAYS_TO_START = 31;
const NUM_PEOPLE = 10;
const BP = 640;
const MS_DAY = 86400000;
const AXIS_FONT_SIZE = 12;
const REM = 16;
const MARGIN = {
	top: AXIS_FONT_SIZE * 1.25,
	right: 3,
	bottom: AXIS_FONT_SIZE * 1.25,
	left: 3
};

let cleanedData = [];
let nestedData = [];
let nestedDataAll = [];
let peopleData = [];
let currentDay = 0;
let personHeight = 0;
let mobile = false;
let timer = null;
let autoplay = true;
let speedIndex = 0;
let isSliding = false;
let isBelow = false;
let svgWidth = 0;
let maxRank = 0;

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

function generateRangeOfDays({ start, end }) {
	const diff = Math.floor((end - start) / MS_DAY) + 1;
	let cur = start.getTime();
	return d3.range(diff).map(i => {
		const date = new Date(cur);
		const dateString = `${date.getFullYear()}-${zeroPad(
			date.getMonth() + 1
		)}-${zeroPad(date.getDate())}`;
		cur += MS_DAY;
		return { date, dateString };
	});
}

function darkenColor(hex) {
	const c = d3.color(hex);
	return c.darker().toString();
}

function getEditURL(d) {
	const base =
		'https://docs.google.com/forms/d/e/1FAIpQLSc_YJ5RxWSOuHnljC-0_igiaq_1HQs0NVM5I40AgXBjMI_vxA/viewform?usp=pp_url';
	return `${base}&entry.40479591=${d.article}&entry.789803485=${d.dateString}`;
}

function zeroPad(number) {
	return d3.format('02')(number);
}

function handleNameClick() {
	const $p = d3
		.select(this)
		.parent()
		.parent();

	const below = $p.classed('is-below');

	$rankList.selectAll('.person').classed('is-below', false);

	$p.classed('is-below', !below).raise();

	isBelow = !below;
	handleAutoplayToggle();
}

function handleSpeedToggle() {
	speedIndex = +$speedButton.text().replace('x', '') - 1;
	speedIndex += 1;
	if (speedIndex >= SPEEDS.length) speedIndex = 0;

	$speedButton.text(`${speedIndex + 1}x`);
	advanceChart();
}
function handleAutoplayToggle() {
	$autoplayButton
		.text(autoplay && !isBelow ? 'Pause' : 'Play')
		.at('alt', autoplay && !isBelow ? 'Pause animation' : 'Play animation');

	if (autoplay) advanceChart();
	else if (timer) timer.stop();
}

function setupNav() {
	$autoplayButton.on('click', () => {
		if (!isBelow) autoplay = !autoplay;
		else if (autoplay && isBelow) isBelow = false;
		handleAutoplayToggle();
	});
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

function preload(index) {
	if (index < nestedData.length - 1) {
		const images = nestedData[index].values.map(d => d.thumbnail);
		images.forEach(preloadImage);
	}
}

function parseDate(date) {
	const dates = date.split('-').map(d => +d);
	return new Date(dates[0], dates[1] - 1, dates[2]);
}

function nestAppearance(data) {
	return d3
		.nest()
		.key(d => d.dateString)
		.entries(data)
		.map(d => ({
			...d,
			dateDisplay: parseDate(d.key)
				.toString()
				.substring(0, 10)
		}));
}

function nestAll(data) {
	return d3
		.nest()
		.key(d => d.article)
		.entries(data);
}

function getPerson(article) {
	return peopleData.find(p => p.article === article);
}

function cleanAll(data) {
	return data.map(person => ({
		article: person.article,
		rank_people: +person.rank_people,
		dateString: person.date,
		date: parseDate(person.date)
	}));
}

function cleanAppearance(data) {
	return data.map(person => {
		const match = getPerson(person.article);
		return {
			article: person.article,
			name: truncate({
				text: person.article.replace(/_/g, ' '),
				chars: 21,
				clean: false,
				ellipses: true
			}),
			rank_people: +person.rank_people,
			views: +person.views,
			dateString: person.date,
			date: parseDate(person.date),
			annotation: person.annotation,
			color: match ? colors[match.category] : { fg: '#333', bg: '#ccc' },
			thumbnail: match ? match.thumbnail_source : null,
			description: match
				? truncate({
					text: match.description,
					chars: 35,
					ellipses: true
				  })
				: ''
		};
	});
}

function loadAllData() {
	const timeStamped = Date.now();
	const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-top--all.csv?version=${timeStamped}`;

	d3.loadData(dataURL, (error, response) => {
		if (error) console.log(error);
		else {
			const clean = cleanAll(response[0]);
			nestedDataAll = nestAll(clean);
			maxRank = d3.max(clean, d => d.rank_people);
			$rankList.selectAll('.person').each(updateTrend);
		}
	});
}

function loadAppearanceData() {
	return new Promise((resolve, reject) => {
		const timeStamped = Date.now();
		const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-top--appearance.csv?version=${timeStamped}`;

		d3.loadData(dataURL, (error, response) => {
			if (error) reject(error);
			else {
				cleanedData = cleanAppearance(response[0]);
				nestedData = nestAppearance(cleanedData);

				currentDay = nestedData.length - DAYS_TO_START;

				resolve();
			}
		});
	});
}

function lastUpdated() {
	const last = nestedData[nestedData.length - 1];
	d3.select('.intro__updated time')
		.text(last.dateDisplay)
		.at('datetime', last.key);
}

function updateTrend({ article }) {
	if (!nestedDataAll.length) return false;
	const match = nestedDataAll.find(d => d.key === article);
	if (!match) return false;

	const start = parseDate('2018-01-01');
	const end = parseDate('2018-12-31');

	const days = generateRangeOfDays({ start, end });
	const data = days.filter((d, i) => i <= currentDay).map(d => {
		const m = match.values.find(v => v.dateString === d.dateString);
		return {
			...d,
			rank_people: m ? m.rank_people : maxRank
		};
	});

	const scaleX = d3
		.scaleTime()
		.domain([start, end])
		.range([0, svgWidth - MARGIN.left - MARGIN.right]);

	const scaleY = d3
		.scaleTime()
		.domain([0, maxRank])
		.range([0, personHeight * 2 - MARGIN.top - MARGIN.bottom]);

	const line = d3
		.line()
		.curve(d3.curveMonotoneX)
		.x(d => scaleX(d.date))
		.y(d => scaleY(d.rank_people));

	const area = d3
		.area()
		.curve(d3.curveMonotoneX)
		.x(d => scaleX(d.date))
		.y0(d => scaleY(maxRank) + 1)
		.y1(d => scaleY(d.rank_people));

	const $svg = d3.select(this).select('svg.trend');

	$svg.at('width', svgWidth).at('height', personHeight * 2);

	const $gVis = $svg.select('.g-vis');
	const $gAxis = $svg.select('.g-axis');

	$gVis.at('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);
	$gAxis.at('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

	const $line = $gVis.select('path.line');
	$line.at('d', line(data));

	const $area = $gVis.select('path.area');
	$area.at('d', area(data));

	$gVis
		.select('circle')
		.at('cx', scaleX(data[currentDay].date))
		.at('cy', scaleY(data[currentDay].rank_people));

	$gAxis.select('.start').at({
		x: 0,
		y: scaleY.range()[1] + AXIS_FONT_SIZE * 1.25
	});

	$gAxis.select('.end').at({
		x: scaleX.range()[1],
		y: scaleY.range()[1] + AXIS_FONT_SIZE * 1.25
	});

	$gAxis.select('line.top-10').at({
		x1: 0,
		y1: scaleY(9) + 1,
		x2: scaleX.range()[1],
		y2: scaleY(9) + 1
	});

	$gAxis.select('text.top-10').at({
		x: scaleX.range()[1],
		y: scaleY(9) - AXIS_FONT_SIZE * 0.25
	});
}

function updateChart(skip) {
	isBelow = false;
	const data = nestedData[currentDay];

	if (!skip) d3.range(currentDay + 1, currentDay + 5).forEach(preload);

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
	const updateDelay = 250;
	$li
		.classed('is-update', true)
		.classed('is-below', false)
		.transition()
		.delay(d => (skip ? 0 : d.rank_people * updateDelay * rate))
		.duration(skip ? 0 : 1000 * rate)
		.st('top', d => d.rank_people * personHeight);

	// enter
	const $liEnter = $li.enter().append('li.person');

	$liEnter.st('background-color', d => d.color.fg);

	const $aboveEnter = $liEnter.append('div.above');
	const $belowEnter = $liEnter.append('div.below');

	$aboveEnter
		.st('background-color', d => d.color.bg)
		.st('color', d => d.color.fg);

	$aboveEnter
		.append('span.thumbnail')
		.st('background-color', d => darkenColor(d.color.bg))
		.st('background-image', d => `url(${d.thumbnail})`);
	$aboveEnter.append('span.rank').text(d => zeroPad(d.rank_people + 1));
	$aboveEnter
		.append('span.name')
		.text(d => d.name)
		.on('click', handleNameClick);
	$aboveEnter.append('span.annotation');

	const $editEnter = $aboveEnter
		.append('a.edit')
		.at('target', '_blank')
		.at('title', d => `Help us by suggesting an annotation for ${d.name}`);

	$editEnter
		.append('svg')
		.at('width', 24)
		.at('height', 24)
		.at('viewBox', '0 0 24 24')
		.html(EDIT_SVG);

	$belowEnter
		.st('background-color', d => d.color.fg)
		.st('color', d => d.color.bg);

	$belowEnter.append('p.description').text(d => d.description);
	const $svgEnter = $belowEnter.append('svg.trend');
	const $axisEnter = $svgEnter.append('g.g-axis');
	const $visEnter = $svgEnter.append('g.g-vis');
	$axisEnter
		.append('text.start')
		.text('Jan')
		.at('y', 0)
		.at('text-anchor', 'start')
		.st('fill', d => d.color.bg);
	$axisEnter
		.append('text.end')
		.text('Dec')
		.at('y', 0)
		.at('text-anchor', 'end')
		.st('fill', d => d.color.bg);
	$axisEnter.append('line.top-10').st('stroke', d => d.color.bg);
	$axisEnter
		.append('text.top-10')
		.text('Top 10')
		.at('y', 0)
		.at('text-anchor', 'end')
		.st('fill', d => d.color.bg);
	$visEnter.append('path.area').st('fill', d => d.color.bg);
	$visEnter.append('path.line').st('stroke', d => d.color.bg);

	$visEnter
		.append('circle')
		.at('r', 3)
		.st('fill', d => d.color.bg);

	$liEnter
		.classed('is-enter', true)
		.st('opacity', 0)
		.st('left', '100%')
		.st('top', d => d.rank_people * personHeight);

	// merge
	const $liMerge = $liEnter.merge($li);

	const mergeDelay = (1000 + $li.size() * updateDelay) * rate;
	$liMerge
		.classed('is-merge', true)
		.transition()
		.delay(
			d => (skip ? 0 : mergeDelay + ((d.rank_people * updateDelay) / 2) * rate)
		)
		.duration(skip ? 0 : 1000 * rate)
		.st('top', d => d.rank_people * personHeight)
		.st('opacity', 1)
		.st('left', '50%');

	$liMerge
		.select('.rank')
		.transition()
		.delay(
			d => (skip ? 0 : mergeDelay + ((d.rank_people * updateDelay) / 2) * rate)
		)
		.duration(skip ? 0 : 1000 * rate)
		.text(d => zeroPad(d.rank_people + 1));

	$liMerge
		.select('.annotation')
		.transition()
		.delay(
			d => (skip ? 0 : mergeDelay + ((d.rank_people * updateDelay) / 2) * rate)
		)
		.duration(skip ? 0 : 1000 * rate)
		.text(d => d.annotation || '');

	$liMerge
		.select('.edit')
		.at('href', getEditURL)
		.classed('is-transparent', d => d.annotation);

	svgWidth = $liMerge.node().offsetWidth - REM;
	$liMerge.each(updateTrend);
}

function advanceChart() {
	if (timer) timer.stop();
	timer = d3.timeout(advanceChart, SPEEDS[speedIndex]);
	if (
		autoplay &&
		!isSliding &&
		!isBelow &&
		currentDay < nestedData.length - 2
	) {
		currentDay += 1;
		$sliderNode.noUiSlider.set(currentDay);
		updateChart(false);
	}
}

function resize() {
	// update height of ul
	mobile = $section.node().offsetWidth < BP;
	const fs = mobile ? 14 : 20;
	personHeight = fs * 2 + 8;
	const height = (NUM_PEOPLE + 3) * personHeight;
	$rankList.st({
		height
	});
}

function init(people) {
	peopleData = people;
	resize();
	loadAppearanceData()
		.then(() => {
			preload(currentDay);
			setupNav();
			updateChart();
			lastUpdated();
			setupSlider();
			timer = d3.timeout(advanceChart, SPEEDS[speedIndex]);
			loadAllData();
		})
		.catch(console.log);
}

export default {
	init,
	resize
};
