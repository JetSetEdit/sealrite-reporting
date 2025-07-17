const axios = require('axios');
require('dotenv').config();

(async () => {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!accountId || !token) {
    console.error('Missing INSTAGRAM_BUSINESS_ACCOUNT_ID or FACEBOOK_ACCESS_TOKEN in .env');
    process.exit(1);
  }
  const url = `https://graph.facebook.com/v23.0/${accountId}/insights`;
  const params = {
    metric: 'profile_views,website_clicks',
    period: 'day',
    metric_type: 'total_value',
    access_token: token
  };
  try {
    const res = await axios.get(url, { params });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    if (e.response) {
      console.error('API Error:', JSON.stringify(e.response.data, null, 2));
    } else {
      console.error('Error:', e.message);
    }
  }
})(); 