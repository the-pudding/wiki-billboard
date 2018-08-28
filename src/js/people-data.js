function init() {
	return new Promise((resolve, reject) => {

		const timeStamped = Date.now()
		const dataURL = `https://pudding.cool/2018/08/wiki-billboard-data/web/2018-people.csv?version=${timeStamped}`

		d3.loadData(dataURL, (error, response) => {
			if (error) reject(error)
			else resolve(response[0])
		})
	})
}

export default {
	init
}