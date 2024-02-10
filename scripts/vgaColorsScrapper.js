/* eslint-disable */
/** @see {@link https://www.fountainware.com/EXPL/vgapalette.png} */

(() => {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var img = document.querySelector('img');
  canvas.width = img.width;
  canvas.height = img.height;
  context.drawImage(img, 0, 0);
  var myData = context.getImageData(0, 0, img.width, img.height).data;

  var a = [];
  var start_x = 48;
  var start_y = 42;
  for (let y = 0; y < 16; ++y) {
    for (let x = 0; x < 16; ++x) {
      a.push(
        (myData[(start_y + y * 30) * 4 * img.width + (start_x + x * 30) * 4] << 16) |
          (myData[(start_y + y * 30) * 4 * img.width + (start_x + x * 30) * 4 + 1] << 8) |
          (myData[(start_y + y * 30) * 4 * img.width + (start_x + x * 30) * 4 + 2] << 0),
      );
    }
  }

  return JSON.stringify(a.map(a => `0x${a.toString(16).padStart(6, '0')}`))
    .replace(/\"\,\"/g, ', ')
    .replace(/"/g, '');
})();
