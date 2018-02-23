/*
 *
 * The concept for knn via levenshtein is taken from Open refine
 * https://github.com/OpenRefine/OpenRefine/wiki/Clustering-In-Depth
 *
 */

'use strict';

let levenshtein = require('js-levenshtein')

let knn = (function () {
 
  let module = {},
    ngrams = {},
    clusters = {},
    data

  module.prepare = (_data, ngramSize = 6) => {
    data = _data
    data.forEach( (d, di) => {
      if(d.length <= ngramSize){
        addNgram(d, di)
      }else{
        for(var i = 0; i<(d.length - ngramSize); i++){
          addNgram(d.substr(i,ngramSize), di)
        }
      }        
    })

    for(let n in ngrams){
      ngrams[n].forEach(from_id => {
        ngrams[n].forEach(to_id => {
          if(from_id != to_id){
            if(!(from_id in clusters)){
              clusters[from_id] = []  
            }
            if(clusters[from_id].indexOf(to_id)==-1){
              clusters[from_id].push(to_id)
            }
          }
        })
      })
    }
  }

  module.process = id => {
    if(!(id in clusters)){
      return false
    }else{
      let results = []

      clusters[id].forEach(c => {
        index = levenshtein(data[c], data[id])
        if(type == 'percent'){
          index = index / data[id].length
        }
        if(index < limit){
          results.push({id:id, target:c, index:index})
        }
      })

      results.sort((a,b) => {
        return a.index - b.index
      })

      return results
    }
  }

  /*
   * type = percent|absolute
   */

  module.analyse = (limit = 10, type = 'percent') => {
    let results = {}
    data.forEach( (d,di) => {
      results[di] = {id:di, label:d, nn:module.analyse(di, limit, type)}
    })
    return results
  }

  module.cluster = results => {
    let outClusters = [],
      removed = []

    while(removed < results.length){
      let nextId = 0
      while(removed.indexOf(nextId)>-1){
        nextId++
      }

      let newCluster = [nextId],
        needChecking = []

      removed.push(nextId)

      results[0].nn.forEach(nn => {
        needChecking.push(nn.target)
      })

      while(needChecking.length > 0){
        let moreNeedChecking = []
        needChecking.forEach(nn => {
          removed.push(nn)
          results[nn].nn.forEach(nnn => {
            if(!(nnn.target in newCluster)){
              moreNeedChecking.push(nnn.target)
            }
          })
        })
        needChecking = moreNeedChecking
      }
    }

    return outClusters
  }

  function addNgram(str, id){
    if(!(str in ngrams)){
      ngrams[str] = []
    }
    if(ngrams[str].indexOf(id)==-1){
      ngrams[str].push(id)
    }
  }

  module.ngrams = () => {
    return ngrams
  }

  module.clusters = () => {
    return clusters
  }

  return module;
})()

module.exports = knn