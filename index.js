/**
 * CSV String Optimization
 * Strongly inspired by OpenRefine
 * https://github.com/OpenRefine/OpenRefine
 * @class csv-string-optimization
 */


'use strict';

const d3_dsv = require('d3-dsv'),
			fs = require('fs'),
			fingerprint = require('./src/fingerprint'),
			knn = require('./src/knn')

let csv_string_optimization = (function () {
 
	let module = {}

/**
 * Load a delimiter separated file.
 * @name dsv
 * @function
 * @memberOf csv-string-optimization
 * @param {string} file - Path to file.
 * @param {string} delimiter - default:",".
 * @return {object} parsed file.
 */
	module.dsv = (file, delimiter = ',') => {
		let parser = d3_dsv.dsvFormat(delimiter)
		return new Promise((resolve, reject) => {
			fs.readFile(file, 'utf8', (err, data) => {
				if(err){
					reject(err)
				}else{
					try{
						let csv = parser.parse(data)
						resolve(csv)
					}catch(err){
						reject(err)
					}
				}
			})
		})
	}

/**
 * Load a JSON file.
 * @name json
 * @function
 * @memberOf csv-string-optimization
 * @param {string} file - Path to file.
 * @return {object} parsed file.
 */
	module.json = (file) => {
		return new Promise((resolve, reject) => {
			fs.readFile(file, 'utf8', (err, data) => {
				if(err){
					reject(err)
				}else{
					try{
						let json = JSON.parse(data)
						resolve(json)
					}catch(err){
						reject(err)
					}
				}
			})
		})
	}

/**
 * Save object to CSV file
 * @name saveCsv
 * @function
 * @memberOf csv-string-optimization
 * @param {string} path - Path to file.
 * @param {array} data - array of objects to be save to CSV.
 * @param {string} separator - default:",".
 * @return {Void} - .
 */
	module.saveCsv = (path, data, separator = ',') => {
		let csv = '', keys = []

		for(let key in data[0]){
			if(csv != '') csv += separator
			csv += jfy(key)
			keys.push(key)
		}

		data.forEach(d=>{
			csv += '\n'
			keys.forEach((k,ki)=>{
				if(ki>0) csv += separator
				csv += jfy(d[k])
			})
		})

		module.save(path, csv)
	}

/**
 * Stringify and save JSON
 * @name saveJson
 * @function
 * @memberOf csv-string-optimization
 * @param {string} path - Path to file.
 * @param {object} data - JSON content.
 * @return {Void} - .
 */
	module.saveJson = (path, data) => {
		module.save(path, JSON.stringify(data))
	}

	//to be removed
	module.loadTemplate = path => {
		return module.json(path)
	}

/**
 * Extract column from object array
 * @name extractColumn
 * @function
 * @memberOf csv-string-optimization
 * @param {array} data - array of objects.
 * @param {string} column_name - name of to be extracted column.
 * @return {array} column.
 */
	module.extractColumn = (data, column_name) => {
		return data.map( d=> { 
			return d[column_name ]
		})
	}

	//Exposing the comparison modules
	module.fingerprint = fingerprint
	module.knn = knn

/**
 * Use a template to clean a file
 * @name cleanFile
 * @function
 * @memberOf csv-string-optimization
 * @param {array} data - array of objects to be cleaned.
 * @param {object} template - Template (parsed JSON).
 * @param {string} column_name - Column name of data to be cleaned.
 * @return {object} parsed data.
 */
	module.cleanFile = (data, template, column_name) => {
		//create a hashmap of all replacements
		let map = {}
		template.forEach(t=>{
			let replace = t[0].label
			t.forEach(tt =>{
				if(tt.ok==2){
					replace = tt.label
				}
			})
			t.forEach(tt=>{
				map[tt.label] = replace
			})
		})

		data.forEach(d=>{
			if(d[column_name] in map) d[column_name] = map[d[column_name]]
		})

		return data;
	}

	//To be removed
	module.createTemplate = clusters => {
		return module.niceFormatting(clusters)
	}

/**
 * Merge two templates created with this module.
 * @name mergeTemplate
 * @function
 * @memberOf csv-string-optimization
 * @param {object} oldTemplate - Old template as parsed json.
 * @param {object} newTemplate - New template as parsed json.
 * @return {object} merged template.
 */
	module.mergeTemplate = (oldTemplate, newTemplate) => {
		let map = {}
		oldTemplate.forEach((t,ti)=>{
			t.forEach((tt,tti)=>{
				map[tt.label] = [ti,tti]
			})
		})
		newTemplate.forEach(t=>{
			let exists = false
			t.forEach(tt=>{
				if(tt.label in map){
					exists = map[tt.label]
				}
			})
			if(!exists){
				oldTemplate.push(t)
			}else{
				t.forEach(tt=>{
					if(!(tt.label in map)){
						tt.ok = 0
						oldTemplate[exists[0]].push(tt)
					}else{
						oldTemplate[map[tt.label][0]][map[tt.label][1]].c += tt.c
					}
				})	
			}
		})
		return oldTemplate
	}

/**
 * Transfor json into a nice to read and edit file.
 * @name niceFormatting
 * @function
 * @memberOf csv-string-optimization
 * @param {json} json - to be formatted.
 * @return {string} ready to be written to a file.
 */
	module.niceFormatting = (json) => {
		let template = '[\n'

		json.forEach((c,ci)=>{
			template += ' [\n'
			c.forEach((item,i)=>{
				template += '	 {"label":'+JSON.stringify(item.label)+',"c":'+item.c+',"ok":'+item.ok+'}'+ ((i==c.length-1)?'':',') +'\n'
			})
			template += ' ]' + ((ci==json.length-1)?'':',') + '\n'
		})

		template += ']'

		return template
	}

/**
 * Save a file.
 * @name save
 * @function
 * @memberOf csv-string-optimization
 * @param {string} path - Path to destination file.
 * @param {string} data - To be written to file.
 * @return {Void} - .
 */
	module.save = (path, data) => fs.writeFileSync(path, data, 'utf8')

/**
 * Shorthand for JSON.stringify.
 * @name jfy
 * @function
 * @memberOf csv-string-optimization
 * @param {string} str - to be parsed string
 * @return {object} parsed string.
 */
	let jfy = (str) => {
		return JSON.stringify(str)
	}

	return module;
 
})()

module.exports = csv_string_optimization