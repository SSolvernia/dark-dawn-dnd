/**
 * Hook to load all D&D data JSON files
 * Loads the 9 core data files needed for character generation
 */

import { useState, useEffect } from 'react';

const JSON_FILES = [
  'backgrounds',
  'books',
  'cardsources',
  'classes',
  'life',
  'names',
  'npcs',
  'other',
  'races',
];

export function useCharacterData() {
  const [data, setData] = useState({
    backgrounds: null,
    books: null,
    cardsources: null,
    classes: null,
    life: null,
    names: null,
    npcs: null,
    other: null,
    races: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Load all JSON files in parallel
        const promises = JSON_FILES.map((filename) =>
          fetch(`/data/${filename}.json`).then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to load ${filename}.json`);
            }
            return res.json();
          })
        );

        const results = await Promise.all(promises);

        // Create object with all loaded data
        const loadedData = {};
        JSON_FILES.forEach((filename, index) => {
          loadedData[filename] = results[index];
        });

        setData(loadedData);
        setError(null);
      } catch (err) {
        console.error('Error loading character data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { data, loading, error };
}
