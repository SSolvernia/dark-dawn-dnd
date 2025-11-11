/**
 * Book selection utilities
 * Handle which sourcebooks are being used
 * Ported from original char-gen-script.js
 */

/**
 * Get list of selected books from checkboxes
 * @param {Object} booksData - Books data with availableBooks array
 * @returns {Array} Array of selected book codes
 */
export function getUsedBooks(booksData) {
  const usedBooks = ['Real', 'PHB']; // Always include Real and PHB

  if (!booksData || !booksData.availableBooks) return usedBooks;

  // Check each book checkbox
  for (let bookNum = 0; bookNum < booksData.availableBooks.length; bookNum++) {
    let book = booksData.availableBooks[bookNum];
    const checkbox = document.getElementById(book + 'box');
    if (checkbox && checkbox.checked) {
      usedBooks.push(book);
    }
  }

  return usedBooks;
}

/**
 * Check if a special string includes any of the used books
 * @param {string} specialString - Special string with book references
 * @param {Array} usedBooks - List of used books
 * @returns {boolean} True if book is available
 */
export function checkBookSpecial(specialString, usedBooks) {
  let splitSpecial = specialString.split(' ');
  for (let specialIndex = 0; specialIndex < splitSpecial.length; specialIndex++) {
    if (splitSpecial[specialIndex].slice(0, 5) == 'book-')
      return checkBookString(splitSpecial[specialIndex].slice(5), usedBooks);
  }
  return false;
}

/**
 * Check if a book string matches any used book
 * @param {string} bookString - Book identifier(s)
 * @param {Array} usedBooks - List of used books
 * @returns {boolean} True if book is available
 */
export function checkBookString(bookString, usedBooks) {
  for (let index = 0; index < usedBooks.length; index++) {
    if (bookString.includes(usedBooks[index])) return true;
  }
  return false;
}
