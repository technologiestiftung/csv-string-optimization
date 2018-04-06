'use strict';

const d3_dsv = require('d3-dsv'),
			fs = require('fs'),
			fingerprint = require('./src/fingerprint'),
			knn = require('./src/knn')

let csv_string_optimization = (function () {
 
	let module = {}

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

	module.saveJson = (path, data) => {
		module.save(path, JSON.stringify(data))
	}

	module.loadTemplate = path => {
		return module.json(path)
	}

	module.extractColumn = (data, column_name) => {
		return data.map( d=> { 
			return d[column_name ]
		})
	}

	//Exposing the comparison modules
	module.fingerprint = fingerprint
	module.knn = knn

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

	module.createTemplate = clusters => {
		return module.niceFormatting(clusters)
	}

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

	module.save = (path, data) => fs.writeFileSync(path, data, 'utf8')

	let jfy = (str) => {
		return JSON.stringify(str)
	}

	return module;
 
})()

module.exports = csv_string_optimization