let cleanedData;
let nestedData;
let last30DaysData;
let dateToday;

function cleanData(data) {
	return data.map(person => ({
		// ...person,
		article: person.article,
		rank_people: +person.rank_people,
		views: +person.views,
		dateString: person.date,
		date: new Date(person.date)
	}))
}

function getTodaysDate() {
	const currentDate = new Date();
	return currentDate;
}

function getLast30Days(date) {
	dateToday = getTodaysDate();
	const thirtyDaysInMilliseconds = 31 * 24 * 60 * 60 * 1000;

	return dateToday - new Date(date.key) < thirtyDaysInMilliseconds
}




function loadData() {
	const dataURL = 'https://pudding.cool/2018/08/wiki-billboard-data/web/2018-top--appearance.csv'
	d3.loadData(dataURL, (error, response) => {

		cleanedData = cleanData(response[0])

		nestedData = d3.nest()
			.key(d => d.dateString)
			.entries(cleanedData)

		nestedData.forEach(d => {
			d.key = new Date(d.key)
		})

		last30DaysData = nestedData.filter(getLast30Days)
		console.log(last30DaysData)




	})
}





function createDOMElements() {


}

function resize() {}

function init() {
	loadData()
	createDOMElements()
}

export default {
	init,
	resize
}