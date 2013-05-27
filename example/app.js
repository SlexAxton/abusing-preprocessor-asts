
/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path');

// Pull out our custom preprocessor
var mycssparser = require('./mycssparser');

// Boring Express stuff
var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 3001);
  app.use(express.favicon());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

// Return our index.html file on the root url
app.get('/', function(req, res) {
  // Set headers for good luck.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(fs.readFileSync('./index.html', 'utf8'));
});

// Set the style data for our
// variables in our preprocessor
var styleData = {
  "bg-color": "#1C3146",
  "border-color": "#425466",
  "app-width": "960px",
  "big-border-radius": "30px",
  "header-color": "#FF8F4F"
};

// Generate CSS on the fly when we hit it
app.get(/(.*)\.css$/, function(req, res) {
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.end(mycssparser.parse(__dirname + req.params + '.mycss', styleData).css);
});

// Generate the CSS data when we hit it
app.get(/(.*)\.css\.json$/, function(req, res) {
  res.json(mycssparser.parse(__dirname + req.params + '.mycss', styleData).data);
});



// Serve the app
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
