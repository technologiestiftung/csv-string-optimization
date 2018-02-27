let csvOpti = require('../index.js')

let str = 'Ich denk, dass ist eine feine Sache! äöüÄÖÜß.:-)'
console.log(str, csvOpti.fingerprint.key(str))
console.log(str, csvOpti.fingerprint.key(str, 'phonetic'))
console.log('Bezirksamt Neukölln', csvOpti.fingerprint.key('Bezirksamt Neukölln'))


csvOpti.dsv(__dirname + '/data/data.csv', ';')
	.then(data => {

		//id;name;geber;art;jahr;anschrift;politikbereich;zweck;betrag;empfaengerid
		let column_name = 'name',
			column = csvOpti.extractColumn(data, column_name)

		/*----- FINGERPRINTING -----*/

		let fp_template = csvOpti.createTemplate(
				csvOpti.fingerprint.readableCluster(
					csvOpti.fingerprint.cluster(
						csvOpti.fingerprint.analyse(
							column
						)
					)
				)
			)

		csvOpti.save(__dirname + '/output/fp-template.json', fp_template)
		csvOpti.saveCsv(__dirname + '/output/fp-cleaned.csv', csvOpti.cleanFile(data, JSON.parse(fp_template), column_name))

		//Save between steps to files
		// let analysis = fingerprint.analyse(column)
		// 	fs.writeFileSync(__dirname + '/output/fp-analysis.json', JSON.stringify(analysis), 'utf8')
		// let cluster = fingerprint.cluster(analysis)
		// 	fs.writeFileSync(__dirname + '/output/fp-cluster.json', JSON.stringify(cluster), 'utf8')
		// let readable_clusters_fp = fingerprint.readableCluster(cluster)
		// 	fs.writeFileSync(__dirname + '/output/fp-cluster_readable.json', JSON.stringify(readable_clusters_fp), 'utf8')
		// 	fs.writeFileSync(__dirname + '/output/fp-template.json', csvOpti.createTemplate(readable_clusters_fp), 'utf8')

		/*----- KNN -----*/

		let reduced_column = csvOpti.knn.reduce(column),
			clusters = csvOpti.knn.prepare(reduced_column)

		let knn_template = csvOpti.createTemplate(
				csvOpti.knn.readableCluster(
					csvOpti.knn.cluster(
						csvOpti.knn.analyse(
							clusters, reduced_column, 0.1
						)
					), 
					reduced_column, column
				)
			)

		csvOpti.save(__dirname + '/output/knn-template.json', knn_template)
		csvOpti.saveCsv(__dirname + '/output/knn-cleaned.csv', csvOpti.cleanFile(data, JSON.parse(knn_template), column_name))

		//Save between steps to files
		// let clusters = knn.prepare(reduced_column)
		// fs.writeFileSync(__dirname + '/output/knn-ngrams.json', JSON.stringify(clusters), 'utf8')
		// let results = knn.analyse(clusters, reduced_column, 0.1)
		// fs.writeFileSync(__dirname + '/output/knn-results.json', JSON.stringify(results), 'utf8')
		// let result_clusters = knn.cluster(results)
		// fs.writeFileSync(__dirname + '/output/knn-result_clusters.json', JSON.stringify(result_clusters), 'utf8')
		// let readable_clusters = knn.readableCluster(result_clusters, reduced_column, column)
		// fs.writeFileSync(__dirname + '/output/knn-readable_clusters.json', JSON.stringify(readable_clusters), 'utf8')
		// fs.writeFileSync(__dirname + '/output/knn-template.json', csvOpti.createTemplate(readable_clusters), 'utf8')

	}).catch(err => {
		console.log('err', err)
	})

