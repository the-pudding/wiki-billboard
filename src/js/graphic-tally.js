let cleanedData = [];
let nestedData = [];

const COL = 'appearance_sum';
const $section = d3.select('#tally');
const $tallyEstablished = $section.select('.tally__established');
const $figure = $tallyEstablished.select('figure');
const $svg = $figure.select('svg');
const $gAxes = $svg.select('.g-axes');
const $gViz = $svg.select('.g-viz');
const $celebPaths = null;
let $voronoiGroup = null;
let $personEnter = null;
let $personText = null;

const scaleX = d3.scaleTime();
const scaleY = d3.scaleLinear();
const voronoi = d3.voronoi();

let width = 0;
let height = 0;

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
		const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-tally-appearance--alive.csv?version=${timeStamped}`;

		d3.loadData(dataURL, (error, response) => {
			if (error) reject(error);
			else {
				cleanedData = cleanTheData(response[0]);
				// console.log(response[0])

				const tempNestedData = d3
					.nest()
					.key(d => d.name)
					.entries(cleanedData);

				tempNestedData.sort((a, b) => {
					const maxA = a.values[a.values.length - 1][COL];
					const maxB = b.values[b.values.length - 1][COL];
					return d3.descending(maxA, maxB);
				});

				nestedData = tempNestedData.slice(0, 50);
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

	console.log('active')
	$gViz.select(`[data-name='${celebrityName}'] path`).classed('is-active', true)
	$gViz.select(`[data-name='${celebrityName}'] text`).classed('is-active', true)
}

function handleVoronoiLeave(d) {
	$gViz.selectAll('path').classed('is-active', false)
	$gViz.selectAll('text').classed('is-active', false)
}

function setupVoronoi() {
	voronoi
		.x(d => scaleX(d.date))
		.y(d => scaleY(d[COL]))
		.extent([
			[0, 0],
			[width, height]
		]);

	$voronoiGroup = $gViz.append('g').at('class', 'g-voronoi');


	const flatData = nestedData.map(d => {
		return d.values[d.values.length - 1]
	})



	const mergedData = d3.merge(nestedData.map(d => {
		// return d.values[d.values.length - 1]
		return d.values
	}));

	const $voronoiPath = $voronoiGroup.selectAll('path');

	$voronoiPath
		.data(voronoi.polygons(mergedData))
		.enter()
		.append('path.voronoi')
		.on('mouseenter', handleVoronoiEnter)
		.on('mouseout', handleVoronoiLeave)
		// .merge($voronoiPath)
		.attr('d', d => (d ? `M${d.join('L')}Z` : null));
}

function setupChart() {
	// bind data to dom elements
	const $person = $gViz.selectAll('g.person').data(nestedData);

	// create elements
	$personEnter = $person
		.enter()
		.append('g.person')
		.at('data-name', d => d.key);

	$personEnter.append('path');

	$personText = $personEnter.append('text').text(d => d.key);

	// setup scales
	scaleX.domain(d3.extent(cleanedData, d => d.date));

	scaleY.domain([0, d3.max(cleanedData, d => d[COL])]);

	console.log(scaleY.domain());
}

function render() {
	const line = d3
		.line()
		.x(d => scaleX(d.date))
		.y(d => scaleY(d[COL]))
		.curve(d3.curveStepBefore);

	$personText
		.at('y', d => {
			const totalViews = +d.values[d.values.length - 1][COL];
			// console.log(`name ${d.values[d.values.length - 1].article}`);
			// console.log(`total views ${d.values[d.values.length - 1][COL]}`);
			// console.log(`coordinates ${scaleY(totalViews)}`);
			return scaleY(totalViews);
		})
		.at('x', d => {
			const finalDate = d.values[d.values.length - 1].date;
			return scaleX(finalDate);
		});

	// console.log(nestedData)

	$gViz
		.selectAll('.person path')
		// .at('data-name', d => d.key)
		.datum(
			d =>
			// console.log(d);
			d.values
		)
		.at('d', line);
}

function resize() {
	// Grab width
	width = $figure.node().offsetWidth;

	height = window.innerHeight;

	// update range
	scaleX.range([MARGIN.left, width - MARGIN.right]);

	scaleY.range([height - MARGIN.bottom, MARGIN.top]);

	$svg.at('width', width).at('height', height);

	render();
	setupVoronoi();
}

function init(dataPeople) {
	// console.log(dataPeople)
	loadData()
		.then(() => {
			setupChart();
			resize();
		})
		.catch(console.log);
}

export default {
	init,
	resize
};