// Mock Payment Gateway service
exports.processPayment = async ({ amount, method, bookingId }) => {
  const validMethods = ['credit_card', 'debit_card', 'qr_code'];

  if (!validMethods.includes(method) || amount < 0) {
    return {
      success: false,
      message: 'Payment declined by payment gateway',
    };
  }

  return {
    success: true,
    transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    paidAt: new Date(),
  };
};
