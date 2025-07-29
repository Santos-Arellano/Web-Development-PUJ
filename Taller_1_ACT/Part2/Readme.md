FakeStore - Tienda Online
FakeStore is a modern, responsive e-commerce web application built with HTML, CSS, and JavaScript. It leverages the FakeStore API to display a product catalog, allows users to add products to a shopping cart, and includes a form for adding new products. The project features a sleek user interface with animations, notifications, and a mobile-friendly design.
Table of Contents

Features
Technologies
Project Structure
Installation
Usage
Contributing
License

Features

Product Catalog: Displays products fetched from the FakeStore API with details such as title, price, category, brand, and description.
Shopping Cart: Users can add products to the cart, update quantities, and remove items. The cart state persists using local storage.
Add New Products: A form allows users to add new products with validation for required fields (name, price, image URL, category, brand, description).
Responsive Design: Optimized for both desktop and mobile devices with media queries and flexible layouts.
Notification System: Displays success, error, warning, and info notifications with animations and auto-dismissal.
Loading States: Shows loading indicators during API calls and error messages if data fetching fails.
Global Event Handling: Includes keyboard shortcuts (e.g., Esc to close the cart, Ctrl+K to focus the form) and image error handling.
Animations: Smooth transitions and effects for product cards, cart dropdown, and notifications.

Technologies

HTML5: Structure of the web application.
CSS3: Styling with CSS custom properties, Flexbox, Grid, and animations. Uses Google Fonts (Inter, Poppins) and Tailwind-inspired styling.
JavaScript (ES6+): Handles dynamic functionality, API interactions, and DOM manipulation.
FakeStore API: Provides product data for the catalog.
Local Storage: Persists cart data across sessions.
Intersection Observer: Triggers animations for product cards when they enter the viewport.

Project Structure
FakeStore/
├── css/
│   └── styles.css        # Main stylesheet with variables, resets, and responsive design
├── js/
│   ├── carrito.js        # Shopping cart logic
│   ├── formulario.js     # Form handling and validation for adding products
│   ├── main.js           # Global initialization and event handling
│   ├── notificaciones.js # Notification system
│   └── productos.js      # Product fetching, rendering, and management
├── index.html            # Main HTML file
└── README.md             # Project documentation

Installation

Clone the Repository:
git clone https://github.com/Santos-Arellano/fakestore.git


Navigate to the Project Directory:
cd fakestore


Serve the Application:Since this is a static web application, you can serve it using a local development server. For example, using Python's HTTP server:
python -m http.server 8000

Alternatively, use any static file server or open index.html directly in a browser (note that some features, like the API fetch, may require a server due to CORS).

Access the Application:Open your browser and navigate to http://localhost:8000.


Usage

Browse Products: View the product catalog fetched from the FakeStore API. Products are displayed in a responsive grid with hover effects.
Add to Cart: Click the "Agregar al Carrito" button on any product card to add it to the cart. The cart dropdown shows the selected items, quantities, and total price.
Update Cart: Adjust quantities using the + and - buttons or remove items by setting the quantity to 0.
Add New Product: Fill out the form in the "Agregar Nuevo Artículo" section. All fields are validated, and errors are displayed in real-time.
Notifications: Success, error, warning, or info messages appear in the top-right corner for actions like adding products or form submissions.
Debugging: Use the debugTienda() function in the browser console to check the status of modules and loaded data.

Contributing
Contributions are welcome! To contribute:

Fork the repository.
Create a new branch (git checkout -b feature/your-feature).
Make your changes and commit (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a pull request.

Please ensure your code follows the existing style and includes appropriate comments.
License
This project is licensed under the MIT License. See the LICENSE file for details.