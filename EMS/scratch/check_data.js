import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://fbyaeykqqyeejhomwpaz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieWFleWtxcXllZWpob213cGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjI4MTIsImV4cCI6MjA5MzE5ODgxMn0.YD4fYOWUPseBtyRr0MFdSr022sTZUWsI5I8145rr1lo')

async function checkData() {
  const { data, error } = await supabase.from('employees').select('salary_grade, step')
  if (error) {
    console.error(error)
    return
  }
  console.log('Total employees:', data.length)
  const brackets = { "Below 30k": 0, "30k-40k": 0, "40k-50k": 0, "50k+": 0 }
  
  const SALARY_TABLE = {
    1: { 1: 14634, 2: 14730, 3: 14849, 4: 14968, 5: 15089, 6: 15211, 7: 15333, 8: 15456 },
    2: { 1: 15522, 2: 15636, 3: 15752, 4: 15869, 5: 15986, 6: 16103, 7: 16223, 8: 16342 },
    3: { 1: 16486, 2: 16610, 3: 16732, 4: 16856, 5: 16982, 6: 17106, 7: 17234, 8: 17360 },
    4: { 1: 17506, 2: 17636, 3: 17767, 4: 17898, 5: 18031, 6: 18163, 7: 18298, 8: 18433 },
    5: { 1: 18581, 2: 18720, 3: 18858, 4: 18998, 5: 19137, 6: 19280, 7: 19423, 8: 19565 },
    6: { 1: 19716, 2: 19862, 3: 20009, 4: 20158, 5: 20307, 6: 20456, 7: 20609, 8: 20761 },
    7: { 1: 20914, 2: 21069, 3: 21224, 4: 21382, 5: 21539, 6: 21699, 7: 21859, 8: 22022 },
    8: { 1: 22423, 2: 22627, 3: 22832, 4: 23038, 5: 23246, 6: 23456, 7: 23668, 8: 23883 },
    9: { 1: 24329, 2: 24523, 3: 24720, 4: 24917, 5: 25117, 6: 25318, 7: 25521, 8: 25725 },
    10: { 1: 26917, 2: 27131, 3: 27347, 4: 27565, 5: 27786, 6: 28007, 7: 28230, 8: 28456 },
    11: { 1: 31705, 2: 31820, 3: 32109, 4: 32401, 5: 32697, 6: 32998, 7: 33302, 8: 33611 },
    12: { 1: 33947, 2: 34069, 3: 34357, 4: 34648, 5: 34943, 6: 35242, 7: 35544, 8: 35850 },
    13: { 1: 36125, 2: 36283, 3: 36599, 4: 36919, 5: 37244, 6: 37572, 7: 37904, 8: 38241 },
    14: { 1: 38764, 2: 39141, 3: 39523, 4: 39910, 5: 40300, 6: 40696, 7: 41097, 8: 41503 },
    15: { 1: 42178, 2: 42594, 3: 43015, 4: 43442, 5: 43874, 6: 44310, 7: 44753, 8: 45202 },
    16: { 1: 45694, 2: 46152, 3: 46615, 4: 47084, 5: 47559, 6: 48040, 7: 48528, 8: 49020 },
    17: { 1: 49562, 2: 50066, 3: 50576, 4: 51092, 5: 51614, 6: 52144, 7: 52678, 8: 53221 },
    18: { 1: 53818, 2: 54371, 3: 54933, 4: 55499, 5: 56075, 6: 56557, 7: 57246, 8: 57842 },
  }

  data.forEach(emp => {
    const cleanSg = String(emp.salary_grade || "").replace(/\D/g, "");
    const cleanStep = String(emp.step || "").replace(/\D/g, "");
    const grade = parseInt(cleanSg, 10);
    const stp = parseInt(cleanStep, 10);
    const amount = (SALARY_TABLE[grade] && SALARY_TABLE[grade][stp]) || 0;
    console.log(`Grade: ${emp.salary_grade} (${grade}), Step: ${emp.step} (${stp}) -> Amount: ${amount}`);
  })
}

checkData()
