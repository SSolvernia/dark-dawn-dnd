/**
 * Random utility functions
 * Ported from original char-gen-script.js
 */

const Random = {
  /**
   * Generate random number between 0 and max-1
   * @param {number} max - Maximum value (exclusive)
   * @returns {number} Random integer
   */
  Num: function (max) {
    return Math.floor(Math.random() * max);
  },

  /**
   * Pick a random element from an array
   * @param {Array} arr - Array to pick from
   * @returns {*} Random element
   */
  Array: function (arr) {
    return arr[this.Num(arr.length)];
  },

  /**
   * Pick multiple unique random elements from an array
   * @param {Array} arr - Array to pick from
   * @param {number} num - Number of elements to pick
   * @returns {string} Comma-separated string of selected elements
   */
  ArrayMultiple: function (arr, num) {
    let returnArray = [];
    while (returnArray.length < num) {
      let item = this.Array(arr);
      if (!returnArray.includes(item)) returnArray.push(item);
    }
    return returnArray.join(', ');
  },

  /**
   * Roll dice based on dice notation (e.g., '2d6', '1d20')
   * @param {string} roll - Dice notation string
   * @returns {number} Total rolled value
   */
  DiceRoll: function (roll) {
    let numbers = roll.split('d');
    if (numbers.length == 1) return parseInt(numbers[0]);
    let total = 0;
    for (let die = 0; die < numbers[0]; die++) total += this.Num(numbers[1]) + 1;
    return total;
  },
};

export default Random;
