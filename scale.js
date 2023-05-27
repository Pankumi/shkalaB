const math = require('mathjs');

// створюю шкалу потрібне початкове значення, максимальне значення, розмір кроку у відсотках

function createScaleArray(scaleStart, scaleEnd, scaleStep) {
  const scale = [];
  let currentValue = scaleStart;

  while (currentValue <= scaleEnd) {
    scale.push( math.round(currentValue, 8) );
    currentValue = math.evaluate(`${currentValue} + (${currentValue} * ${scaleStep / 100})`);
  }

  return scale;
}

module.exports = createScaleArray;