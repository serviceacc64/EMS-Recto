const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('employees')
    .select('employee_no, last_name')
    .limit(1);
  
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data));
  }
}

test();
