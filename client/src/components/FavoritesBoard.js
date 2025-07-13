import { useEffect, useState } from 'react';
import axios from '../utils/axios';

export default function FavoritesBoard() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    axios.get('/favorites')
      .then(res => setFavorites(res.data))
      .catch(err => console.error('Error fetching favorites:', err));
  }, []);

  return (
    <div>
      <h2>Your Favorites</h2>
      {favorites.length === 0 ? (
        <p>No favorites saved yet.</p>
      ) : (
        <ul>
          {favorites.map(fav => (
            <li key={fav.id}>
              <strong>{fav.type}</strong>: {fav.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
