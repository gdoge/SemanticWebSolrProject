var fs = require('fs');

var input = require('./output');

input.forEach(movie => {
  let names = movie.weapons.map(({name}) => name);
  let paths = movie.weapons.map(({path}) => path);
  movie.weapons = names;
  movie.weapon_paths = paths;
})

fs.writeFile("./output_solr.json", JSON.stringify(input, null, 2));
