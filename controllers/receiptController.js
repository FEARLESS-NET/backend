// controllers/receiptController.js
import Order from "../models/Order.js";

// RESTORAN MA'LUMOTLARI
const RESTAURANT = {
  name: "QOZONDA",
  address: "Toshkent shahri, Bog'ishamol ko'chasi 15",
  phone: "+998 90 123 45 67",
  website: "qozonda.uz",
  taxId: "123456789",
};

// HTML shablon - chiroyli dizaynli chek
const generateReceiptHTML = (order, receiptNumber) => {
  const now = new Date();
  const dateStr = now.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const deliveryTypeMap = {
    "dine-in": "🍽 Restoran",
    "takeaway": "🥡 Olib ketish",
    "delivery": "🚚 Yetkazish"
  };

  const statusMap = {
    "pending": "⏳ Kutilmoqda",
    "confirmed": "✅ Tasdiqlandi",
    "preparing": "👨‍🍳 Tayyorlanmoqda",
    "ready": "🎉 Tayyor",
    "cancelled": "❌ Bekor qilingan"
  };

  const totalSum = order.totalPrice || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let itemsHTML = '';
  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    itemsHTML += `
      <tr>
        <td style="padding: 6px 4px; border-bottom: 1px solid #3a3a3a; font-size: 13px;">${index + 1}.</td>
        <td style="padding: 6px 4px; border-bottom: 1px solid #3a3a3a; font-size: 13px;">${item.name || 'Taom'}</td>
        <td style="padding: 6px 4px; border-bottom: 1px solid #3a3a3a; font-size: 13px; text-align: center;">${item.quantity}</td>
        <td style="padding: 6px 4px; border-bottom: 1px solid #3a3a3a; font-size: 13px; text-align: right;">${(item.price || 0).toLocaleString()}</td>
        <td style="padding: 6px 4px; border-bottom: 1px solid #3a3a3a; font-size: 13px; text-align: right;">${itemTotal.toLocaleString()}</td>
      </tr>
    `;
  });

  let extraInfo = '';
  if (order.deliveryType === 'dine-in') {
    extraInfo += `<p>🪑 Stol №${order.tableNumber || 'Belgilanmagan'}${order.tableLocation ? ` (${order.tableLocation})` : ''}</p>`;
  }
  if (order.deliveryType === 'delivery' && order.address) {
    extraInfo += `<p>📍 Manzil: ${order.address}</p>`;
  }
  if (order.note) {
    extraInfo += `<p>📝 Izoh: ${order.note}</p>`;
  }
  if (order.courierName) {
    extraInfo += `<p>🚚 Kuryer: ${order.courierName} ${order.courierPhone ? `(${order.courierPhone})` : ''}</p>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Chek №${receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #1a1a1a;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .receipt {
      max-width: 400px;
      width: 100%;
      background: #ffffff;
      border-radius: 12px;
      padding: 25px 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.8);
      border: 2px solid #d4a843;
    }
    .receipt-header {
      text-align: center;
      border-bottom: 2px dashed #d4a843;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .receipt-header h1 {
      font-size: 26px;
      font-weight: 900;
      color: #b8860b;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .receipt-header .subtitle {
      font-size: 11px;
      color: #888;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .receipt-header .divider {
      border: none;
      border-top: 2px dashed #d4a843;
      margin: 8px 0;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
      margin-bottom: 4px;
    }
    .receipt-title {
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      color: #333;
      margin: 8px 0;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .customer-info {
      background: #f8f4ec;
      border-radius: 8px;
      padding: 10px 12px;
      margin: 8px 0 12px;
      font-size: 12px;
      border-left: 4px solid #d4a843;
    }
    .customer-info p {
      margin: 2px 0;
      color: #333;
    }
    .customer-info .label {
      color: #888;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 12px;
    }
    table th {
      background: #f8f4ec;
      color: #555;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 6px 4px;
      border-bottom: 2px solid #d4a843;
      text-align: left;
    }
    table th:last-child,
    table td:last-child {
      text-align: right;
    }
    table td {
      padding: 5px 4px;
      border-bottom: 1px solid #eee;
      color: #333;
    }
    .total-row {
      background: #f8f4ec;
      border-top: 3px double #d4a843;
      font-weight: 700;
    }
    .total-row td {
      font-size: 15px;
      padding: 10px 4px;
      border: none;
    }
    .total-row td:last-child {
      color: #b8860b;
      font-size: 17px;
    }
    .receipt-footer {
      text-align: center;
      border-top: 2px dashed #d4a843;
      padding-top: 12px;
      margin-top: 12px;
      font-size: 11px;
      color: #888;
    }
    .receipt-footer .thanks {
      font-size: 15px;
      font-weight: 700;
      color: #b8860b;
      margin-bottom: 4px;
    }
    .receipt-footer .address {
      font-size: 10px;
      color: #999;
      margin-top: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 1px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      background: #f0f0f0;
      color: #555;
    }
    .status-badge.ready { background: #d4edda; color: #155724; }
    .status-badge.confirmed { background: #cce5ff; color: #004085; }
    .status-badge.preparing { background: #fff3cd; color: #856404; }
    .status-badge.pending { background: #f8f9fa; color: #6c757d; }
    .status-badge.cancelled { background: #f8d7da; color: #721c24; }
    .delivery-info {
      font-size: 12px;
      color: #555;
      margin: 5px 0;
      padding: 6px 10px;
      background: #f8f4ec;
      border-radius: 6px;
    }
    .delivery-info span {
      font-weight: 600;
      color: #b8860b;
    }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; border: 1px solid #ddd; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt" id="receipt-content">
    <div class="receipt-header">
      <h1>QOZONDA</h1>
      <div class="subtitle">★ Milliy Taomlar ★</div>
      <hr class="divider">
      <div class="receipt-info">
        <span>📞 ${RESTAURANT.phone}</span>
        <span>🕐 ${dateStr}</span>
      </div>
      <div class="receipt-info">
        <span>📍 ${RESTAURANT.address}</span>
        <span>#${receiptNumber}</span>
      </div>
    </div>

    <div class="receipt-title">🧾 TO'LOV CHEKI</div>

    <div class="customer-info">
      <p><span class="label">👤 Mijoz:</span> ${order.customerName || '---'}</p>
      <p><span class="label">📞 Telefon:</span> ${order.phone || '---'}</p>
      <p><span class="label">📦 Tur:</span> ${deliveryTypeMap[order.deliveryType] || order.deliveryType}</p>
      <p><span class="label">📊 Holat:</span> <span class="status-badge ${order.status}">${statusMap[order.status] || order.status}</span></p>
      <p><span class="label">💳 To'lov:</span> ${order.paymentMethod ? (order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)) : 'Naqd'} ${order.paymentStatus === 'paid' ? '✅' : '⏳'}</p>
      ${extraInfo ? `<div class="delivery-info">${extraInfo}</div>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Taom</th>
          <th style="text-align:center;">Soni</th>
          <th style="text-align:right;">Narxi</th>
          <th style="text-align:right;">Jami</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
        <tr class="total-row">
          <td colspan="4" style="text-align:right;">JAMI:</td>
          <td>${totalSum.toLocaleString()} so'm</td>
        </tr>
      </tbody>
    </table>

    <div class="receipt-footer">
      <div class="thanks">🌟 QOZONDA dan RAXMAT! 🌟</div>
      <p>Tashrifingiz uchun minnatdormiz!</p>
      <p class="address">📍 ${RESTAURANT.address}</p>
      <p>📞 ${RESTAURANT.phone} | 🌐 ${RESTAURANT.website}</p>
      <p style="margin-top:4px; font-size:9px; color:#aaa;">INN: ${RESTAURANT.taxId}</p>
    </div>
  </div>
</body>
</html>
  `;
};

// ===== CHEK HTML NI QAYTARISH (Modal uchun) =====
export const getReceiptHTML = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID kiritilishi shart" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    }

    const receiptNumber = `CHK-${Date.now().toString().slice(-8)}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const html = generateReceiptHTML(order, receiptNumber);

    res.json({
      success: true,
      html,
      receiptNumber,
      order: {
        id: order._id,
        customerName: order.customerName,
        totalPrice: order.totalPrice
      }
    });

  } catch (error) {
    console.error('❌ Chek HTML yaratish xatosi:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Chek yaratishda xatolik yuz berdi'
    });
  }
};

// ===== CHEKNI PDF QILIB YUKLAB OLISH (Qo'shimcha) =====
export const downloadReceiptPDF = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID kiritilishi shart" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Zakaz topilmadi" });
    }

    const receiptNumber = `CHK-${Date.now().toString().slice(-8)}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const html = generateReceiptHTML(order, receiptNumber);

    // HTML ni qaytarish - frontend o'zi PDF ga aylantirsin yoki chop qilsin
    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('❌ Chek yuklash xatosi:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Chek yuklashda xatolik yuz berdi'
    });
  }
};