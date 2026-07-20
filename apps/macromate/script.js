let chart

function calculate(){

let age = Number(document.getElementById("age").value)
let gender = document.getElementById("gender").value
let height = Number(document.getElementById("height").value)
let weightLbs = Number(document.getElementById("weight").value)
let goalWeight = Number(document.getElementById("goalWeight").value)
let activity = Number(document.getElementById("activity").value)

let weightKg = weightLbs * 0.453592

// Mifflin-St Jeor BMR

let bmr

if(gender === "male"){
bmr = 10*weightKg + 6.25*height - 5*age + 5
}else{
bmr = 10*weightKg + 6.25*height - 5*age - 161
}

// maintenance calories

let maintenance = bmr * activity

// correct fat loss deficit
// 3500 calories = ~1lb fat

let deficitCalories = maintenance - 500

let weeklyLoss = 1

let weeks = Math.abs(weightLbs - goalWeight) / weeklyLoss

// macros

let protein = weightLbs * 0.8
let fat = weightLbs * 0.3
let carbs = (deficitCalories - (protein*4 + fat*9)) / 4

// body fat estimate (rough)

let bodyFat = (1.20 * (weightLbs / ((height/100)**2))) + (0.23 * age) - 16.2

// food suggestions

let foods = [
"Chicken Breast",
"Eggs",
"Salmon",
"Greek Yogurt",
"Rice",
"Oats",
"Sweet Potatoes",
"Avocado"
]

// results

document.getElementById("results").innerHTML = `

<h3>Daily Calories</h3>
Maintenance: ${Math.round(maintenance)} kcal<br>
Fat Loss: ${Math.round(deficitCalories)} kcal

<h3>Macros</h3>
Protein: ${Math.round(protein)} g<br>
Fat: ${Math.round(fat)} g<br>
Carbs: ${Math.round(carbs)} g

<h3>Estimated Body Fat</h3>
${Math.round(bodyFat)} %

<h3>Estimated Timeline</h3>
${Math.round(weeks)} weeks to reach ${goalWeight} lbs

<h3>Recommended Foods</h3>
${foods.join(", ")}

`

generateChart(weightLbs,goalWeight,weeks)

}

function generateChart(start,goal,weeks){

let weights=[]
let labels=[]

let step=(start-goal)/weeks

for(let i=0;i<=weeks;i++){

weights.push(start-(step*i))
labels.push("Week "+i)

}

if(chart){
chart.destroy()
}

chart=new Chart(document.getElementById("weightChart"),{

type:"line",

data:{
labels:labels,
datasets:[{
label:"Projected Weight",
data:weights,
borderWidth:3
}]
},

options:{
responsive:true
}

})

}
