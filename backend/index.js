import { supabase } from './config/supabase.js';
import express from 'express';

const app = express();
const port = 3000;

// Test Supabase connection
async function checkSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try a simple query to test the connection
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Connection test passed - can query the database.');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
}

// Check connection before starting server
checkSupabaseConnection().then((isConnected) => {
  if (!isConnected) {
    console.error('\n⚠️  Warning: Supabase connection check failed. Server will still start, but database operations may fail.');
    console.error('Please check your .env file and ensure SUPABASE_URL and SUPABASE_ANON_KEY are set correctly.\n');
  }
});

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});