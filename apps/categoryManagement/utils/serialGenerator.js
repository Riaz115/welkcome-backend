import PrimeCategory from '../models/PrimeCategory.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

/**
 * Generate a random serial number with the format: 2-3 letters + 4-6 numbers
 * @returns {string} Generated serial number (e.g., "ABC12345")
 */
export const generateSerialNumber = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // Generate 2-3 random letters
  let serialLetters = '';
  const letterCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 letters
  for (let i = 0; i < letterCount; i++) {
    serialLetters += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Generate 4-6 random numbers
  let serialNumbers = '';
  const numberCount = Math.floor(Math.random() * 3) + 4; // 4 to 6 numbers
  for (let i = 0; i < numberCount; i++) {
    serialNumbers += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return serialLetters + serialNumbers;
};

/**
 * Generate a unique serial number by checking against all category collections
 * @param {number} maxAttempts Maximum number of attempts to generate unique serial
 * @returns {Promise<string>} Unique serial number
 */
export const generateUniqueSerialNumber = async (maxAttempts = 20) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const serialNumber = generateSerialNumber();

    // Check if serial number exists in any collection
    const [primeExists, categoryExists, subcategoryExists] = await Promise.all([
      PrimeCategory.findOne({ serialNumber }),
      Category.findOne({ serialNumber }),
      Subcategory.findOne({ serialNumber })
    ]);

    if (!primeExists && !categoryExists && !subcategoryExists) {
      return serialNumber;
    }

    attempts++;
  }

  throw new Error('Unable to generate unique serial number after maximum attempts');
};

/**
 * Validate serial number format
 * @param {string} serialNumber Serial number to validate
 * @returns {boolean} True if valid format
 */
export const validateSerialNumber = (serialNumber) => {
  if (serialNumber === undefined || serialNumber === null) return false;
  const value = String(serialNumber).trim().toUpperCase();
  const regex = /^[A-Z]{2,3}[0-9]{4,6}$/;
  return regex.test(value);
};

/**
 * Check if serial number is unique across all collections
 * @param {string} serialNumber Serial number to check
 * @param {string} excludeId ID to exclude from check (for updates)
 * @param {string} modelType Type of model ('prime', 'category', 'subcategory')
 * @returns {Promise<boolean>} True if unique
 */
export const isSerialNumberUnique = async (serialNumber, excludeId = null, modelType = null) => {
  const value = String(serialNumber).trim().toUpperCase();

  const queries = [];

  // PrimeCategory
  const primeQuery = { serialNumber: value };
  if (modelType === 'prime' && excludeId) {
    primeQuery._id = { $ne: excludeId };
  }
  queries.push(PrimeCategory.findOne(primeQuery));

  // Category
  const categoryQuery = { serialNumber: value };
  if (modelType === 'category' && excludeId) {
    categoryQuery._id = { $ne: excludeId };
  }
  queries.push(Category.findOne(categoryQuery));

  // Subcategory
  const subcategoryQuery = { serialNumber: value };
  if (modelType === 'subcategory' && excludeId) {
    subcategoryQuery._id = { $ne: excludeId };
  }
  queries.push(Subcategory.findOne(subcategoryQuery));

  const results = await Promise.all(queries);
  return !results.some(result => result !== null);
};
