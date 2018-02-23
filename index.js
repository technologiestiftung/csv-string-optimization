/*
 *
 * Add header info here
 *
 */

'use strict';

let d3_dsv = require('d3-dsv'),
	fs = require('fs'),
	fingerprint = require('./src/fingerprint'),
	knn = require('./src/knn')

let csv_string_optimization = (function () {
 
  let module = {}

  module.readFile = (file, delimiter = ',') => {
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

  module.clean = (data, columns) => {
  	return new Promise ((resolve, reject) => {
  		//first make sure the provided columns are good
  		//check is only performed on the first row
  		let err = false
  		columns.forEach( c => {
  			if(!(c in data[0])){
  				if(!err){
  					err = ''
  				}else{
  					err += ', '
  				}
  				err += 'column '+c+' was not found in data'
  			}
  		})
  		if(err){
  			reject(err)
  		}else{
  			//collecting the matrix before comparing all strings
  			let items = {}
  			data.forEach( (d,di) => {
  				columns.forEach(c => {
  					if(di === 0){
  						items[c] = []
  					}
  					if(items[c].indexOf(d[c])==-1){
  						items[c].push(d[c])
  					}
  				})
  			})


  		}
  	})
  }

  return module;
 
})()

module.exports = csv_string_optimization