const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

// Tell Express to use EJS for rendering HTML pages
app.set('view engine', 'ejs');

// Tell Express where static files (like CSS) are located
app.use(express.static('public'));

// Allow Express to read form data submitted by the user
app.use(express.urlencoded({ extended: true }));

// ROUTE 1: Home Page (Get request)
app.get('/', async (req, res) => {
    try {
        // Step 1: Fetch list of meal categories for the drop-down menu
        const categoryResult = await axios.get('https://www.themealdb.com/api/json/v1/1/categories.php');
        const categoryList = categoryResult.data.categories;

        // Step 2: Render index.ejs and pass the categories list to it
        res.render('index', { 
            categories: categoryList, 
            error: null 
        });

    } catch (error) {
        // If the API fails, render the page with an empty list and show an error
        res.render('index', { 
            categories: [], 
            error: 'Could not load categories. Please refresh the page.' 
        });
    }
});

// ROUTE 2: Search Results Page (Post request)
app.post('/search', async (req, res) => {
    // Get inputs typed or selected by the user in the form
    const userMealSearch = req.body.mealName;
    const userCategoryChoice = req.body.category;

    try {
        let mealToDisplay;

        // STEP 1: Decide how to search for the meal

        // Case A: User selected a specific category from the dropdown
        if (userCategoryChoice && userCategoryChoice !== 'all') {
            
            // Fetch basic list of meals in that category
            const categoryMealResult = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${userCategoryChoice}`);
            const categoryMeals = categoryMealResult.data.meals;

            // Pick the first meal from the results
            const firstMeal = categoryMeals[0];

            // Fetch full details (recipe & instructions) using the meal's ID
            const detailResult = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${firstMeal.idMeal}`);
            mealToDisplay = detailResult.data.meals[0];

        } 
        // Case B: User typed something into the search box
        else if (userMealSearch) {
            
            const searchResult = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${userMealSearch}`);
            
            // If API returned no matches
            if (!searchResult.data.meals) {
                return res.render('index', { 
                    categories: [], 
                    error: 'No recipes found! Try searching for a different dish.' 
                });
            }

            mealToDisplay = searchResult.data.meals[0];

        } 
        // Case C: User didn't type anything or select a category (Get a random meal)
        else {
            
            const randomMealResult = await axios.get('https://www.themealdb.com/api/json/v1/1/random.php');
            mealToDisplay = randomMealResult.data.meals[0];

        }


        // STEP 2: Fetch Second API (Bonus Challenge) 
        // Fetch a random drink recipe from CocktailDB to pair with the meal
        const drinkResult = await axios.get('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const drinkToDisplay = drinkResult.data.drinks[0];


        // STEP 3: Send data to EJS view
        res.render('recipe', { 
            meal: mealToDisplay, 
            drink: drinkToDisplay 
        });

    } catch (error) {
        console.log('Error fetching data:', error);
        res.render('index', { 
            categories: [], 
            error: 'Something went wrong fetching data from the API.' 
        });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});