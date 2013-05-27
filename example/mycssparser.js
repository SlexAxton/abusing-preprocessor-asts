var rework = require('rework')
  , _ = require('underscore')
  , read = require('fs').readFileSync;

function getVarsBack( css ) {

  // Match locations of our variable delimiter
  var mtchs = css.match( /\/\*VAR: ([^\*]*)\*\//ig );

  // Immediately save a version with them stripped out
  var noCommentCSS = css.replace( / \/\*VAR: [^\*]*\*\//ig, '').replace( /\/\*[^\*]*\*\//ig, '');

  var valid = [];

  // Make sure we have all unique matches (and at least an empty array)
  mtchs = _(mtchs || []).uniq();

  // Go through each match
  mtchs.forEach(function( match ) {
    // Save just the variable name into the valid list of variables
    var trimmed = match.replace('/*VAR: ', '').replace('*/', '');
    valid.push(trimmed);
  });

  var output = {};
  valid.forEach(function( name ) {
    var expr = "/*VAR: "+name+"*/";

    // Find where the entire expression shows up
    while ( ~css.indexOf(expr) ) {

      var loc = css.indexOf(expr);
      var origLoc = loc;

      // Find the beginning of the block that it's in
      while (css[loc] !== '{' && loc > 0) {
        loc--;
      }
      var blockStart = loc;

      // Find then end of the block that it's in
      while(css[loc] !== '}' && loc > 0) {
        loc--;
      }
      var lastBlockEnd = loc;

      // Find the rule end
      loc = origLoc;
      while(css[loc] !== ':' && loc > 0) {
        loc--;
      }
      var ruleKeyEnd = loc;

      // Find the the start of the rule
      while(css[loc] !== ';' && css[loc] !== '{' && css[loc] !== '/' && loc > 0) {
        loc--;
      }
      var ruleKeyStart = loc;

      // Add the variable to the list, make sure it's an array
      output[name] = output[name] || [];

      // Push on the info that we have. Strip out extra symbols and whitespace
      output[name].push({
        selector: css.substr(lastBlockEnd, blockStart-lastBlockEnd)
                                 .replace('}','')
                                 .replace('{','')
                                 .replace(/\s+|\n+/g, ' ')
                                 .trim(),
        rule : css.substr(ruleKeyStart, ruleKeyEnd-ruleKeyStart)
                  .replace(':','')
                  .replace('{','')
                  .replace('/','')
                  .replace(';','')
                  .replace(/\s+|\n+/g, ' ')
                  .trim()
      });

      // Kill the match, but save the length (use a `!` instead of a ` `)
      css = css.replace(expr, "/*VAR:!"+name+"*/");
    }
  });

  // Return both the stripped css, as well as the data block
  return {
    css : noCommentCSS,
    data : output
  };
};

exports.parse = function (filename, data) {
  // Parse the CSS with rework
  var css = rework(read(filename, 'utf8'))
    .use(function (style, test){

      // Go through each declaration
      rework.visit.declarations(style, function(declarations, node){
        // Remember the old variable name
        declarations.forEach(function(decl){
          // Break early if there's no 'var' in the line
          if (!decl.value.match(/\bvar\(/)) return;

          // Get the original variable name from the spot
          var varname = decl.value.replace(/^var\(/, '').replace(/\)$/, '');
          // Put it in the AST in case we need it later
          decl.origVarName = varname;

          // Put the old value back in, but with a note about the original variable name used
          decl.value = decl.value + ' /*VAR: ' + varname + '*/';
        });
      });
    })
    .use(rework.vars(data));

  // Run our parser over the the string output of rework.
  // Which should be the variables in place, but with comments
  // where they used to be.
  return getVarsBack(css.toString());
};
