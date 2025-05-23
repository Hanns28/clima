document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input');
    const getWeatherBtn = document.getElementById('get-weather-btn');
    const weatherResults = document.getElementById('weather-results');

    // Reemplaza 'TU_API_KEY_AQUI' con tu clave real de WeatherAPI.com
    const API_KEY = '91de2d0144d145ce92d213500252205'; 

    getWeatherBtn.addEventListener('click', async () => {
        const city = cityInput.value.trim(); // .trim() para quitar espacios en blanco
        if (city === '') {
            weatherResults.innerHTML = '<p class="error-message">Por favor, introduce el nombre de una ciudad.</p>';
            return;
        }

        // Limpiar resultados anteriores y mostrar mensaje de carga
        weatherResults.innerHTML = '<p>Cargando datos del clima...</p>';

        try {
            const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}&lang=es`);
            
            // Verificar si la respuesta fue exitosa (código 200)
            if (!response.ok) {
                if (response.status === 400) {
                    // Esto suele ocurrir si la ciudad no es encontrada
                    const errorData = await response.json();
                    weatherResults.innerHTML = `<p class="error-message">Error: ${errorData.error.message || 'Ciudad no encontrada o inválida.'}</p>`;
                } else if (response.status === 401) {
                    weatherResults.innerHTML = `<p class="error-message">Error de autenticación. Verifica tu clave de API.</p>`;
                } else {
                    throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
                }
                return; // Salir de la función si hay un error
            }

            const data = await response.json();

            // Renderizar los datos del clima
            displayWeather(data);

        } catch (error) {
            console.error('Error al obtener los datos del clima:', error);
            weatherResults.innerHTML = `<p class="error-message">Hubo un problema al obtener el clima. Inténtalo de nuevo más tarde.</p>`;
        }
    });

    function displayWeather(data) {
        if (!data || !data.location || !data.current) {
            weatherResults.innerHTML = '<p class="error-message">No se pudieron obtener los datos del clima para esta ubicación.</p>';
            return;
        }

        const { location, current } = data;

        weatherResults.innerHTML = `
            <h2>${location.name}, ${location.country}</h2>
            <p><strong>Temperatura:</strong> ${current.temp_c}°C / ${current.temp_f}°F</p>
            <p><strong>Condición:</strong> ${current.condition.text} <img src="${current.condition.icon}" alt="Icono de clima" class="weather-icon"></p>
            <p><strong>Sensación térmica:</strong> ${current.feelslike_c}°C</p>
            <p><strong>Humedad:</strong> ${current.humidity}%</p>
            <p><strong>Velocidad del viento:</strong> ${current.wind_kph} km/h (${current.wind_dir})</p>
            <p><strong>Presión:</strong> ${current.pressure_mb} mb</p>
            <p><strong>Última actualización:</strong> ${new Date(location.localtime).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</p>
        `;
    }
});