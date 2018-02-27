let csvOpti = require('../index.js'),
 	fingerprint = require('../src/fingerprint.js'),
 	knn = require('../src/knn.js'),
 	fs = require('fs')

let str = 'Ich denk, dass ist eine feine Sache! äöüÄÖÜß.:-)'
console.log(str, fingerprint.key(str))
console.log(str, fingerprint.key(str, 'phonetic'))
console.log('Bezirksamt Neukölln', fingerprint.key('Bezirksamt Neukölln'))

csvOpti.readFile(__dirname + '/data/data.csv', ';')
	.then(data => {
		console.log('success', data.length, data[0])
		//id;name;geber;art;jahr;anschrift;politikbereich;zweck;betrag;empfaengerid
		let column = [], column_title = 'name'
		data.forEach(d=>{
			column.push(d[column_title])
		})

		//FINGERPRINTING
		let analysis = fingerprint.analyse(column)
		fs.writeFileSync(__dirname + '/output/fp-analysis.json', JSON.stringify(analysis), 'utf8')
		let cluster = fingerprint.cluster(analysis)
		fs.writeFileSync(__dirname + '/output/fp-cluster.json', JSON.stringify(cluster), 'utf8')
		let cluster_count = cluster.map(c=>{
			let count = 0
			for(let key in c.cluster){
				count++
			}
			return count
		})
		fs.writeFileSync(__dirname + '/output/fp-cluster_count.json', JSON.stringify(cluster_count), 'utf8')
		let readable_clusters_fp = fingerprint.readableCluster(cluster)
		fs.writeFileSync(__dirname + '/output/fp-cluster_readable.json', JSON.stringify(readable_clusters_fp), 'utf8')
		fs.writeFileSync(__dirname + '/output/fp-template.json', csvOpti.createTemplate(readable_clusters_fp), 'utf8')


		//KNN
		let reduced = knn.reduce(column),
			reduced_column = []
		for(let key in reduced){
			reduced_column.push(key)
		}
		let clusters = knn.prepare(reduced_column)
		fs.writeFileSync(__dirname + '/output/knn-ngrams.json', JSON.stringify(clusters), 'utf8')

		let results = knn.analyse(clusters, reduced_column, 0.1)
		fs.writeFileSync(__dirname + '/output/knn-results.json', JSON.stringify(results), 'utf8')

		let result_clusters = knn.cluster(results)
		fs.writeFileSync(__dirname + '/output/knn-result_clusters.json', JSON.stringify(result_clusters), 'utf8')

		let readable_clusters = knn.readableCluster(result_clusters, reduced_column, column)
		fs.writeFileSync(__dirname + '/output/knn-readable_clusters.json', JSON.stringify(readable_clusters), 'utf8')

		fs.writeFileSync(__dirname + '/output/knn-template.json', csvOpti.createTemplate(readable_clusters), 'utf8')

	}).catch(err => {
		console.log('err', err)
	})

