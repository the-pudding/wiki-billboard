/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/
d3.selection.prototype.puddingChartTally = function init(options) {
	function createChart(el) {
		const $sel = d3.select(el);
		let data = $sel.datum();

		// dimension stuff
		const FONT_SIZE = 12;
		const ASPECT_RATIO = 3 / 2;
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

		// custom
		const voronoi = d3.voronoi();

		// helper functions

		function setupVoronoi() {
			// const flatData = nestedData.map(d => d.values[d.values.length - 1]);
			// const mergedData = d3.merge(
			// 	nestedData.map(
			// 		d =>
			// 			// return d.values[d.values.length - 1]
			// 			d.values
			// 	)
			// );
		}

		function handleVoronoiEnter(d) {
			const { id } = d.data;
			$vis
				.select(`[data-id='${id}']`)
				.classed('is-active', true)
				.raise();
		}

		function handleVoronoiExit(d) {
			const { id } = d.data;
			$vis.select(`[data-id='${id}']`).classed('is-active', false);
		}

		const Chart = {
			// called once at start
			init() {
				$svg = $sel.append('svg.pudding-chart');
				const $g = $svg.append('g');

				// offset chart for margins
				$g.at('transform', `translate(${marginLeft}, ${marginTop})`);

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
				const $person = $vis.selectAll('g.person').data(data);

				// create elements
				const $personEnter = $person
					.enter()
					.append('g.person')
					.at('data-id', d => d.key);

				$personEnter.append('path');

				$personEnter
					.append('text')
					.at('text-anchor', 'end')
					.text(d => d.values[0].name);

				// setup scales
				scaleX.domain(d3.extent(data[0].values, d => d.date));

				scaleY.domain([0, options.maxY]);

				console.log(scaleY.domain());

				// setup voronoi
				voronoi.x(d => scaleX(d.date)).y(d => scaleY(d.appearance_sum));

				Chart.resize();
				Chart.render();
			},
			// on resize, update new dimensions
			resize() {
				// defaults to grabbing dimensions from container element
				width = $sel.node().offsetWidth - marginLeft - marginRight;
				height = $sel.node().offsetHeight - marginTop - marginBottom;
				height = width / ASPECT_RATIO - marginTop - marginBottom;
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

				voronoi.extent([[0, 0], [width, height]]);

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
					.select('text')
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
				const $path = $svg
					.select('.g-voronoi')
					.selectAll('path')
					.data(voronoi.polygons(data));

				$path
					.enter()
					.append('path')
					.merge($path)
					.at('d', d => (d ? `M${d.join('L')}Z` : null))
					.on('mouseenter', handleVoronoiEnter)
					.on('mouseout', handleVoronoiExit);

				// update axis
				const axisY = d3.axisLeft(scaleY).tickSize(-width);

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
