const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://krbukpldkxowlllxtkru.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connected to Supabase');

module.exports = supabase;