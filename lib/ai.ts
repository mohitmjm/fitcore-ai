export async function callAI(prompt: string, format?: 'json'): Promise<string> {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '';
  const model = process.env.HUGGINGFACE_MODEL || 'deepseek-ai/DeepSeek-V4-Pro';
  
  // If no token is provided, warn and use local fallback
  if (!hfToken) {
    console.warn("Hugging Face API key missing. Using fallback mock generation.");
    return getFallbackAIResponse(prompt);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
    
    const reqBody: any = {
      model: model,
      messages: [
        { role: "user", content: prompt }
      ],
      provider: "hf-inference"
    };
    
    if (format === 'json') {
      reqBody.response_format = { type: "json_object" };
    }
    
    const res = await fetch("https://api-inference.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${hfToken}`
      },
      body: JSON.stringify(reqBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Hugging Face API returned status ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content || '';
    } else {
      throw new Error("Invalid response format from Hugging Face API");
    }
  } catch (error) {
    console.warn("Hugging Face API call failed, using fallback mock generation:", error);
    return getFallbackAIResponse(prompt);
  }
}

function getFallbackAIResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  // 1. WORKOUT PLAN GENERATION FALLBACK
  if (promptLower.includes("generate a") && (promptLower.includes("workout") || promptLower.includes("training"))) {
    // Extract info if possible
    const goalMatch = prompt.match(/goal:\s*([a-zA-Z\s]+)/i);
    const experienceMatch = prompt.match(/level\s*person\s*with\s*goal|([a-zA-Z]+)\s*level/i);
    const daysMatch = prompt.match(/(\d+)-day/i);
    const equipmentMatch = prompt.match(/equipment:\s*([a-zA-Z]+)/i);
    
    const goal = goalMatch ? goalMatch[1].trim() : 'muscle gain';
    const level = experienceMatch ? (experienceMatch[1] || 'intermediate').trim() : 'intermediate';
    const days = daysMatch ? parseInt(daysMatch[1]) : 4;
    const equip = equipmentMatch ? equipmentMatch[1].trim() : 'gym';
    
    // Generate workout structure
    const exercisesLibrary: Record<string, Array<{name: string, muscle: string, tip: string}>> = {
      gym: [
        { name: "Barbell Bench Press", muscle: "Chest", tip: "Keep your feet flat on the floor and engage your core." },
        { name: "Squats", muscle: "Legs (Quads/Glutes)", tip: "Keep your chest up and drive through your heels." },
        { name: "Deadlift", muscle: "Back/Hamstrings", tip: "Maintain a flat back and keep the bar close to your shins." },
        { name: "Dumbbell Overhead Press", muscle: "Shoulders", tip: "Do not arch your lower back as you press up." },
        { name: "Pull-ups / Lat Pulldown", muscle: "Lats/Upper Back", tip: "Squeeze your shoulder blades at the bottom." },
        { name: "Incline Dumbbell Flyes", muscle: "Chest", tip: "Focus on stretching the chest at the bottom." },
        { name: "Leg Press", muscle: "Legs", tip: "Do not lock out your knees at the top." },
        { name: "Seated Cable Rows", muscle: "Back", tip: "Pull with your elbows, not your hands." },
        { name: "Lateral Raises", muscle: "Shoulders", tip: "Lead with your elbows and hold for a split second." },
        { name: "Dumbbell Bicep Curls", muscle: "Biceps", tip: "Keep your elbows locked at your side." },
        { name: "Triceps Pushdowns", muscle: "Triceps", tip: "Flare your chest and fully extend your arms." },
        { name: "Hanging Leg Raises", muscle: "Abs", tip: "Control the descent, do not swing." }
      ],
      home: [
        { name: "Push-ups", muscle: "Chest/Shoulders", tip: "Keep a straight line from head to heels." },
        { name: "Bodyweight Squats", muscle: "Legs", tip: "Go below parallel if your flexibility allows." },
        { name: "Bulgarian Split Squats", muscle: "Legs (Quads/Glutes)", tip: "Use a chair or sofa to elevate your rear leg." },
        { name: "Doorway Pull-ups or Sheet Rows", muscle: "Back", tip: "Ensure door/sheet anchor is secure." },
        { name: "Pike Push-ups", muscle: "Shoulders", tip: "Elevate your hips to target the shoulders." },
        { name: "Walking Lunges", muscle: "Legs", tip: "Step far enough to keep knee behind toes." },
        { name: "Dips on Chair", muscle: "Triceps/Chest", tip: "Keep your back close to the chair." },
        { name: "Plank", muscle: "Abs/Core", tip: "Squeeze your glutes and draw belly button to spine." },
        { name: "Superman", muscle: "Lower Back", tip: "Hold the squeeze at the top for 2 seconds." }
      ],
      none: [
        { name: "Standard Push-ups", muscle: "Chest", tip: "Tuck your elbows to a 45-degree angle." },
        { name: "Air Squats", muscle: "Legs", tip: "Keep your knees tracking over your toes." },
        { name: "Burpees", muscle: "Full Body / Cardio", tip: "Land soft on your feet to protect your joints." },
        { name: "Glute Bridges", muscle: "Glutes/Hamstrings", tip: "Squeeze glutes hard at the top." },
        { name: "Mountain Climbers", muscle: "Core / Cardio", tip: "Keep your hips low and drive knees to chest." },
        { name: "Plank to Push-up", muscle: "Core/Chest", tip: "Minimize hip rocking as you transition." },
        { name: "Lying Leg Raises", muscle: "Abs", tip: "Keep lower back flat against the floor." }
      ]
    };
    
    const list = exercisesLibrary[equip as keyof typeof exercisesLibrary] || exercisesLibrary.gym;
    const plan: Array<{day: string | number, exercises: any[]}> = [];
    
    for (let d = 1; d <= days; d++) {
      // Pick 5 exercises for the day
      const dayExercises = [];
      const numExercises = level === 'advanced' ? 6 : level === 'intermediate' ? 5 : 4;
      const offset = (d - 1) * 3;
      
      for (let e = 0; e < numExercises; e++) {
        const item = list[(offset + e) % list.length];
        
        // Customize sets/reps based on goal
        let sets = 3;
        let reps: string | number = 10;
        let rest = 60;
        
        if (goal.includes("strength") || goal.includes("muscle")) {
          sets = level === 'advanced' ? 4 : 3;
          reps = goal.includes("strength") ? 6 : "8-12";
          rest = 90;
        } else if (goal.includes("loss") || goal.includes("endurance")) {
          sets = 3;
          reps = "15-20";
          rest = 45;
        } else {
          // Flexibility / Other
          sets = 3;
          reps = "12-15";
          rest = 60;
        }
        
        dayExercises.push({
          name: item.name,
          sets: sets,
          reps: reps,
          rest_seconds: rest,
          muscle_group: item.muscle,
          tip: item.tip
        });
      }
      
      plan.push({
        day: `Day ${d}`,
        exercises: dayExercises
      });
    }
    
    return JSON.stringify(plan);
  }
  
  // 2. DIET PLAN GENERATION FALLBACK
  if (promptLower.includes("create a") && (promptLower.includes("diet") || promptLower.includes("meal") || promptLower.includes("nutrition"))) {
    const typeMatch = prompt.match(/diet:\s*([a-zA-Z\-]+)/i);
    const goalMatch = prompt.match(/goal:\s*([a-zA-Z\s]+)/i);
    const weightMatch = prompt.match(/(\d+)\s*kg/i);
    
    const dietType = typeMatch ? typeMatch[1].trim() : 'veg';
    const goal = goalMatch ? goalMatch[1].trim() : 'maintain';
    const weight = weightMatch ? parseInt(weightMatch[1]) : 70;
    
    // Indian Diet Mock Data
    const breakfastList = dietType === 'vegan' 
      ? ["Oats cooked in Almond Milk with chia seeds & almonds", "Tofu Scramble with spinach & whole wheat toast", "Ragi Roti with cucumber salad & mint chutney"]
      : dietType === 'veg'
      ? ["Paneer Bhurji with 2 multigrain rotis", "Oats Upma with mixed vegetables and peanuts", "3 Moong Dal Cheelas with low-fat paneer stuffing"]
      : ["3 Egg Whites + 1 Whole Egg Scramble with veggies & brown toast", "Chicken Keema Paratha (made with whole wheat)", "Oats Porridge with 1 scoop Whey Protein & nuts"];

    const lunchList = dietType === 'vegan'
      ? ["Brown rice, Chana Masala (chickpeas), and sautéed broccoli", "Quinoa salad with roasted chickpeas, cucumber, and tahini dressing", "Dal Tadka, brown rice, and dry bhindi (okra) sabzi"]
      : dietType === 'veg'
      ? ["Brown rice, Paneer Tikka Masala, and Dal Makhani (light)", "Multigrain Roti, Mixed Vegetable curry, and a bowl of Greek Yogurt", "Soya chunks pulao with cucumber raita & green salad"]
      : ["Grilled Chicken breast with brown rice & steamed broccoli/carrots", "Fish Curry (pomfret or rawas) with steamed rice & green salad", "Whole wheat chicken wrap with yogurt mint dressing & bell peppers"];

    const dinnerList = dietType === 'vegan'
      ? ["Tofu & vegetable stir-fry in light soy sauce with quinoa", "Red lentil soup (masoor dal) with roasted asparagus", "Soya chunks curry with 2 phulkas and cucumber slices"]
      : dietType === 'veg'
      ? ["Palak Paneer (cottage cheese in spinach) with 2 Bajra rotis", "Mixed vegetable khichdi (light) with a bowl of curd", "Paneer & bell pepper skewers with mint chutney"]
      : ["Baked Salmon/Chicken with sweet potato mash & asparagus", "Chicken breast salad with olive oil dressing & pumpkin seeds", "Egg white bhurji (4 eggs) with sautéed mushrooms & 1 roti"];

    const snacksList = dietType === 'vegan'
      ? ["A handful of roasted almonds & walnuts", "Roasted chickpeas (chana)", "Chia seed pudding with coconut milk", "Apple slices with peanut butter"]
      : ["Handful of roasted almonds & pumpkin seeds", "A scoop of whey protein in water", "Roasted makhana (foxnuts)", "Boiled egg whites (for non-veg) or paneer cubes (for veg)"];

    const targetCals = goal.includes("lose") ? (weight * 22) : goal.includes("gain") ? (weight * 32) : (weight * 26);
    
    const mealPlan = [];
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    for (let i = 0; i < 7; i++) {
      const bMeal = breakfastList[i % breakfastList.length];
      const lMeal = lunchList[i % lunchList.length];
      const dMeal = dinnerList[i % dinnerList.length];
      const sMeal = snacksList[i % snacksList.length];
      
      mealPlan.push({
        day: weekdays[i],
        breakfast: {
          name: bMeal,
          calories: Math.round(targetCals * 0.25),
          protein_g: dietType === 'non-veg' ? 25 : 15,
          carbs_g: 40,
          fat_g: 10
        },
        lunch: {
          name: lMeal,
          calories: Math.round(targetCals * 0.35),
          protein_g: dietType === 'non-veg' ? 35 : 20,
          carbs_g: 55,
          fat_g: 12
        },
        dinner: {
          name: dMeal,
          calories: Math.round(targetCals * 0.25),
          protein_g: dietType === 'non-veg' ? 30 : 18,
          carbs_g: 35,
          fat_g: 8
        },
        snacks: {
          name: sMeal,
          calories: Math.round(targetCals * 0.15),
          protein_g: 10,
          carbs_g: 15,
          fat_g: 6
        }
      });
    }
    
    return JSON.stringify(mealPlan);
  }

  // 3. CHAT COACH CHAT FALLBACK
  return "That is an excellent fitness question! Consistency is key. Ensure you are getting at least 7-8 hours of sleep, drinking 3-4 liters of water daily, and hitting your protein goal (around 1.6g - 2.2g per kg of bodyweight). If you need specific changes to your workouts or diet plan, let me know, and we can adjust the variables!";
}
