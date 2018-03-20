let fs = require('fs'),
	d3_dsv = require('d3-dsv'),
	parser = d3_dsv.dsvFormat(';')

fs.readFile('data.csv', 'utf8', (err, data) => {
	if(err){
		throw(err)
	}else{
		try{
			let csv = parser.parse(data),
				csv1 = [], csv2 = []

			csv.forEach(c=>{
				switch(Math.round(Math.random())){
					case 0:
						csv1.push(c)
					break;
					default:
						csv2.push(c)
					break;
				}
			})

			saveCsv('data-1.csv', csv1)
			saveCsv('data-2.csv', csv2)
			
		}catch(err){
			throw(err)
		}
	}
})

let saveCsv = (path, data, separator = ',') => {
	let csv = '', keys = []

	for(let key in data[0]){
		if(csv != '') csv += separator
		csv += JSON.stringify(key)
		keys.push(key)
	}

	data.forEach(d=>{
		csv += '\n'
		keys.forEach((k,ki)=>{
			if(ki>0) csv += separator
			csv += JSON.stringify(d[k])
		})
	})

	fs.writeFileSync(path, csv, 'utf8')
}