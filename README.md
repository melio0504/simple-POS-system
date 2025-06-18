# Simple POS System

A simple Point of Sale (POS) system with inventory management built using basic web technologies. This project demonstrates a straightforward implementation of a POS system suitable for small businesses.

## Tech Stack

- HTML - Structure and layout
- CSS - Styling and responsiveness
- JavaScript - Client-side functionality
- PHP - Server-side processing
- MySQL - Database management

## Features

- Point of Sale interface
- Real-time inventory management
- Product search functionality
- Receipt generation and printing
- Sales tracking
- Low stock alerts
- Basic customer information management

## Screenshots

![Screenshot-1](/assets/screenshot-1.png)
![Screenshot-2](/assets/screenshot-2.png)

## Prerequisites

Before you begin, ensure you have the following installed:
- [XAMPP](https://www.apachefriends.org/download.html) (includes Apache, MySQL, and PHP)
- A modern web browser
- Git (optional, for cloning)

## Installation & Setup

1. **Install XAMPP**
   - Download and install XAMPP from the official website
   - Start the Apache and MySQL services from XAMPP Control Panel

2. **Set Up the Project**
   ```bash
   # Clone the repository (or download and extract the ZIP file)
   git clone https://github.com/yourusername/simple_POS_system.git
   
   # Move the project to XAMPP's htdocs folder
   # For Windows: C:\xampp\htdocs\
   # For Linux: /opt/lampp/htdocs/
   # For macOS: /Applications/XAMPP/htdocs/

3. **Set Up the Database**

- Open phpMyAdmin (usually at http://localhost/phpmyadmin)
- Create a new database named pos_inventory
- Import the database structure (SQL file provided in the project)

```
CREATE DATABASE IF NOT EXISTS pos_inventory;
USE pos_inventory;

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    sold INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100),
    customer_id VARCHAR(50),
    sale_type ENUM('delivery', 'pickup') NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    cash DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sample products
INSERT INTO products (name, price, quantity) VALUES 
('Laptop', 999.99, 10),
('Smartphone', 599.99, 15),
('Headphones', 99.99, 20),
('Mouse', 19.99, 5),
('Keyboard', 49.99, 8);
```

4. **Configure Database Connection**

- Open php/db_connect.php
- Update the database credentials if needed:

```db_connect.php
<?php
$host = 'localhost';
$db   = 'pos_inventory';
$user = 'root';
$pass = '';
```

5. **Running the Application**

- Start XAMPP and ensure Apache and MySQL services are running
- Open your web browser and navigate to:

```
http://localhost/simple_POS_system/
```

- The POS system should now be accessible with full functionality

## License
This project is licensed under the MIT License - see the LICENSE file for details