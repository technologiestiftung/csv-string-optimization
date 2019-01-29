# csv-string-optimization

[![Greenkeeper badge](https://badges.greenkeeper.io/technologiestiftung/csv-string-optimization.svg)](https://greenkeeper.io/)

As part of the Technologiestiftung Berlin's open data agenda we are working on tools to support citizens deal with open data.

The string optimization module is trying to identify similar names in CSV column and allows you to reduce those to the most common string or another of your choice. It can be used as a module in other node.js scripts or as a command line tool.

The overall concept is strongly inspired by Open Refine.

A documentation of the code is available here: http://technologiestiftung.github.io/csv-string-optimization

## Concept

At the heart of the module are two methods to identify similar strings. 

### Fingerprinting

Fingerprinting is using either phonetic or normal fingerprinting to create an abstracted string from the original string in order to quickly compare strings with one another.

### KNN

KNN is a lot more processing intensive. Therefore before the distance between to strings is calculated (Levenshtein), the strings are organized into groups based on common ngrams (default size : 6).

### Templates

The module is build on the concept of templates that are easy to manipulate manually. After a CSV is analysed the module creates a Template (json). This template includes groups for similar strings. The user can then decide where the grouping was done correctly and which string should be the replacement string. Using the template the user can then clean the original CSV. 
In many cases when dealing with open data, you might want to update your project when new data is released. For this case you can run the analysis function again and then merge the new template with the old one and simply see if new cases were correctly matched with your existing decisions. And then use the resulting merge-template to build a new clean CSV.

## Install

```
npm install csv-string-optimization
```

## Usage

### Node.js Package

The most common case is loading a csv and then identifying duplicates and then transforming the original 

```javascript
const csvOpti = require('csv-string-optimization')

/*----- LOAD DATA -----*/
csvOpti.dsv(__dirname + '/data/data-2.csv', ',')
	.then(data => {

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

		csvOpti.save(__dirname + '/output/fp-template-'+i+'.json', fp_template)

		/*----- CLEAN FILE WITH TEMPLATE -----*/
		csvOpti.saveCsv(__dirname + '/output/fp-cleaned-'+i+'.csv', csvOpti.cleanFile(d, JSON.parse(fp_template), column_name))



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

		csvOpti.save(__dirname + '/output/knn-template-'+i+'.json', knn_template)

		/*----- CLEAN FILE WITH TEMPLATE -----*/
		csvOpti.saveCsv(__dirname + '/output/knn-cleaned-'+i+'.csv', csvOpti.cleanFile(d, JSON.parse(knn_template), column_name))

	}).catch(err => {
		console.log('err', err)
	})

```

You cannot only analyse and transform a whole file, you can also use the underlying methods, e.g. the fingerprinting function:

```javascript
const csvOpti = require('csv-string-optimization')

let str = 'Ich denk, dass ist eine feine Sache! äöüÄÖÜß.:-)'
console.log(str, csvOpti.fingerprint.key(str))
console.log(str, csvOpti.fingerprint.key(str, 'phonetic'))
console.log('Bezirksamt Neukölln', csvOpti.fingerprint.key('Bezirksamt Neukölln'))

```

### Command line

If this does not work after installing the package, you might need to run:
```
npm link
```

Analyse File
```
csvStrOpti-analyse -c name -f /PATH-TO.csv -t /OUTPUT-PATH-TO-TEMPLATE.json -d ";"
```

Clean File
```
csvStrOpti-clean -c name -f /PATH-TO.csv -t /PATH-TO-TEMPLATE.json -d ";" -o /OUTPUT-PATH-CLEANED.csv
```

Merge File
```
csvStrOpti-merge -t /PATH-TO-OLD-TEMPLATE.json -n /PATH-TO-NEW-TEMPLATE.json -o /OUTPUT-PATH-TO-MERGED-TEMPLATE.json
```

Analyse & Clean File
```
csvStrOpti-analyse -c name -f /PATH-TO.csv -d ";" | csvStrOpti-clean -o /OUTPUT-PATH-TO-CLEANED.csv
```

For more information on the various parameters for each command simply call
```
csvStrOpti-analyse --help
```


## License
The library is provided under the MIT license, the test data in tests/data is not provided under MIT. The data is taken from https://www.berlin.de/sen/finanzen/service/zuwendungsdatenbank and is part of Berlin's open data.