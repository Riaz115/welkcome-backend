import axios from 'axios';

class PaymentService {
  constructor() {
    this.mtnApiUrl = process.env.MTN_MOBILE_MONEY_API_URL || 'https://sandbox.momodeveloper.mtn.com';
    this.airtelApiUrl = process.env.AIRTEL_MONEY_API_URL || 'https://openapiuat.airtel.africa';
    this.mtnApiKey = process.env.MTN_API_KEY;
    this.airtelApiKey = process.env.AIRTEL_API_KEY;
  }

  async processMTNPayment(phoneNumber, amount, orderId, currency = 'UGX') {
    try {
      if (!this.mtnApiKey || this.mtnApiKey === 'your-mtn-api-key') {
        return {
          success: true,
          transactionId: `MTN-${orderId}-${Date.now()}`,
          status: 'pending',
          provider: 'mtn_mobile_money',
          data: { mock: true, message: 'Mock MTN payment initiated' }
        };
      }

      const token = await this.getMTNToken();
      
      const paymentData = {
        amount: amount.toString(),
        currency: currency,
        externalId: orderId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber
        },
        payerMessage: `Payment for order ${orderId}`,
        payeeNote: `Order payment - ${orderId}`
      };

      const response = await axios.post(
        `${this.mtnApiUrl}/collection/v1_0/requesttopay`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': 'sandbox',
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        transactionId: response.data.transactionId,
        status: 'pending',
        provider: 'mtn_mobile_money',
        data: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        provider: 'mtn_mobile_money'
      };
    }
  }

  async processAirtelPayment(phoneNumber, amount, orderId, currency = 'UGX') {
    try {
      if (!this.airtelApiKey || this.airtelApiKey === 'your-airtel-api-key') {
        return {
          success: true,
          transactionId: `AIRTEL-${orderId}-${Date.now()}`,
          status: 'pending',
          provider: 'airtel_money',
          data: { mock: true, message: 'Mock Airtel payment initiated' }
        };
      }

      const token = await this.getAirtelToken();
      
      const paymentData = {
        payee: {
          msisdn: phoneNumber
        },
        reference: orderId,
        transaction: {
          amount: amount,
          id: orderId
        }
      };

      const response = await axios.post(
        `${this.airtelApiUrl}/merchant/v1/payments/`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Country': 'UG',
            'X-Currency': currency
          }
        }
      );

      return {
        success: true,
        transactionId: response.data.data.transaction.id,
        status: 'pending',
        provider: 'airtel_money',
        data: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        provider: 'airtel_money'
      };
    }
  }

  async getMTNToken() {
    try {
      const auth = Buffer.from(`${process.env.MTN_SUBSCRIPTION_KEY}:${process.env.MTN_API_SECRET}`).toString('base64');
      
      const response = await axios.post(
        `${this.mtnApiUrl}/collection/token/`,
        {},
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      throw new Error(`MTN Token Error: ${error.message}`);
    }
  }

  async getAirtelToken() {
    try {
      const auth = Buffer.from(`${process.env.AIRTEL_CLIENT_ID}:${process.env.AIRTEL_CLIENT_SECRET}`).toString('base64');
      
      const response = await axios.post(
        `${this.airtelApiUrl}/auth/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      throw new Error(`Airtel Token Error: ${error.message}`);
    }
  }

  async checkMTNPaymentStatus(transactionId) {
    try {
      if (!this.mtnApiKey || this.mtnApiKey === 'your-mtn-api-key') {
        return {
          success: true,
          status: 'SUCCESSFUL',
          data: { mock: true, message: 'Mock payment verification' }
        };
      }

      const token = await this.getMTNToken();
      
      const response = await axios.get(
        `${this.mtnApiUrl}/collection/v1_0/requesttopay/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Environment': 'sandbox'
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async checkAirtelPaymentStatus(transactionId) {
    try {
      if (!this.airtelApiKey || this.airtelApiKey === 'your-airtel-api-key') {
        return {
          success: true,
          status: 'SUCCESSFUL',
          data: { mock: true, message: 'Mock payment verification' }
        };
      }

      const token = await this.getAirtelToken();
      
      const response = await axios.get(
        `${this.airtelApiUrl}/standard/v1/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Country': 'UG'
          }
        }
      );

      return {
        success: true,
        status: response.data.data.transaction.status,
        data: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async processPayment(paymentMethod, phoneNumber, amount, orderId, currency = 'UGX') {
    switch (paymentMethod) {
      case 'mtn_mobile_money':
        return await this.processMTNPayment(phoneNumber, amount, orderId, currency);
      
      case 'airtel_money':
        return await this.processAirtelPayment(phoneNumber, amount, orderId, currency);
      
      case 'cash_on_delivery':
        return {
          success: true,
          transactionId: `COD-${orderId}-${Date.now()}`,
          status: 'pending',
          provider: 'cash_on_delivery'
        };
      
      case 'bank_transfer':
        return {
          success: true,
          transactionId: `BANK-${orderId}-${Date.now()}`,
          status: 'pending',
          provider: 'bank_transfer'
        };
      
      default:
        return {
          success: false,
          error: 'Unsupported payment method'
        };
    }
  }

  async checkPaymentStatus(paymentMethod, transactionId) {
    switch (paymentMethod) {
      case 'mtn_mobile_money':
        return await this.checkMTNPaymentStatus(transactionId);
      
      case 'airtel_money':
        return await this.checkAirtelPaymentStatus(transactionId);
      
      case 'cash_on_delivery':
      case 'bank_transfer':
        return {
          success: true,
          status: 'pending'
        };
      
      default:
        return {
          success: false,
          error: 'Unsupported payment method'
        };
    }
  }

  formatPhoneNumber(phoneNumber) {
    let formatted = phoneNumber.replace(/\D/g, '');
    
    if (formatted.startsWith('0')) {
      formatted = '256' + formatted.substring(1);
    } else if (formatted.startsWith('256')) {
      formatted = formatted;
    } else if (formatted.length === 9) {
      formatted = '256' + formatted;
    }
    
    return formatted;
  }

  validatePhoneNumber(phoneNumber, provider) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    
    if (provider === 'mtn_mobile_money') {
      return formatted.startsWith('25677') || formatted.startsWith('25678');
    } else if (provider === 'airtel_money') {
      return formatted.startsWith('25670') || formatted.startsWith('25675');
    }
    
    return true;
  }
}

export default new PaymentService();
