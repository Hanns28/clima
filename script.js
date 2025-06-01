document.addEventListener('DOMContentLoaded', () => {
  const cityInput = document.getElementById('city-input');
  const getWeatherBtn = document.getElementById('get-weather-btn');
  const weatherResults = document.getElementById('weather-results');
  const suggestionsBox = document.getElementById('suggestions');
  const API_KEY = '91de2d0144d145ce92d213500252205';

  // -----------------------
  // UTILIDADES
  // -----------------------

  // Función para limpiar las sugerencias
  function clearSuggestions() {
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';
  }

  // Función para mostrar mensaje de error en el área de resultados
  function showError(message) {
    weatherResults.innerHTML = `
      <p class="error-message animate__animated animate__shakeX">${message}</p>
    `;
  }

  // Función para validar el nombre de ciudad (letras, espacios y comas)
  function validarCiudad(ciudad) {
    // Permite letras (may/min), espacios y comas
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s,]+$/;
    if (!ciudad.trim()) {
      showError('Por favor, introduce el nombre de una ciudad.');
      return false;
    }
    if (!regex.test(ciudad)) {
      showError('El nombre de la ciudad solo debe contener letras, espacios o comas.');
      return false;
    }
    return true;
  }

  // -----------------------
  // AUTOCOMPLETADO
  // -----------------------

  cityInput.addEventListener('input', async () => {
    const query = cityInput.value.trim();

    // Mostrar sugerencias solo si hay 3+ caracteres
    if (query.length < 3) {
      clearSuggestions();
      return;
    }

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${encodeURIComponent(query)}`
      );
      const results = await response.json();

      if (Array.isArray(results) && results.length > 0) {
        // Mostrar sugerencias en lista
        suggestionsBox.innerHTML = results
          .map(city => `
            <div class="suggestion-item" data-name="${city.name}, ${city.region}, ${city.country}">
              <i class="fas fa-map-marker-alt"></i> ${city.name}, ${city.region}, ${city.country}
            </div>
          `).join('');
        suggestionsBox.style.display = 'block';
      } else {
        clearSuggestions();
      }
    } catch (error) {
      console.error('Error al obtener sugerencias:', error);
      clearSuggestions();
    }
  });

  // Manejo clic en sugerencia: completar input y ocultar sugerencias
  suggestionsBox.addEventListener('click', e => {
    if (e.target.closest('.suggestion-item')) {
      const selected = e.target.closest('.suggestion-item').dataset.name;
      cityInput.value = selected;
      clearSuggestions();
    }
  });

  // Ocultar sugerencias si clic fuera del input o sugerencias
  document.addEventListener('click', e => {
    if (!e.target.closest('.input-section')) {
      clearSuggestions();
    }
  });

  // -----------------------
  // BUSCAR Y MOSTRAR CLIMA
  // -----------------------

  getWeatherBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();

    if (!validarCiudad(city)) return;

    // Mostrar mensaje de carga
    weatherResults.innerHTML = `
      <p class="loading animate__animated animate__pulse">Cargando datos del clima...</p>
    `;

    try {
      const data = await obtenerDatosClima(city);
      if (data) {
        mostrarClimaConPronostico(data);
      }
    } catch {
      showError('No se pudo obtener el clima. Inténtalo más tarde.');
    }
  });

  // Función que obtiene datos del clima con pronóstico desde API
  async function obtenerDatosClima(city) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&lang=es&days=3`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error?.message || 'Error desconocido.';
      showError(`Error: ${errorMessage}`);
      return null;
    }

    return await response.json();
  }

  // Función que muestra los datos de clima y pronóstico en el HTML
  function mostrarClimaConPronostico(data) {
    if (!data || !data.location || !data.current || !data.forecast) {
      showError('No se pudieron obtener datos del clima para esta ubicación.');
      return;
    }

    const { location, current, forecast } = data;

    // Estructura para clima actual
    const climaActual = `
      <div class="weather-today animate__animated animate__fadeInDown">
        <h2><i class="fas fa-map-marker-alt"></i> ${location.name}, ${location.country}</h2>
        <p><strong>Condición actual:</strong> ${current.condition.text} 
          <img src="${current.condition.icon}" alt="Clima actual" class="weather-icon-large">
        </p>
        <p><strong>Temperatura:</strong> ${current.temp_c}°C / ${current.temp_f}°F</p>
        <p><strong>Sensación térmica:</strong> ${current.feelslike_c}°C</p>
        <p><strong>Humedad:</strong> ${current.humidity}%</p>
        <p><strong>Viento:</strong> ${current.wind_kph} km/h (${current.wind_dir})</p>
        <p><small><i class="fas fa-clock"></i> Última actualización: ${location.localtime}</small></p>
      </div>
    `;

    // Construir pronóstico extendido para los próximos 3 días
    let pronosticoHTML = '<div class="forecast-container">';
    forecast.forecastday.forEach(day => {
      const fechaLegible = new Date(day.date).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long'
      });

      pronosticoHTML += `
        <div class="forecast-day animate__animated animate__fadeInUp">
          <p><strong>${fechaLegible}</strong></p>
          <img src="${day.day.condition.icon}" class="forecast-icon" alt="${day.day.condition.text}">
          <p>${day.day.condition.text}</p>
          <p>🌡️ Máx: ${day.day.maxtemp_c}°C / Mín: ${day.day.mintemp_c}°C</p>
          <p>💧 Humedad: ${day.day.avghumidity}%</p>
          <p>🌬️ Viento: ${day.day.maxwind_kph} km/h</p>
        </div>
      `;
    });
    pronosticoHTML += '</div>';

    // Actualizar contenedor con toda la info
    weatherResults.innerHTML = climaActual + pronosticoHTML;
  }

  // -----------------------
  // GEOLOCALIZACIÓN AUTOMÁTICA AL CARGAR
  // -----------------------

  async function obtenerClimaPorGeolocalizacion() {
    if (!('geolocation' in navigator)) return;

    weatherResults.innerHTML = `
      <p class="loading animate__animated animate__pulse">Detectando ubicación actual...</p>
    `;

    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      try {
        const data = await obtenerDatosClima(`${lat},${lon}`);
        if (data) mostrarClimaConPronostico(data);
      } catch {
        showError('No se pudo obtener el clima desde tu ubicación.');
      }
    }, error => {
      console.warn('No se pudo obtener la ubicación del usuario.', error);
      weatherResults.innerHTML = '';
    });
  }

  obtenerClimaPorGeolocalizacion();

});
