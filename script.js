document.addEventListener('DOMContentLoaded', () => {
  const cityInput = document.getElementById('city-input');
  const getWeatherBtn = document.getElementById('get-weather-btn');
  const weatherResults = document.getElementById('weather-results');
  const API_KEY = '91de2d0144d145ce92d213500252205';

  ////////////////////////////////////
  const suggestionsBox = document.getElementById('suggestions');

// Autocompletado
cityInput.addEventListener('input', async () => {
  const query = cityInput.value.trim();
  if (query.length < 3) {
    suggestionsBox.innerHTML = '';
    return;
  }

  try {
    const response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`);
    const results = await response.json();

    if (Array.isArray(results)) {
      suggestionsBox.innerHTML = results.map(city => `
        <div data-name="${city.name}, ${city.country}">${city.name}, ${city.region}, ${city.country}</div>
      `).join('');
    }
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
  }
});

// Clic en una sugerencia
suggestionsBox.addEventListener('click', (e) => {
  if (e.target && e.target.dataset.name) {
    cityInput.value = e.target.dataset.name;
    suggestionsBox.innerHTML = '';
  }
});

// Ocultar sugerencias al perder foco
document.addEventListener('click', (e) => {
  if (!e.target.closest('.input-section')) {
    suggestionsBox.innerHTML = '';
  }
});

  ////////////////////////////////////

  function validarCiudad(ciudad) {
    const regex = /^[a-zA-Z\sáéíóúÁÉÍÓÚñÑ]+$/;
    if (!ciudad.trim()) {
      weatherResults.innerHTML = '<p class="error-message">Por favor, introduce el nombre de una ciudad.</p>';
      return false;
    }
    if (!regex.test(ciudad)) {
      weatherResults.innerHTML = '<p class="error-message">El nombre de la ciudad solo debe contener letras.</p>';
      return false;
    }
    return true;
  }

  getWeatherBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (!validarCiudad(city)) return;
    weatherResults.innerHTML = '<p>Cargando datos del clima...</p>';
    await buscarClimaConPronostico(city);
  });

  async function buscarClimaConPronostico(city) {
    try {
      const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&lang=es&days=3`);
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.error?.message || 'Error desconocido.';
        weatherResults.innerHTML = `<p class="error-message">Error: ${errorMessage}</p>`;
        return;
      }
      const data = await response.json();
      displayWeatherWithForecast(data);
    } catch (error) {
      console.error('Error al obtener los datos del clima:', error);
      weatherResults.innerHTML = `<p class="error-message">Hubo un problema al obtener el clima. Inténtalo de nuevo más tarde.</p>`;
    }
  }

  function displayWeatherWithForecast(data) {
    if (!data || !data.location || !data.current || !data.forecast) {
      weatherResults.innerHTML = '<p class="error-message">No se pudieron obtener los datos del clima para esta ubicación.</p>';
      return;
    }

    const { location, current, forecast } = data;
    let html = `
      <h2>${location.name}, ${location.country}</h2>
      <p><strong>Condición actual:</strong> ${current.condition.text} 
        <img src="${current.condition.icon}" alt="Clima actual" class="weather-icon-large">
      </p>
      <p><strong>Temperatura:</strong> ${current.temp_c}°C / ${current.temp_f}°F</p>
      <p><strong>Sensación térmica:</strong> ${current.feelslike_c}°C</p>
      <p><strong>Humedad:</strong> ${current.humidity}%</p>
      <p><strong>Viento:</strong> ${current.wind_kph} km/h (${current.wind_dir})</p>
      <p><strong>Última actualización:</strong> ${location.localtime}</p>
      <hr>
      <h3>Pronóstico para los próximos 3 días:</h3>
    `;

    forecast.forecastday.forEach(day => {
      html += `
        <div class="forecast-day">
          <p><strong>${new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong></p>
          <img src="${day.day.condition.icon}" class="forecast-icon" alt="icono">
          <p>${day.day.condition.text}</p>
          <p>🌡️ Máx: ${day.day.maxtemp_c}°C / Mín: ${day.day.mintemp_c}°C</p>
          <p>💧 Humedad: ${day.day.avghumidity}%</p>
        </div>
      `;
    });

    weatherResults.innerHTML = html;
  }

  // Geolocalización automática al cargar la página
  async function obtenerClimaPorGeolocalizacion() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        weatherResults.innerHTML = '<p>Detectando ubicación actual...</p>';
        try {
          const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&lang=es&days=3`);
          const data = await response.json();
          displayWeatherWithForecast(data);
        } catch (error) {
          weatherResults.innerHTML = '<p class="error-message">No se pudo obtener el clima desde tu ubicación.</p>';
        }
      }, (error) => {
        console.warn("No se pudo obtener la ubicación del usuario.", error);
      });
    }
  }

  obtenerClimaPorGeolocalizacion(); // Ejecutar al cargar
});
