--sample data
INSERT INTO products (name, description, category, color, price, stock, image_url)
VALUES
('Classic White T-Shirt', 'Soft cotton everyday shirt', 'tops', 'white', 19.99, 25, 'images/shirt1.jpg'),
('Black Hoodie', 'Warm fleece hoodie', 'outerwear', 'black', 39.99, 15, 'images/hoodie1.jpg'),
('Blue Denim Jeans', 'Slim fit denim jeans', 'bottoms', 'blue', 49.99, 20, 'images/jeans1.jpg'),
('Red Flannel Shirt', 'Warm casual flannel', 'tops', 'red', 34.99, 10, 'images/flannel1.jpg');

-- Default Admin
INSERT INTO users (name, email, phone, password_hash, role)
VALUES (
  'Admin',
  'admin@shop.com',
  '000',
  'admin123',
  'admin'
);

-- Default Customer
INSERT INTO users (name, email, phone, password_hash, role)
VALUES (
  'DefUser',
  'user@shop.com',
  '111',
  'user123',
  'customer'
);