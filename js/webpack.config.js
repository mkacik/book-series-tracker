const path = require('path');

module.exports = {
  entry: './src/App.tsx',
  output: {
    path: path.resolve(__dirname, '../www/static'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.png$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  }
};

