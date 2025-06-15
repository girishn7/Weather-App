import React, { useState } from 'react';
import axios from 'axios';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  const [location, setLocation] = useState('');
  const [forecast, setForecast] = useState([]);
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError('');
      setForecast([]);
      setCoords({ lat: null, lon: null });

      // Step 1: Get lat/lon using OpenCage
      const geoKey = process.env.REACT_APP_GEOCODING_API_KEY;
      const geoRes = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
          location
        )}&key=${geoKey}`
      );

      if (geoRes.data.results.length === 0) {
        throw new Error('Location not found');
      }

      const { lat, lng } = geoRes.data.results[0].geometry;
      setCoords({ lat, lon: lng });

      // Step 2: Get NWS forecast URL
      const pointRes = await axios.get(
        `https://api.weather.gov/points/${lat},${lng}`
      );
      const forecastUrl = pointRes.data.properties.forecastHourly;

      // Step 3: Fetch hourly forecast
      const forecastRes = await axios.get(forecastUrl);
      const hourly = forecastRes.data.properties.periods.slice(0, 12); // first 12 hours
      setForecast(hourly);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch weather. Please check the location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🌤️ U.S. Weather App (NWS)</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter U.S. City (e.g., Arlington, VA)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ padding: '10px', width: '300px' }}
        />
        <button onClick={fetchWeather} style={{ padding: '10px 20px', marginLeft: '10px' }}>
          Get Forecast
        </button>
      </div>

      {loading && <p>Loading forecast...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {forecast.length > 0 && (
        <div>
          <h2>Next 12 Hours Forecast:</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
            {forecast.map((period) => (
              <div
                key={period.number}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <h4>{new Date(period.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h4>
                <p>{period.temperature}°{period.temperatureUnit}</p>
                <p>{period.shortForecast}</p>
                <img src={period.icon} alt={period.shortForecast} width={40} />
              </div>
            ))}
          </div>
        </div>
      )}

      {coords.lat && coords.lon && (
        <div style={{ marginTop: '30px' }}>
          <h2>📍 Location Map</h2>
          <MapContainer
            center={[coords.lat, coords.lon]}
            zoom={10}
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[coords.lat, coords.lon]}>
              <Popup>
                Weather location: <strong>{location}</strong>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}

export default App;
