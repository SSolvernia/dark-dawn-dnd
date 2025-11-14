/**
 * Hook to load all Dark Dawn data JSON files
 * Loads the 5 core data files needed for Dark Dawn character sheet building
 */

import { useState, useEffect } from 'react';

const JSON_FILES = [
  'races',
  'factions',
  'deities',
  'classes',
  'special-abilities',
];

export function useDarkDawnData() {
  const [data, setData] = useState({
    races: null,
    factions: null,
    deities: null,
    classes: null,
    specialAbilities: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Load all JSON files in parallel
        const promises = JSON_FILES.map((filename) =>
          fetch(`/data/darkdawn/${filename}.json`).then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to load ${filename}.json`);
            }
            return res.json();
          })
        );

        const results = await Promise.all(promises);

        // Create object with all loaded data
        const loadedData = {
          races: results[0],
          factions: results[1],
          deities: results[2],
          classes: results[3],
          specialAbilities: results[4],
        };

        setData(loadedData);
        setError(null);
      } catch (err) {
        console.error('Error loading Dark Dawn data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { data, loading, error };
}
