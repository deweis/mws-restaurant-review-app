/* jshint esversion: 6 */
const imagemin = require('imagemin');
const webp = require('imagemin-webp');
const outputFolder = './img';
const JPEGImages = './img/*.jpg';

imagemin([JPEGImages], outputFolder, {
  plugins: [webp({
    quality: 65
  })]
});
