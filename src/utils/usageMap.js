// utils/usageMap.js

module.exports = {
  Category: [
    { model: 'Subcategory', field: 'category', label: 'subcategories' },
    { model: 'Review', field: 'category', label: 'reviews' },
    { model: 'TechNews', field: 'category', label: 'tech news' }
  ],
  Subcategory: [
    { model: 'Review', field: 'subcategory', label: 'reviews' },
     { model: 'TechNews', field: 'category', label: 'tech news' }
  ]
};
