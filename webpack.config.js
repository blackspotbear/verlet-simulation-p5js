const path = require('path');

module.exports = {
  mode: 'development',
  entry: './js/sketch.js',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'public/js')
  }
};
