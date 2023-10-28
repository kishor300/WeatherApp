//-------------------------- Importing Packages/Variables ---------------------------------------------------------------------------
const express = require('express');
const app = express();

const axios = require('axios');

require('dotenv').config();

const weatherApiKey = process.env.weatherApiKey;    // getting apiKey from .env file
const locApiKey = process.env.locApiKey;

const path = require('path');
//-------------------------- Middleware ---------------------------------------------------------------------------

app.use(express.urlencoded({extended:true}));   //to get the html form data

app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());

//-------------------------- API Design ----------------------------------------------------------------------------------

app.get('/',(req,res)=>{

    res.sendFile(__dirname + '/public/index.html');

});

async function getLoc(lat,lon){

    try{

        const url_latlon = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${locApiKey}`;
        
        const response = await axios.get(url_latlon);

        let locationData = response.data;   // Storing data received in response by using 'response.data'.  It is compulsory.
        
        const city = locationData.features[0].properties.city;

        console.log("City: ", city);

        return city;

    }catch(error){

        console.log('An error occurred while fetching location in getLoc function.', error);
        throw error;
    }

}

function getCityDT(cityTimeStamp){

    const timestamp = cityTimeStamp * 1000; // Convert the timestamp to milliseconds

    const date = new Date(timestamp);

    const day = date.toLocaleString('en-US', { day: '2-digit' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const formattedDate = `${day} ${month}, ${time}`;
    
    return formattedDate;
}

async function getCityWeather(city){

    try{

        const url_loc = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`;
        
        const response = await axios.get(url_loc);

        const weatherData = response.data;  
        /*  
            Storing data received in response by using 'response.data'.  It is compulsory.
            Axios responses are already served as javascript object, no need to parse
        */

        const cityTimeStamp = weatherData.dt;
        console.log('Current City Timestamp :',cityTimeStamp);
        const cityDateTime = getCityDT(cityTimeStamp);
        console.log('Current City Date Time :',cityDateTime);

        const iconId = weatherData.weather[0].icon;
        const temp = Math.round( weatherData.main.temp );
        const cityName = weatherData.name;
        const country = weatherData.sys.country;
        const description = weatherData.weather[0].description;

        const humidity = weatherData.main.humidity;
        const visibility = (weatherData.visibility)/1000;   // converting from m to km
        const windSpeed = ( (weatherData.wind.speed)*3.6 ).toFixed(2);   // converting m/s to km/h  //.toFixed() method taked only 2 digits afte decimal
        const winddeg = weatherData.wind.deg;

        console.log('\n\n iconId is '+iconId+'\n\n' );
        console.log('\n\n description is '+description+'\n\n' );
        
        const WRAP_DATA = { 
            cityDateTime,
            iconId, 
            temp,
            cityName,
            country,
            description,
            humidity,
            visibility,
            windSpeed,
            winddeg
        };

        return WRAP_DATA;

    }catch(error){

        console.log('An error occurred while fetching weather in getCityWeather function.', error);
        throw error;
    }

}


app.post('/', async(req,res)=>{                // async (callbacks_req_res)=>{..}

    if (typeof req.body.latitude !== 'undefined') {
        
        try {
        
            // Step-1] Get the current city using lat,lon //We are using geoapify-API for getting city usin lat,lon because openWeather-API gives accurate city by lat,lon
    
                const result = req.body;        // getting user current location to featch weather.
                const lon = result.longitude;
                const lat = result.latitude;  
    
                console.log('my lon =',lon,'my lat = ',lat);
    
                let currentCity = await getLoc(lat,lon);    // calling getLoc function
                
                // trail data
                // let currentCity = 'Delhi';
                
                console.log('Current City = ',currentCity);
    
            // Step-2] Get the current weather using city
    
                let WRAP_DATA = await getCityWeather(currentCity);    // calling getCityWeather function
    
                // trail data
                // let WRAP_DATA = {
                //     cityDateTime: '29 Oct, 02:07 AM',
                //     iconId: '10d',
                //     temp: 24,
                //     cityName: 'Delhi',
                //     country: 'IN',
                //     description: 'clear sky',
                //     humidity: 38,
                //     visibility: 10,
                //     windSpeed: 1.116,
                //     winddeg: 268
                // }

                console.log('\n\n1) Weather Info = ', WRAP_DATA);
                
                res.json(WRAP_DATA);
    
                // res.render('index.ejs',{data:WRAP_DATA});    // sending all weather related dynamic data to index.hbs to display values
    
        } catch (error) {
    
            console.error(error);
            res.status(500).send('An error occurred while fetching weather data. Try again!');
        }

    } else if(typeof req.body.cityName !=='undefined'){

        try {
        
            // Step-1] Get the current weather using city
    
                const cityName = req.body.cityName; // getting city name from user
                
                let WRAP_DATA = await getCityWeather(cityName);    // calling getCityWeather function
    
                console.log('2) Weather Info = ',WRAP_DATA);
    
                res.json( WRAP_DATA );

                // res.render('index.hbs', {WRAP_DATA});    // sending all weather related dynamic data to index.hbs to display values
    
        } catch (error) {
    
            console.error(error);
            res.status(500).send('An error occurred while fetching weather data. Try again!');
        }

    }else {
        
        res.status('400').send('Bad Request: Missing location and cityName in request');
    }
    
});


//-------------------------- Creating Server ---------------------------------------------------------------------------

let port = 5000;
app.listen(port,(err)=>{
    if(err){
        console.log(err);
    }else{
        console.log(`Server is listening on port ${port}`);
    }
})
