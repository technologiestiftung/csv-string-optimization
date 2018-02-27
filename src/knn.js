/*
 *
 * The concept for knn via levenshtein is taken from Open refine
 * https://github.com/OpenRefine/OpenRefine/wiki/Clustering-In-Depth
 *
 */

'use strict';

let levenshtein = require('js-levenshtein')

let knn = (function () {
 
  let module = {}

  module.reduce = (_data) => {
    let keys = {},
      data = _data

    data.forEach((d,di)=>{
      if(!(d in keys)){
        keys[d] = []
      }

      keys[d].push(di)
    })
    return keys
  }

  module.prepare = (_data, ngramSize = 6) => {
    let data = _data,
      ngrams = {},
      clusters = {}

    //identify and group exact matches
    data.forEach( (d, di) => {
      d = d.toLowerCase()
      if(d.length <= ngramSize){
        addNgram(d, di, ngrams)
      }else{
        for(var i = 0; i<(d.length - ngramSize); i++){
          addNgram(d.substr(i,ngramSize), di, ngrams)
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

    return clusters;
  }

  module.process = (id, clusters, data, limit, type) => {
    if(!(id in clusters)){
      return false
    }else{
      let results = []

      clusters[id].forEach(c => {
        let index = levenshtein(data[c].toLowerCase(), data[id].toLowerCase())
        if(type == 'percent'){
          index = index / ((data[id].length<data[c].length)?data[id].length:data[c].length)
        }
        if(index < limit){
          results.push({id:c, label:data[c], index:index})
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

  module.analyse = (_clusters, _data, limit = 0.1, type = 'percent') => {
    let results = {},
      clusters = _clusters,
      data = _data

    data.forEach( (d,di) => {
      results[di] = {id:di, label:d, nn:module.process(di, clusters, data, limit, type)}
    })

    return results
  }

  module.cluster = results => {
    let outClusters = [],
      removed = [],
      results_length = 0,
      max = -Number.MAX_VALUE

    for(let key in results){
      results_length++
      if(key > max){max = key}
    }

    let nextId = 0
    while(removed.length < results_length){
      while(removed.indexOf(nextId)>-1){
        nextId++
      }

      if((nextId in results)){

        let newCluster = [nextId],
          needChecking = []

        removed.push(nextId)

        if(results[nextId].nn){
          results[nextId].nn.forEach(nn => {
            needChecking.push(nn.id)
          })

          while(needChecking.length > 0){
            let moreNeedChecking = []
            needChecking.forEach(nn => {

              if(newCluster.indexOf(nn)==-1){
                removed.push(nn)
                newCluster.push(nn)
              }

              if(results[nn].nn){
                results[nn].nn.forEach(nnn => {
                  if(newCluster.indexOf(nnn.id)==-1){
                    moreNeedChecking.push(nnn.id)
                  }
                })
              }

            })
            needChecking = moreNeedChecking
          }
        }

        outClusters.push(newCluster)
      }
    }

    return outClusters
  }

  module.readableCluster = (clusters, reduced_data, data) => {
    let readable = []

    clusters.forEach(c=>{
      let cluster = []
      c.forEach(cc=>{
        let label = reduced_data[cc]
        let t = {c:0, ok:1, ids:[], label:label}
        data.forEach((d,di)=>{
          if(d == label){
            t.c++
            t.ids.push(di)
          }
        })
        cluster.push(t)
      })
      cluster.sort((a,b) => { return b.c-a.c })
      cluster[0].ok = 2
      readable.push(cluster)
    })

    return readable
  }

  function addNgram(str, id, ngrams){
    if(!(str in ngrams)){
      ngrams[str] = []
    }
    if(ngrams[str].indexOf(id)==-1){
      ngrams[str].push(id)
    }
  }

  return module;
})()

module.exports = knn