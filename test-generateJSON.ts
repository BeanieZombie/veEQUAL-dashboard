import { exportDashboardJSON, generateWalletNFTMapping, generateAdvancedAnalytics } from './src/generateJSON.ts';

async function testGenerateJSON() {
  console.log('🧪 Testing generateJSON functions...');
  
  try {
    await exportDashboardJSON();
    await generateWalletNFTMapping();
    await generateAdvancedAnalytics();
    console.log('✅ All JSON generation functions completed successfully!');
  } catch (error) {
    console.error('❌ Error testing JSON generation:', error);
  }
}

testGenerateJSON();
