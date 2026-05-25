export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return res.status(500).json({ error: 'Telegram credentials not configured' });
  }

  try {
    const data = req.body;

    console.log('Prodamus webhook payload:', JSON.stringify(data, null, 2));

    // Escape HTML special chars for Telegram
    function esc(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    const phone = data.customer_phone || 'не указан';
    const email = data.customer_email || 'не указан';
    const sum = data.sum || '—';
    const orderId = data.order_id || data.order_num || '—';
    const status = data.payment_status || 'unknown';
    const statusDesc = data.payment_status_description || '';
    const paymentType = data.payment_type || '';
    const isDemo = data.demo_mode === '1';
    const date = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });

    // Prodamus sends flat keys: "products[0][name]"
    const product = data['products[0][name]'] || 'Неизвестный продукт';

    // Traffic source — Prodamus may pass through URL query params
    const utmSource = data.utm_source || '';
    const utmMedium = data.utm_medium || '';
    const utmCampaign = data.utm_campaign || '';
    const referrer = data.referrer || '';

    const sourceParts = [];
    if (utmSource) sourceParts.push(utmSource);
    if (utmMedium) sourceParts.push(utmMedium);
    if (utmCampaign) sourceParts.push(utmCampaign);
    const sourceStr = sourceParts.length > 0 ? sourceParts.join(' / ') : 'прямой заход';

    let referrerStr = '—';
    if (referrer) {
      try {
        referrerStr = new URL(referrer).hostname;
      } catch (e) {
        referrerStr = referrer;
      }
    }

    const demoLabel = isDemo ? ' ⚠️ ДЕМО' : '';

    const message = [
      `💰 <b>Новая оплата!</b>${demoLabel}`,
      '',
      `📦 <b>Продукт:</b> ${esc(product)}`,
      `💵 <b>Сумма:</b> ${esc(sum)} ₽`,
      `💳 <b>Оплата:</b> ${esc(paymentType)}`,
      `📱 <b>Телефон:</b> ${esc(phone)}`,
      `📧 <b>Email:</b> ${esc(email)}`,
      `🔢 <b>Заказ:</b> ${esc(orderId)}`,
      `✅ <b>Статус:</b> ${esc(statusDesc || status)}`,
      '',
      `📊 <b>Источник:</b> ${esc(sourceStr)}`,
      `🔗 <b>Реферер:</b> ${esc(referrerStr)}`,
      '',
      `⏰ ${date}`
    ].join('\n');

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Telegram API error:', response.status, errorText);
      return res.status(500).json({ error: 'Telegram send failed' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}
