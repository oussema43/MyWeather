/**
 * Weather App Logic
 * Uses Open-Meteo API for weather data (No API Key required)
 * Uses Open-Meteo Geocoding API for city search
 */

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading');
const weatherContent = document.getElementById('weather-content');
const welcomeMessage = document.getElementById('welcome-message');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getCityCoordinates(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getCityCoordinates(city);
        }
    }
});

locationBtn.addEventListener('click', getUserLocation);

/**
 * Get coordinates for a city name using Open-Meteo Geocoding API
 * @param {string} city - Symbol to search for
 */
async function getCityCoordinates(city) {
    showLoading();
    hideError();

    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        const data = await response.json();

        if (!data.results) {
            throw new Error('City not found');
        }

        const { name, latitude, longitude, country_code } = data.results[0];
        getWeatherData(latitude, longitude, name, country_code);

    } catch (error) {
        showError(error.message === 'City not found' ? 'City not found. Please try again.' : 'Failed to fetch data. Check your connection.');
        resetUI();
    }
}

/**
 * Get User's physical location
 */
function getUserLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocoding (optional) or just use lat/lon. 
                // We'll pass "Your Location" as name for now, or fetch it.
                // Let's just fetch weather directly.
                getWeatherData(latitude, longitude, "Your Location", "");
            },
            (error) => {
                showError("Permission denied or location unavailable.");
                resetUI();
            }
        );
    } else {
        showError("Geolocation is not supported by this browser.");
    }
}

/**
 * Fetch Weather Data using Open-Meteo
 */
async function getWeatherData(lat, lon, cityName, countryCode) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

        const response = await fetch(url);
        const data = await response.json();

        updateUI(data, cityName, countryCode);

    } catch (error) {
        console.error(error);
        showError('Error retrieving weather data.');
        resetUI();
    }
}

/**
 * Update the UI with fetched data
 */
function updateUI(data, cityName, countryCode) {
    const current = data.current;
    const daily = data.daily;
    const countrySuffix = countryCode ? `, ${countryCode}` : '';

    // Update Current Weather
    document.getElementById('city-name').textContent = `${cityName}${countrySuffix}`;
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('current-temp').textContent = `${Math.round(current.temperature_2m)}°`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').textContent = `${current.wind_speed_10m} km/h`;

    // Description & Icon
    const weatherInfo = getWeatherDescription(current.weather_code, current.is_day);
    document.getElementById('weather-desc').textContent = weatherInfo.description;

    const iconElement = document.getElementById('current-icon');
    iconElement.className = `bi ${weatherInfo.icon}`;

    // Update 5-Day Forecast
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; // Clear previous

    // Open-Meteo returns current day as index 0, so we take 1-5 for next 5 days
    for (let i = 1; i <= 5; i++) {
        if (daily.time[i]) {
            const date = new Date(daily.time[i]);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const maxTemp = Math.round(daily.temperature_2m_max[i]);
            const minTemp = Math.round(daily.temperature_2m_min[i]);
            const code = daily.weather_code[i];
            const dailyInfo = getWeatherDescription(code, 1); // Assume day icon for forecast

            const col = document.createElement('div');
            col.className = 'col-sm'; // Auto-layout for Bootstrap grid
            col.style.minWidth = '20%'; // Approx width for 5 items

            col.innerHTML = `
                <div class="forecast-card text-center" style="animation-delay: ${i * 0.1}s">
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-icon"><i class="bi ${dailyInfo.icon}"></i></div>
                    <div class="forecast-temp">
                        <span class="fw-bold">${maxTemp}°</span> 
                        <span class="text-white-50">${minTemp}°</span>
                    </div>
                </div>
            `;
            forecastContainer.appendChild(col);
        }
    }

    // Apply Dynamic Theme
    updateTheme(current.weather_code, current.is_day);

    // Show Content
    loadingSpinner.classList.add('d-none');
    welcomeMessage.classList.add('d-none');
    weatherContent.classList.remove('d-none');
}

/**
 * Update Body Theme based on Weather
 */
function updateTheme(code, isDay) {
    const body = document.body;
    body.className = ''; // Reset

    if (!isDay) {
        body.classList.add('weather-night');
        return;
    }

    // Map codes to themes
    if (code === 0 || code === 1) { // Clear
        body.classList.add('weather-sunny');
    } else if (code >= 2 && code <= 48) { // Cloudy
        body.classList.add('weather-cloudy');
    } else if (code >= 51 && code <= 65) { // Rain
        body.classList.add('weather-rainy');
    } else if (code >= 71 && code <= 77) { // Snow
        body.classList.add('weather-snow');
    } else if (code >= 95) { // Thunderstorm
        body.classList.add('weather-rainy');
    } else {
        body.classList.add('weather-cloudy'); // Fallback
    }
}

/**
 * Helper: Map WMO Weather Codes to Bootstrap Icons & Description
 * Codes from Open-Meteo docs
 */
function getWeatherDescription(code, isDay) {
    // 0: Clear sky
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    // 45, 48: Fog
    // 51, 53, 55: Drizzle
    // 61, 63, 65: Rain
    // 71, 73, 75: Snow
    // 95: Thunderstorm

    const icons = {
        0: isDay ? 'bi-sun-fill' : 'bi-moon-stars-fill',
        1: isDay ? 'bi-cloud-sun-fill' : 'bi-cloud-moon-fill',
        2: 'bi-cloud-fill',
        3: 'bi-clouds-fill',
        45: 'bi-cloud-haze2-fill',
        48: 'bi-cloud-haze2-fill',
        51: 'bi-cloud-drizzle-fill',
        53: 'bi-cloud-drizzle-fill',
        55: 'bi-cloud-drizzle-fill',
        61: 'bi-cloud-rain-fill',
        63: 'bi-cloud-rain-fill',
        65: 'bi-cloud-rain-heavy-fill',
        71: 'bi-snow',
        73: 'bi-snow2',
        75: 'bi-snow3',
        95: 'bi-cloud-lightning-rain-fill',
        96: 'bi-cloud-lightning-rain-fill',
        99: 'bi-cloud-lightning-rain-fill'
    };

    const descriptions = {
        0: 'Clear Sky',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Rime Fog',
        51: 'Light Drizzle',
        53: 'Moderate Drizzle',
        55: 'Dense Drizzle',
        61: 'Slight Rain',
        63: 'Moderate Rain',
        65: 'Heavy Rain',
        71: 'Slight Snow',
        73: 'Moderate Snow',
        75: 'Heavy Snow',
        95: 'Thunderstorm',
        96: 'Hailstorm',
        99: 'Heavy Thunderstorm'
    };

    return {
        icon: icons[code] || 'bi-cloud-fill', // Default
        description: descriptions[code] || 'Unknown'
    };
}

function showLoading() {
    loadingSpinner.classList.remove('d-none');
    weatherContent.classList.add('d-none');
    welcomeMessage.classList.add('d-none');
    errorMessage.style.display = 'none';
}

function showError(msg) {
    loadingSpinner.classList.add('d-none');
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

function resetUI() {
    loadingSpinner.classList.add('d-none');
    // Keep visible whatever state was before or just show welcome/empty?
    // If it was a search error, we probably want to stay where we are but show error.
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('js/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
