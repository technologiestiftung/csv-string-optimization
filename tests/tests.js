let csvOpti = require('../index.js'),
 	fingerprint = require('../src/fingerprint.js'),
 	knn = require('../src/knn.js')

let str = 'Ich denk, dass ist eine feine Sache! äöüÄÖÜß.:-)'
console.log(str, fingerprint.key(str))
console.log(str, fingerprint.key(str, 'phonetic'))

csvOpti.readFile(__dirname + '/data/data.csv', ';')
	.then(data => {
		console.log('success', data.length, data[0])
		let geber = []
		data.forEach(d=>{
			geber.push(d.geber)
		})
		console.log(fingerprint.cluster(fingerprint.analyse(geber)))
	}).catch(err => {
		console.log('err', err)
	})

