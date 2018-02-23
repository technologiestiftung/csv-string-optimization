/*
 *
 * The concept for fingerprinting is taken from Open refine
 * https://github.com/OpenRefine/OpenRefine/wiki/Clustering-In-Depth
 *
 */

'use strict';

let meta = require('metaphone'),
  cologne = require('cologne-phonetic'),
  snowball = require('node-snowball')

let fingerprint = (function () {
 
  let module = {},
    punct = /[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-]/g,
    printable = /^[A-Za-z0-9]+/g,
    whitespace = /\s/g

  /*
   * type = normal|phonetic
   */

  module.key = (str, type = 'normal', params = { lang: 'german', stemming:false }) => {
		if(str == null || !str){
      throw 'key function requires a string to work'
    }else{
      str = str.trim()
      if(type=='normal'){
        str = str.toLowerCase()
      }
      str = str.replace(punct, '')
      str = str.replace(printable, '')
      if(type=='normal'){
        str = asciify(str)
      }
      let frags = str.split(whitespace)
      let tree = []
      frags.forEach(f => {
        if(tree.indexOf(f)==-1){
          tree.push(f)
        }
      })

      if(type == 'phonetic'){
        if(('stemming' in params) && params.stemming){
          tree.forEach((t,ti)=>{
            tree[ti] = snowball.stemword(t, lang)    
          })
        }
        
        tree.forEach((t,ti)=>{
          if(('lang' in params) && params.lang == 'german'){
            tree[ti] = cologne(t)
          }else{
            tree[ti] = meta(t)
          }
        })
      }

      tree.sort()
      return tree.join('')
    }
  }

  function asciify(str) {
    let chars = str.split('')
    chars.forEach((char,ci) => {
      chars[ci] = translate(char)
    })
    return chars.join('')
  }

  /**
   * Translate the given unicode char in the closest ASCII representation
   * NOTE: this function deals only with latin-1 supplement and latin-1 extended code charts
   */
  function translate(char) {
    let translations = [
      [['À','Á','Â','Ã','Ä','Å','à','á','â','ã','ä','å','Ā','ā','Ă','ă','Ą','ą'],
      'a'],
      [['Ç','ç','Ć','ć','Ĉ','ĉ','Ċ','ċ','Č','č'],
      'c'],
      [['Ð','ð','Ď','ď','Đ','đ'],
      'd'],
      [['È','É','Ê','Ë','è','é','ê','ë','Ē','ē','Ĕ','ĕ','Ė','ė','Ę','ę','Ě','ě'],
      'e'],
      [['Ĝ','ĝ','Ğ','ğ','Ġ','ġ','Ģ','ģ'],
      'g'],
      [['Ĥ','ĥ','Ħ','ħ'],
      'h'],
      [['Ì','Í','Î','Ï','ì','í','î','ï','Ĩ','ĩ','Ī','ī','Ĭ','ĭ','Į','į','İ','ı'],
      'i'],
      [['Ĵ','ĵ'],
      'j'],
      [['Ķ','ķ','ĸ'],
      'k'],
      [['Ĺ','ĺ','Ļ','ļ','Ľ','ľ','Ŀ','ŀ','Ł','ł'],
      'l'],
      [['Ñ','ñ','Ń','ń','Ņ','ņ','Ň','ň','ŉ','Ŋ','ŋ'],
      'n'],
      [['Ò','Ó','Ô','Õ','Ö','Ø','ò','ó','ô','õ','ö','ø','Ō','ō','Ŏ','ŏ','Ő','ő'],
      'o'],
      [['Ŕ','ŕ','Ŗ','ŗ','Ř','ř'],
      'r'],
      [['Ś','ś','Ŝ','ŝ','Ş','ş','Š','š','ſ','ß'],
      's'],
      [['Ţ','ţ','Ť','ť','Ŧ','ŧ'],
      't'],
      [['Ù','Ú','Û','Ü','ù','ú','û','ü','Ũ','ũ','Ū','ū','Ŭ','ŭ','Ů','ů','Ű','ű','Ų','ų'],
      'u'],
      [['Ŵ','ŵ'],
      'w'],
      [['Ý','ý','ÿ','Ŷ','ŷ','Ÿ'],
      'y'],
      [['Ź','ź','Ż','ż','Ž','ž'],
      'z']
    ]

    translations.forEach(t=>{
      if(t[0].indexOf(char)>-1){
        char = t[1]
      }
    })

    return char
  }

  module.analyse = (data, type = 'normal', params = { lang: 'german', stemming:false }) => {
    let map
    data.forEach((d,di)=>{
      let key = module.key(d, type, params)
      if(!(key in map)){
        map[key] = []
      }
      map[key].push({id:di, label:d})
    })
    return map
  }

  module.cluster = map => {
    let clusters = []
    for(let key in map){
      map[key].forEach( (m,mi) => {
        m['ok'] = (m==0)?2:1
      })

      clusters.push({
        key:key,
        cluster:map[key]
      })
    }

    return clusters
  }
 
  return module;

})()

module.exports = fingerprint