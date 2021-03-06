import './pudding-chart/tally';
import categories from './people-categories.json';

let cleanedDataAlive = [];
let cleanedDataDead = [];
let byCategory = [];
let allData = [];
let peopleData = null;

const catLabels = {
	'film/tv/theater': 'film, tv, and theater',
	sports: 'sports',
	music: 'music',
	culture: 'culture',
	misc: 'politics, business, and other'
};

const $section = d3.select('#tally');
const $figuresFeature = $section.select('.tally__figures--feature');
const $figuresCategory = $section.select('.tally__figures--category');

const $celebPaths = null;
const $voronoiGroup = null;
const $personEnter = null;
const $personText = null;

const width = 0;
const height = 0;

let featureCharts = [];
let categoryCharts = [];

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

function getCategory(id) {
	const match = peopleData.find(d => d.id === id);
	return match ? match.category : null;
}

function nestData(data) {
	const tempNestedData = d3
		.nest()
		.key(d => d.id)
		.entries(data);

	tempNestedData.sort((a, b) => {
		const maxA = a.values[a.values.length - 1].appearance_sum;
		const maxB = b.values[b.values.length - 1].appearance_sum;
		return d3.descending(maxA, maxB);
	});

	const withOccupation = tempNestedData.map(person => ({
		...person,
		category: getCategory(person.key)
	}));
	return withOccupation;
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
				const c1 = cleanTheData(response[0]);
				const c2 = cleanTheData(response[1]);
				allData = c1.concat(c2);
				cleanedDataAlive = nestData(c1);
				cleanedDataDead = nestData(c2);

				// nest by person all
				const allNested = nestData(allData);

				byCategory = d3
					.nest()
					.key(d => d.category)
					.entries(allNested)
					.filter(d => d.values.length >= 10)
					.map(d => ({
						...d,
						key: catLabels[d.key],
						cat: d.key
					}));

				// add people data categories

				resolve();
			}
		});
	});
}

function setupCharts() {
	const maxY = d3.max(allData, d => d.appearance_sum);

	featureCharts = $figuresFeature
		.selectAll('figure')
		.data([
			{
				key: 'Living celebrities',
				values: cleanedDataAlive
			},
			{
				key: 'Deceased celebrities',
				values: cleanedDataDead
			}
		])
		.enter()
		.append('figure')
		.puddingChartTally({
			maxY
		});

	categoryCharts = $figuresCategory
		.selectAll('figure')
		.data(byCategory)
		.enter()
		.append('figure')
		.puddingChartTally({
			maxY,
			count: 10
		});
}

function resize() {
	// Grab width

	// width = $tallyFigures.node().offsetWidth;
	// height = Math.floor(window.innerHeight * 0.75);
	// $figuresFeature.selectAll('figure').st({
	// 	height
	// });

	featureCharts.forEach(c => c.resize().render());
	// render();
	// setupVoronoi();
}

function init(dataPeople) {
	peopleData = dataPeople;
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
