import './pudding-chart/tally';

let cleanedDataAlive = [];
let cleanedDataDead = [];
const nestedData = [];

const COL = 'appearance_sum';
const $section = d3.select('#tally');
const $tallyFigures = $section.select('.tally__figures');

const $celebPaths = null;
const $voronoiGroup = null;
const $personEnter = null;
const $personText = null;

const width = 0;
let height = 0;

let charts = [];

const MARGIN = {
	top: 20,
	bottom: 40,
	left: 50,
	right: 200
};

function parseDate(date) {
	const dates = date.split('-').map(d => +d);
	return new Date(dates[0], dates[1] - 1, dates[2]);
}

function cleanTheData(data) {
	return data.map(person => ({
		article: person.article,
		id: person.article.replace(/([^a-zA-Z])/g, ''),
		name: person.article.replace(/_/g, ' '),
		rank_people: +person.rank_people,
		views: +person.views,
		// score: +person.score,
		dateString: person.date,
		score_sum: +person.score_sum,
		views_sum: +person.views_sum,
		appearance_sum: +person.appearance_sum,
		date: parseDate(person.date)
	}));
}

function loadData() {
	return new Promise((resolve, reject) => {
		const timeStamped = Date.now();
		// const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-tally-views--alive.csv?version=${timeStamped}`;
		const dataURL1 = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-tally-appearance--alive.csv?version=${timeStamped}`;
		const dataURL2 = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-tally-appearance--dead.csv?version=${timeStamped}`;

		d3.loadData(dataURL1, dataURL2, (error, response) => {
			if (error) reject(error);
			else {
				cleanedDataAlive = cleanTheData(response[0]);
				cleanedDataDead = cleanTheData(response[1]);
				resolve();
			}
		});
	});
}

// function getMaxSum(data) {
// const maxes = data.map(person => d3.sum(person.values, v => v.score))
// return d3.max(maxes)
// }

function handleVoronoiEnter(d) {
	const celebrityName = d.data.name;

	console.log('active');
	$gViz
		.select(`[data-name='${celebrityName}'] path`)
		.classed('is-active', true);
	$gViz
		.select(`[data-name='${celebrityName}'] text`)
		.classed('is-active', true);
}

function handleVoronoiLeave(d) {
	$gViz.selectAll('path').classed('is-active', false);
	$gViz.selectAll('text').classed('is-active', false);
}

function setupCharts() {
	charts = $tallyFigures
		.selectAll('figure')
		.data([cleanedDataAlive, cleanedDataDead])
		.enter()
		.append('figure')
		.puddingChartTally();
}

function resize() {
	// Grab width

	// width = $tallyFigures.node().offsetWidth;
	height = Math.floor(window.innerHeight * 0.75);
	$tallyFigures.selectAll('figure').st({ height });

	charts.forEach(c => c.resize().render());
	// render();
	// setupVoronoi();
}

function init(dataPeople) {
	// console.log(dataPeople)
	loadData()
		.then(() => {
			setupCharts();
			resize();
		})
		.catch(console.log);
}

export default {
	init,
	resize
};
