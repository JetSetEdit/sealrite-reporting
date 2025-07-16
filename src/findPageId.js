const axios = require('axios');
require('dotenv').config();

async function findPageId() {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN || 'EAAZA87Hg6pVABPFCKvg5KeDvc1XOBcQKBNONMV0WS7vj9vHr2HJFlTZCqtdFcE2sATvpcnAwYtwsPIIpCPEHZBXTsyq9bVa7ZAKoXil4UcdXMewgZB80YgcDnrD407hkMOk9Dw5tyEuOIauQNn7KlulCfltPivNE1ZBMLnLXZCPxWhXgFl5tmQNd2kytP3v48cbUM4vAZAdkZAxhHc5oR1FZCIodwk5SOCnYlDQPcZD';

  console.log('🔍 Finding your Facebook Pages...\n');

  try {
    // Get user's pages
    const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,category,fan_count,followers_count'
      }
    });

    const pages = response.data.data;

    if (pages.length === 0) {
      console.log('❌ No pages found. Make sure your access token has the correct permissions.');
      console.log('Required permissions: pages_read_engagement, pages_show_list');
      return;
    }

    console.log(`✅ Found ${pages.length} page(s):\n`);

    pages.forEach((page, index) => {
      console.log(`${index + 1}. ${page.name}`);
      console.log(`   📄 Page ID: ${page.id}`);
      console.log(`   📂 Category: ${page.category}`);
      console.log(`   👥 Fans: ${page.fan_count || 'N/A'}`);
      console.log(`   👤 Followers: ${page.followers_count || 'N/A'}`);
      console.log('');
    });

    console.log('🚀 To use a page, run:');
    console.log(`npm run fetch ${pages[0].id}`);
    console.log(`npm run report ${pages[0].id} "${pages[0].name}"`);

    // Also check for Instagram Business Accounts
    console.log('\n📸 Checking for Instagram Business Accounts...\n');

    for (const page of pages) {
      try {
        const instagramResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
          params: {
            access_token: accessToken,
            fields: 'instagram_business_account{id,username,media_count,followers_count}'
          }
        });

        const instagramAccount = instagramResponse.data.instagram_business_account;
        
        if (instagramAccount) {
          console.log(`✅ Instagram connected to "${page.name}":`);
          console.log(`   📸 Username: @${instagramAccount.username}`);
          console.log(`   🆔 Instagram Business Account ID: ${instagramAccount.id}`);
          console.log(`   📷 Media Count: ${instagramAccount.media_count}`);
          console.log(`   👤 Followers: ${instagramAccount.followers_count}`);
          console.log('');
        }
      } catch (error) {
        // Instagram not connected or no permissions
      }
    }

  } catch (error) {
    console.error('❌ Error fetching pages:', error.response?.data?.error?.message || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n🔧 Troubleshooting:');
      console.log('- Check that your access token is valid');
      console.log('- Ensure you have the required permissions: pages_read_engagement, pages_show_list');
      console.log('- Try generating a new access token from Graph API Explorer');
    }
  }
}

// Run if this file is executed directly
if (require.main === module) {
  findPageId().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = { findPageId }; 