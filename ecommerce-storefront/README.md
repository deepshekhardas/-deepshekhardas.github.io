# E-Commerce Storefront

This is a frontend-only e-commerce storefront built with Next.js, TypeScript, and Tailwind CSS. It features a clean and modern UI, a full-featured shopping cart, and a mock checkout process.

## Features

- **Product Catalog:** Browse a catalog of products with advanced filtering and sorting options.
- **Product Detail Page:** View detailed information about each product, including a photo gallery, description, and specifications.
- **Shopping Cart:** Add items to your cart, update quantities, and remove items. The cart is persisted in `localStorage`.
- **Mock Checkout:** A frontend-only checkout process that includes an address form and a mock order confirmation.
- **Responsive Design:** The application is fully responsive and works great on all devices.
- **Accessibility:** The application is built with accessibility in mind, using semantic HTML and ARIA labels.

## Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context
- **API:** Mock API using Next.js API routes

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/ecommerce-storefront.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd ecommerce-storefront
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

To start the development server, run the following command:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

To build the application for production, run the following command:

```bash
npm run build
```

This will create an optimized build of the application in the `.next` directory.

### Running in Production Mode

To run the application in production mode, first build the application, then run the following command:

```bash
npm run start
```

## Known Limitations

- **No Backend:** This is a frontend-only application. The checkout process is a mock and does not actually process payments.
- **No User Accounts:** There is no user authentication or account management.
- **Unit Tests:** The unit test setup is currently broken due to dependency conflicts with Jest, React 19, and Next.js. This needs to be resolved to ensure code quality.

## Next Steps

- **Fix Unit Tests:** Resolve the issues with the Jest setup to enable unit testing.
- **Implement User Authentication:** Add user accounts to allow users to save their information and view their order history.
- **Connect to a Real Backend:** Replace the mock API with a real backend to process orders and manage products.
- **Expand Filtering and Sorting:** Add more advanced filtering and sorting options to the products page.
- **Add E2E Tests:** Implement end-to-end tests with Cypress or Playwright to ensure the application is working as expected.
- **Improve Performance:** Further optimize the application for performance, including code splitting and image optimization.
- **Add a Dark Mode:** Implement a dark mode toggle to improve the user experience in low-light environments.