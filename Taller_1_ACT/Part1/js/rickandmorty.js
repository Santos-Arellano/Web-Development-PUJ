// Este script carga y muestra personajes de la Rick and Morty API
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('rickmorty-list');
    if (!container) return;
  
    // Llama a la API y muestra los primeros 6 personajes
    fetch('https://rickandmortyapi.com/api/character/?page=1')
      .then(res => res.json())
      .then(data => {
        data.results.slice(0, 6).forEach(personaje => {
          const card = document.createElement('div');
          card.className = 'rickmorty-card';
          card.innerHTML = `
            <img src="${personaje.image}" alt="${personaje.name}">
            <h4>${personaje.name}</h4>
            <p>${personaje.species}</p>
            <p>${personaje.status}</p>
          `;
          container.appendChild(card);
        });
      })
      .catch(err => {
        container.innerHTML = '<p>No se pudieron cargar los personajes.</p>';
      });
  });