var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var Q = require('q');

var errores = 0;

//Promised Request
var $get = function(url){
  var deferred = Q.defer();
  request.get(url, (error, response) => {
    if(error) deferred.reject(error);
    else deferred.resolve(response);
  })
  return deferred.promise;
}
//...

var movieList = [];

var scrapeMoviesList = function(path){
  $get("http://www.imfdb.org"+path)
  .then(response => {
    $ = cheerio.load(response.body);
    var pagesDiv = $("#mw-pages").first(); //main list div...
    var nextLink;

    pagesDiv.find("[title='Category:Movie']").each((i, element) => {
      if($(element).text() == "next 200") nextLink = $(element);
    })
    var movies = pagesDiv.find("li > a");
    movies.each((i, element) => {
      movieList.push({
        title: $(element).text(),
        path: $(element).attr("href")
      })
    })

    //SCRAPE NEXT LIST PAGE
    if(nextLink){
      process.stdout.write(".");
      //console.log(nextLink.attr("href"));
      scrapeMoviesList(nextLink.attr("href"));
    }
    else{
      console.log("DONE");
      getWeaponsFromMovies();
    }
  })
  .catch(error => console.log(error));
};

var scrapeSingleMovie = function(path){
  return $get("http://www.imfdb.org"+path)
  .then(response => {
    $ = cheerio.load(response.body);
    var contentDiv = $("#mw-content-text");

    var description = contentDiv.text().slice(0, contentDiv.text().indexOf("Contents")).trim();

    var weaponList = [];
    var weapons = $("h2 > .mw-headline");
    weapons.each((i, element) => {
      var name = $(element).text().trim();
      var underscoreName = name.replace(/ /g, "_");
      weaponList.push(name);
    })

    return weaponList;

  })
  .catch(error => {
    //console.log(error)
    process.stdout.write(`ERROR(${path})`);
    errores++;
  });
}

var getWeaponsFromMovies = function(){
  var p = Q.fcall(() => true);
  movieList.forEach((movie, i) => {
    p = p.then(()=>{
      return scrapeSingleMovie(movie.path)
      .then(weapons => {
        movie.weapons = weapons;
        process.stdout.write("+");
        if(i % 50 == 0) process.stdout.write(`[${parseInt(100*i/4950.0)}%]`);
        return true;
      });
    });
  });
  p.then(function(){
    console.log("DONE w/ "+errores+" errors");
    fs.writeFile("./output.json", JSON.stringify(movieList, null, 2));
  });
}

//FASE 1, obtener los enlaces a todas las peliculas...
scrapeMoviesList("/wiki/Category:Movie");

//scrapeSingleMovie("/wiki/Winter_in_Wartime");
