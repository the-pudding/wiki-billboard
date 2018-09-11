/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/
d3.selection.prototype.puddingChartTally = function init({
	maxY,
	count = 20
}) {
	function createChart(el) {
		const $sel = d3.select(el);
		let data = $sel.datum();

		data.values = data.values.slice(0, count)

		console.log(data.values[0])

		const lastDateArray = data.values.map(
			person => ({
				value: person.values[data.values[0].values.length - 1].appearance_sum,
				id: person.key
			})
		)

		// dimension stuff
		const FONT_SIZE = 12;
		let width = 0;
		let height = 0;
		const marginTop = FONT_SIZE * 2;
		const marginBottom = FONT_SIZE * 3;
		const marginLeft = FONT_SIZE * 3;
		const marginRight = FONT_SIZE;

		// scales
		const scaleX = d3.scaleTime();
		const scaleY = d3.scaleLinear();

		// dom elements
		let $svg = null;
		let $axis = null;
		let $vis = null;
		let $personEnter = null;

		// custom
		const voronoi = d3.voronoi();

		// helper functions


		function closest(num) {
			const diffs = lastDateArray.map(d => ({
				...d,
				diff: Math.abs(d.value - num)
			})).sort((a, b) => d3.descending(a.diff, b.diff))


			const {
				id
			} = diffs.pop()
			return id;
		}

		function getClosestPerson() {
			const yCoord = scaleY.invert(d3.mouse(this)[1]);

			const id = closest(yCoord);

			$vis.selectAll('.person')
				.classed('is-active', false)

			$vis.select(`[data-id='${id}']`)
				.classed('is-active', true)
		}

		function resetClosestPerson() {
			$vis.selectAll('.person')
				.classed('is-active', (d, i) => i === 0)

		}

		const Chart = {
			// called once at start
			init() {
				if (data.cat) $sel.classed(data.cat.split('/')[0], true);
				$sel.append('p.label').text(data.key);
				$svg = $sel.append('svg.pudding-chart');
				const $g = $svg.append('g');

				// offset chart for margins
				$g.at('transform', `translate(${marginLeft}, ${marginTop})`);

				$svg.on('mousemove touchmove', getClosestPerson)
					.on('mouseleave', resetClosestPerson);

				// create axis
				$axis = $svg.append('g.g-axis');

				$axis.append('g.axis--x');
				$axis.append('g.axis--y');

				// setup viz group
				$vis = $g.append('g.g-vis');
				$g.append('g.g-voronoi').at(
					'transform',
					`translate(${marginLeft}, ${marginTop})`
				);

				// bind data to dom elements
				const $person = $vis
					.selectAll('g.person')
					.data(data.values);

				// create elements
				$personEnter = $person
					.enter()
					.append('g.person')
					.at('data-id', d => d.key)
					.at('class', d => {
						const category = d.category.split('/')[0];
						return `person ${category}`;
					})
					.classed('is-active', (d, i) => i === 0);

				$personEnter.append('path');

				$personEnter
					.append('text.bg')
					.at('text-anchor', 'end')
					.text(d => d.values[0].name);

				$personEnter
					.append('text.fg')
					.at('text-anchor', 'end')
					.text(d => d.values[0].name);

				// setup scales
				scaleX.domain(d3.extent(data.values[0].values, d => d.date));

				scaleY.domain([0, maxY]);

				// setup voronoi
				voronoi.x(d => scaleX(d.date)).y(d => scaleY(d.appearance_sum));

				Chart.resize();
				Chart.render();
			},
			// on resize, update new dimensions
			resize() {
				// defaults to grabbing dimensions from container element
				width = $sel.node().offsetWidth - marginLeft - marginRight;
				// height = $sel.node().offsetHeight - marginTop - marginBottom;
				const ratio = width < 600 ? 1.125 : 1.67;
				height = width / ratio - marginTop - marginBottom;
				$svg.at({
					width: width + marginLeft + marginRight,
					height: height + marginTop + marginBottom
				});

				scaleX.range([0, width]);
				scaleY.range([height, 0]);

				$svg.at({
					width: width + marginLeft + marginRight,
					height: height + marginTop + marginBottom
				});

				voronoi.extent([
					[0, 0],
					[width, height]
				]);

				return Chart;
			},
			// update scales and render chart
			render() {
				const line = d3
					.line()
					.x(d => scaleX(d.date))
					.y(d => scaleY(d.appearance_sum))
					.curve(d3.curveStepBefore);

				const $person = $vis.selectAll('.person');

				$person
					.selectAll('text')
					.at('y', d => {
						const totalViews = +d.values[d.values.length - 1].appearance_sum;
						return scaleY(totalViews) - FONT_SIZE / 2;
					})
					.at('x', d => {
						const finalDate = d.values[d.values.length - 1].date;
						return scaleX(finalDate);
					});

				$person
					.select('path')
					.datum(d => d.values)
					.at('d', line);

				// update voronoi
				// const $path = $svg
				// 	.select('.g-voronoi')
				// 	.selectAll('path')
				// 	.data(voronoi.polygons(data.values));

				// $path
				// 	.enter()
				// 	.append('path')
				// 	.merge($path)
				// 	.at('d', d => (d ? `M${d.join('L')}Z` : null))
				// 	.on('mouseenter', handleVoronoiEnter)
				// 	.on('mouseout', handleVoronoiExit);

				// update axis
				const axisY = d3
					.axisLeft(scaleY)
					.tickSize(-width)
					.ticks(5);

				$axis
					.select('.axis--y')
					.call(axisY)
					.at('transform', `translate(${FONT_SIZE * 2}, ${marginTop})`);

				const axisX = d3.axisBottom(scaleX).tickFormat(d3.timeFormat('%b'));

				$axis
					.select('.axis--x')
					.call(axisX)
					.at('transform', `translate(${marginLeft}, ${height + marginTop})`);

				return Chart;
			},
			// get / set data
			data(val) {
				if (!arguments.length) return data;
				data = val;
				$sel.datum(data);
				Chart.render();
				return Chart;
			}
		};
		Chart.init();

		return Chart;
	}

	// create charts
	const charts = this.nodes().map(createChart);
	return charts.length > 1 ? charts : charts.pop();
};