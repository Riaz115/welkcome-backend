import Order from '../models/orderModel.js';
import paymentService from '../services/paymentService.js';

export const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, phoneNumber } = req.body;

    if (!paymentMethod || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Payment method and phone number are required'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentDetails.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this order'
      });
    }

    const formattedPhone = paymentService.formatPhoneNumber(phoneNumber);
    
    if (!paymentService.validatePhoneNumber(formattedPhone, paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number for selected payment method'
      });
    }

    const paymentResult = await paymentService.processPayment(
      paymentMethod,
      formattedPhone,
      order.pricing.totalAmount,
      order.orderNumber,
      'UGX'
    );

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment initiation failed',
        error: paymentResult.error
      });
    }

    order.paymentDetails.method = paymentMethod;
    order.paymentDetails.phoneNumber = formattedPhone;
    order.paymentDetails.transactionId = paymentResult.transactionId;
    order.paymentDetails.paymentStatus = 'processing';
    order.paymentDetails.amount = order.pricing.totalAmount;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        orderId: order._id,
        transactionId: paymentResult.transactionId,
        paymentMethod: paymentMethod,
        amount: order.pricing.totalAmount,
        currency: 'UGX',
        status: 'processing',
        instructions: getPaymentInstructions(paymentMethod, formattedPhone, order.pricing.totalAmount)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error initiating payment',
      error: error.message
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!order.paymentDetails.transactionId) {
      return res.status(400).json({
        success: false,
        message: 'No transaction ID found for this order'
      });
    }

    const statusResult = await paymentService.checkPaymentStatus(
      order.paymentDetails.method,
      order.paymentDetails.transactionId
    );

    if (!statusResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Error checking payment status',
        error: statusResult.error
      });
    }

    const paymentStatus = mapPaymentStatus(statusResult.status);
    
    if (paymentStatus === 'completed') {
      await order.updatePaymentStatus('completed', order.paymentDetails.transactionId);
    } else if (paymentStatus === 'failed') {
      await order.updatePaymentStatus('failed');
    }

    res.status(200).json({
      success: true,
      message: 'Payment status verified',
      data: {
        orderId: order._id,
        paymentStatus: order.paymentDetails.paymentStatus,
        orderStatus: order.status,
        transactionId: order.paymentDetails.transactionId
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

export const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'mtn_mobile_money',
        name: 'MTN Mobile Money',
        description: 'Pay using your MTN Mobile Money account',
        icon: 'mtn-logo',
        supportedNetworks: ['25677', '25678'],
        processingTime: 'Instant',
        fees: 'No additional fees'
      },
      {
        id: 'airtel_money',
        name: 'Airtel Money',
        description: 'Pay using your Airtel Money account',
        icon: 'airtel-logo',
        supportedNetworks: ['25670', '25675'],
        processingTime: 'Instant',
        fees: 'No additional fees'
      },
      {
        id: 'cash_on_delivery',
        name: 'Cash on Delivery',
        description: 'Pay when your order is delivered',
        icon: 'cash-icon',
        processingTime: 'On delivery',
        fees: 'No additional fees'
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Transfer directly to our bank account',
        icon: 'bank-icon',
        processingTime: '1-3 business days',
        fees: 'Bank charges may apply'
      }
    ];

    res.status(200).json({
      success: true,
      data: paymentMethods
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment methods',
      error: error.message
    });
  }
};

export const webhookPayment = async (req, res) => {
  try {
    const { transactionId, status, orderId, amount, currency } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and status are required'
      });
    }

    let order;
    
    if (orderId) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ 
        'paymentDetails.transactionId': transactionId 
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (amount && order.pricing.totalAmount !== amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch'
      });
    }

    const paymentStatus = mapPaymentStatus(status);
    
    if (paymentStatus === 'completed') {
      await order.updatePaymentStatus('completed', transactionId);
    } else if (paymentStatus === 'failed') {
      await order.updatePaymentStatus('failed');
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentDetails.paymentStatus,
        orderStatus: order.status
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

function mapPaymentStatus(providerStatus) {
  const statusMap = {
    'SUCCESSFUL': 'completed',
    'SUCCESS': 'completed',
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'FAILURE': 'failed',
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'CANCELLED': 'failed',
    'TIMEOUT': 'failed'
  };

  return statusMap[providerStatus] || 'pending';
}

function getPaymentInstructions(method, phoneNumber, amount) {
  const instructions = {
    mtn_mobile_money: {
      title: 'MTN Mobile Money Payment',
      steps: [
        'You will receive a popup on your phone',
        'Enter your MTN Mobile Money PIN',
        'Confirm the payment',
        'Wait for confirmation message'
      ],
      amount: `UGX ${amount.toLocaleString()}`,
      phone: phoneNumber
    },
    airtel_money: {
      title: 'Airtel Money Payment',
      steps: [
        'You will receive a popup on your phone',
        'Enter your Airtel Money PIN',
        'Confirm the payment',
        'Wait for confirmation message'
      ],
      amount: `UGX ${amount.toLocaleString()}`,
      phone: phoneNumber
    },
    cash_on_delivery: {
      title: 'Cash on Delivery',
      steps: [
        'Your order will be prepared',
        'Our delivery team will contact you',
        'Pay the exact amount when delivered',
        'Keep the receipt for your records'
      ],
      amount: `UGX ${amount.toLocaleString()}`,
      note: 'No advance payment required'
    },
    bank_transfer: {
      title: 'Bank Transfer',
      steps: [
        'Transfer the exact amount to our account',
        'Include your order number in the reference',
        'Send us the transfer receipt',
        'We will confirm payment within 24 hours'
      ],
      amount: `UGX ${amount.toLocaleString()}`,
      accountDetails: {
        bank: 'Bank of Uganda',
        accountNumber: '1234567890',
        accountName: 'Welkome Uganda Ltd'
      }
    }
  };

  return instructions[method] || null;
}
