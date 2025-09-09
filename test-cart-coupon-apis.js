// Test script for Cart and Coupon APIs
// Run this script to test the APIs: node test-cart-coupon-apis.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api/v1';
let authToken = '';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testProduct = {
  productId: '507f1f77bcf86cd799439011', // Replace with actual product ID
  variantId: 1,
  quantity: 2
};

const testCoupon = {
  code: 'SAVE20',
  name: '20% Off Sale',
  description: 'Get 20% off on all items',
  discountType: 'percentage',
  discountValue: 20,
  minOrderAmount: 100,
  usageLimit: 1000,
  userUsageLimit: 1,
  validFrom: new Date().toISOString(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, useAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`${method} ${endpoint}:`, response.status, data);
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error calling ${method} ${endpoint}:`, error.message);
    return { status: 500, data: { error: error.message } };
  }
}

// Test functions
async function testAuth() {
  console.log('\n=== Testing Authentication ===');
  
  // Try to login (you'll need to create a test user first)
  const loginResult = await apiCall('/auth/login', 'POST', testUser, false);
  
  if (loginResult.status === 200 && loginResult.data.success) {
    authToken = loginResult.data.data.token;
    console.log('✅ Authentication successful');
    return true;
  } else {
    console.log('❌ Authentication failed - you may need to create a test user first');
    return false;
  }
}

async function testCartAPIs() {
  console.log('\n=== Testing Cart APIs ===');
  
  // Get cart
  await apiCall('/cart');
  
  // Add item to cart
  await apiCall('/cart/add', 'POST', testProduct);
  
  // Get cart again to see the added item
  await apiCall('/cart');
  
  // Update item quantity
  await apiCall('/cart/update', 'PUT', {
    ...testProduct,
    quantity: 3
  });
  
  // Get cart to see updated quantity
  await apiCall('/cart');
}

async function testCouponAPIs() {
  console.log('\n=== Testing Coupon APIs ===');
  
  // Get available coupons (public endpoint)
  await apiCall('/coupons/available', 'GET', null, false);
  
  // Validate coupon code (public endpoint)
  await apiCall('/coupons/validate', 'POST', {
    couponCode: 'SAVE20',
    orderAmount: 200
  }, false);
  
  // Create coupon (admin only)
  await apiCall('/coupons', 'POST', testCoupon);
  
  // Get all coupons
  await apiCall('/coupons');
  
  // Apply coupon to cart
  await apiCall('/cart/apply-coupon', 'POST', {
    couponCode: 'SAVE20'
  });
  
  // Get cart to see applied coupon
  await apiCall('/cart');
  
  // Remove coupon from cart
  await apiCall('/cart/remove-coupon', 'DELETE');
  
  // Get cart to see coupon removed
  await apiCall('/cart');
}

async function testCartManagement() {
  console.log('\n=== Testing Cart Management ===');
  
  // Remove item from cart
  await apiCall('/cart/remove', 'DELETE', {
    productId: testProduct.productId,
    variantId: testProduct.variantId
  });
  
  // Get cart to see item removed
  await apiCall('/cart');
  
  // Clear entire cart
  await apiCall('/cart/clear', 'DELETE');
  
  // Get cart to see it's empty
  await apiCall('/cart');
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Cart and Coupon API Tests...\n');
  
  try {
    // Test authentication first
    const authSuccess = await testAuth();
    
    if (authSuccess) {
      // Test cart APIs
      await testCartAPIs();
      
      // Test coupon APIs
      await testCouponAPIs();
      
      // Test cart management
      await testCartManagement();
      
      console.log('\n✅ All tests completed!');
    } else {
      console.log('\n⚠️  Skipping authenticated tests due to authentication failure');
      console.log('Please create a test user first or check your authentication setup');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests, apiCall, testAuth, testCartAPIs, testCouponAPIs };
