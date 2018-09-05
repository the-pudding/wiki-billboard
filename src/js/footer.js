import enterView from 'enter-view';

function loadVideos() {
	d3.selectAll('footer video').each(function() {
		const $el = d3.select(this);
		const src = $el.at('data-src');
		$el.at({ src });
	});
}

export default function() {
	enterView({
		selector: 'footer',
		enter: loadVideos
	});
}
