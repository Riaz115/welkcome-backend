// Test file for Product Search API
// Run this file to test all search functionality

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api/v1/search';

// Test helper function
const testSearch = async (endpoint, params = {}) => {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log(`\n🔍 Testing: ${url.toString()}`);
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Success: ${data.message}`);
      if (data.data.products) {
        console.log(`📦 Found ${data.data.products.length} products`);
        console.log(`📊 Total: ${data.data.pagination?.totalProducts || 0} products`);
      }
      if (data.data.suggestions) {
        console.log(`💡 Found ${data.data.suggestions.length} suggestions`);
      }
    } else {
      console.log(`❌ Error: ${data.message}`);
      if (data.errors) {
        console.log(`🚫 Validation errors:`, data.errors);
      }
    }
  } catch (error) {
    console.log(`💥 Network error: ${error.message}`);
  }
};

// Test all search functionality
const runAllTests = async () => {
  console.log('🚀 Starting Product Search API Tests\n');

  // 1. Basic text search
  await testSearch('', { query: 'shirt' });

  // 2. Price range search
  await testSearch('', { minPrice: 100, maxPrice: 500 });

  // 3. Category search
  await testSearch('', { primeCategory: 'Clothing', category: 'T-Shirts' });

  // 4. Brand search
  await testSearch('', { brand: 'Nike' });

  // 5. Color search
  await testSearch('', { color: 'red' });

  // 6. Size search
  await testSearch('', { size: 'XL' });

  // 7. SKU search
  await testSearch('', { sku: 'NKE' });

  // 8. Discount search
  await testSearch('', { minDiscount: 20, maxDiscount: 50 });

  // 9. Stock search
  await testSearch('', { inStock: true });

  // 10. Complex search
  await testSearch('', {
    query: 'red shirt',
    minPrice: 100,
    maxPrice: 1000,
    color: 'red',
    size: 'XL',
    brand: 'Nike',
    inStock: true,
    sortBy: 'price',
    sortOrder: 'asc'
  });

  // 11. Multiple values search
  await testSearch('', {
    colors: 'red,blue,green',
    sizes: 'S,M,L,XL',
    brands: 'Nike,Adidas'
  });

  // 12. Predefined price range
  await testSearch('', { priceRange: '100-500' });

  // 13. Tags search
  await testSearch('', { tags: 'casual,cotton' });

  // 14. Date range search
  await testSearch('', {
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31'
  });

  // 15. Pagination test
  await testSearch('', { page: 1, limit: 5 });

  // 16. Sorting tests
  await testSearch('', { sortBy: 'title', sortOrder: 'asc' });
  await testSearch('', { sortBy: 'price', sortOrder: 'desc' });
  await testSearch('', { sortBy: 'discount', sortOrder: 'desc' });

  // 17. Quick search (autocomplete)
  await testSearch('/quick', { query: 'red' });
  await testSearch('/quick', { query: 'nike' });
  await testSearch('/quick', { query: 'shirt' });

  // 18. SKU search
  await testSearch('/sku', { sku: 'NKE-RED-XL-001' });
  await testSearch('/sku', { sku: 'NKE', exact: false });

  // 19. Search analytics
  await testSearch('/analytics');
  await testSearch('/analytics', {
    dateFrom: '2024-01-01',
    dateTo: '2024-01-31'
  });

  // 20. Edge cases and error testing
  console.log('\n🧪 Testing Edge Cases and Error Handling\n');

  // Invalid price range
  await testSearch('', { minPrice: 500, maxPrice: 100 });

  // Invalid discount range
  await testSearch('', { minDiscount: 80, maxDiscount: 20 });

  // Invalid date range
  await testSearch('', {
    dateFrom: '2024-12-31',
    dateTo: '2024-01-01'
  });

  // Empty query
  await testSearch('', { query: '' });

  // Very long query
  await testSearch('', { query: 'a'.repeat(300) });

  // Invalid sort field
  await testSearch('', { sortBy: 'invalidField' });

  // Invalid sort order
  await testSearch('', { sortOrder: 'invalid' });

  // Invalid page number
  await testSearch('', { page: -1 });

  // Invalid limit
  await testSearch('', { limit: 200 });

  // Quick search with short query
  await testSearch('/quick', { query: 'a' });

  // SKU search without SKU
  await testSearch('/sku', {});

  console.log('\n🎉 All tests completed!');
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { testSearch, runAllTests };
