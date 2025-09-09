import axios from 'axios';

const BASE_URL = 'http://localhost:4000/api/v1';
let authToken = '';
let orderId = '';
let cartId = '';

const testData = {
  user: {
    email: 'test@example.com',
    password: 'password123'
  },
  product: {
    title: 'Test Product',
    price: 25000,
    finalPrice: 20000
  },
  shippingAddress: {
    fullName: 'John Doe',
    phone: '+256700123456',
    address: 'Plot 123, Kampala Road',
    city: 'Kampala',
    district: 'Central',
    country: 'Uganda'
  },
  paymentDetails: {
    method: 'mtn_mobile_money',
    phoneNumber: '+256700123456'
  }
};

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    const loginResponse = await makeRequest('POST', '/auth/login', testData.user);
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Login failed, trying registration...');
    
    try {
      const registerResponse = await makeRequest('POST', '/auth/register', {
        ...testData.user,
        firstName: 'John',
        lastName: 'Doe'
      });
      authToken = registerResponse.data.token;
      console.log('✅ Registration successful');
      return true;
    } catch (regError) {
      console.log('❌ Registration failed');
      return false;
    }
  }
}

async function testPaymentMethods() {
  console.log('\n💳 Testing Payment Methods...');
  
  try {
    const response = await makeRequest('GET', '/orders/payment/methods', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('✅ Payment methods retrieved:', response.data.length, 'methods available');
    response.data.forEach(method => {
      console.log(`   - ${method.name}: ${method.description}`);
    });
    return true;
  } catch (error) {
    console.log('❌ Failed to get payment methods');
    return false;
  }
}

async function testDirectOrder() {
  console.log('\n🛒 Testing Direct Order Creation...');
  
  try {
    const response = await makeRequest('POST', '/orders/direct-buy', {
      productId: '507f1f77bcf86cd799439011',
      quantity: 2,
      shippingAddress: testData.shippingAddress,
      paymentDetails: testData.paymentDetails,
      notes: 'Test direct order'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    orderId = response.data._id;
    console.log('✅ Direct order created:', response.data.orderNumber);
    console.log('   Order ID:', orderId);
    console.log('   Total Amount:', response.data.pricing.totalAmount, 'UGX');
    return true;
  } catch (error) {
    console.log('❌ Failed to create direct order');
    return false;
  }
}

async function testCartOrder() {
  console.log('\n🛒 Testing Cart Order Creation...');
  
  try {
    const addToCartResponse = await makeRequest('POST', '/cart/add', {
      productId: '507f1f77bcf86cd799439011',
      quantity: 1,
      variantId: 1
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('✅ Item added to cart');
    
    const checkoutResponse = await makeRequest('POST', '/orders/cart/checkout', {
      shippingAddress: testData.shippingAddress,
      paymentDetails: testData.paymentDetails,
      notes: 'Test cart order'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    orderId = checkoutResponse.data._id;
    console.log('✅ Cart order created:', checkoutResponse.data.orderNumber);
    console.log('   Order ID:', orderId);
    console.log('   Total Amount:', checkoutResponse.data.pricing.totalAmount, 'UGX');
    return true;
  } catch (error) {
    console.log('❌ Failed to create cart order');
    return false;
  }
}

async function testPaymentInitiation() {
  console.log('\n💸 Testing Payment Initiation...');
  
  try {
    const response = await makeRequest('POST', `/orders/${orderId}/payment/initiate`, {
      paymentMethod: 'mtn_mobile_money',
      phoneNumber: '+256700123456'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('✅ Payment initiated successfully');
    console.log('   Transaction ID:', response.data.transactionId);
    console.log('   Payment Method:', response.data.paymentMethod);
    console.log('   Amount:', response.data.amount, 'UGX');
    console.log('   Status:', response.data.status);
    
    if (response.data.instructions) {
      console.log('   Instructions:');
      response.data.instructions.steps.forEach((step, index) => {
        console.log(`     ${index + 1}. ${step}`);
      });
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to initiate payment');
    return false;
  }
}

async function testPaymentVerification() {
  console.log('\n✅ Testing Payment Verification...');
  
  try {
    const response = await makeRequest('POST', `/orders/${orderId}/payment/verify`, {}, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('✅ Payment verification completed');
    console.log('   Payment Status:', response.data.paymentStatus);
    console.log('   Order Status:', response.data.orderStatus);
    console.log('   Transaction ID:', response.data.transactionId);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to verify payment');
    return false;
  }
}

async function testGetOrder() {
  console.log('\n📋 Testing Get Order Details...');
  
  try {
    const response = await makeRequest('GET', `/orders/${orderId}`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('✅ Order details retrieved');
    console.log('   Order Number:', response.data.orderNumber);
    console.log('   Status:', response.data.status);
    console.log('   Payment Status:', response.data.paymentDetails.paymentStatus);
    console.log('   Total Amount:', response.data.pricing.totalAmount, 'UGX');
    console.log('   Items Count:', response.data.items.length);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to get order details');
    return false;
  }
}

async function testGetUserOrders() {
  console.log('\n📋 Testing Get User Orders...');
  
  try {
    const response = await makeRequest('GET', '/orders/my-orders?page=1&limit=5', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('✅ User orders retrieved');
    console.log('   Total Orders:', response.data.pagination.totalOrders);
    console.log('   Current Page:', response.data.pagination.currentPage);
    console.log('   Orders in this page:', response.data.orders.length);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to get user orders');
    return false;
  }
}

async function testOrderCancellation() {
  console.log('\n❌ Testing Order Cancellation...');
  
  try {
    const response = await makeRequest('PATCH', `/orders/${orderId}/cancel`, {
      reason: 'Testing cancellation functionality'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('✅ Order cancelled successfully');
    console.log('   New Status:', response.data.status);
    console.log('   Cancellation Reason:', response.data.cancellationReason);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to cancel order');
    return false;
  }
}

async function testOrderStats() {
  console.log('\n📊 Testing Order Statistics...');
  
  try {
    const response = await makeRequest('GET', '/orders/admin/stats', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('✅ Order statistics retrieved');
    console.log('   Total Orders:', response.data.overview.totalOrders);
    console.log('   Total Revenue:', response.data.overview.totalRevenue, 'UGX');
    console.log('   Pending Orders:', response.data.overview.pendingOrders);
    console.log('   Completed Orders:', response.data.overview.completedOrders);
    console.log('   Cancelled Orders:', response.data.overview.cancelledOrders);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to get order statistics');
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Order API Tests...\n');
  
  const tests = [
    { name: 'Authentication', fn: testAuth },
    { name: 'Payment Methods', fn: testPaymentMethods },
    { name: 'Direct Order', fn: testDirectOrder },
    { name: 'Cart Order', fn: testCartOrder },
    { name: 'Payment Initiation', fn: testPaymentInitiation },
    { name: 'Payment Verification', fn: testPaymentVerification },
    { name: 'Get Order Details', fn: testGetOrder },
    { name: 'Get User Orders', fn: testGetUserOrders },
    { name: 'Order Cancellation', fn: testOrderCancellation },
    { name: 'Order Statistics', fn: testOrderStats }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test failed with error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Order system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

runAllTests().catch(console.error);
