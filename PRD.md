1. Project Overview
Client requires a modern, scalable, and user-friendly e-commerce website enabling customers to browse products, register, place orders, track shipments. The system will include integrations for Indonesia-based payments and logistics providers, plus a custom Kurir Toko module.

2. Scope of Works (Detailed Requirements)
2.1 Website Structure & Content Pages
The website will include the following public-facing pages:
    2.1.1 Home Page
    •	Promotional banner slider.
    •	Featured categories & featured products.
    •	Quick links to promotions, testimonials, and catalogue.
    •	Mobile-optimized layout.
    2.1.2 About Page
    •	Company profile, mission, and background.
    •	Images and formatting included.
    2.1.3 Testimonials Page
    •	Customer testimonials displayed in carousel/list format.
    •	Admin-managed entries.
    2.1.4 Promotions Page
    •	Display of promo items, discount banners, time-limited offers.
    2.1.5 Online Product Catalogue
    •	Category-based browsing.
    •	Product list with images, description, SKU, stock visibility rules.
    •	Search and filter functions (price range, category, popularity, etc).
    2.1.6 Order Processing & Tracking
    •	Registered users can place orders.
    •	Checkout flow with address, shipping, and payment options.
    •	Order tracking page showing real-time status.
    •	Email notifications for each order stage.

2.2 Customer Registration & Account System
All users must register before they can place orders.
    2.2.1 Registration
    •	Name, email, mobile number.
    •	Address book (multiple addresses)
    2.2.2 Customer Dashboard
    •	View/edit profile.
    •	Order history.
    •	Download invoices.
    •	Track active orders.

2.3 Product Management
Accessible to Super Admin and Manager roles.
Features:
•	Create, edit, delete products.
•	Assign SKUs, product categories, pricing.
•	Manage images, product variations (if needed later).
•	Schedule promotions or apply discount rules.
•	Control product visibility and stock display rules.

2.4 Stock Management
Two methods will be provided:
    2.4.1 Batch/File Upload
    •	Upload CSV/Excel file containing SKU, stock level, pricing, status.
    •	System validates file format and notifies errors.
    2.4.2 Manual Adjustment Tools
    •	Update stock per SKU manually.
    •	Stock change logs visible to Super Admin only.

2.5 User Role Management
There are four types of users:
    2.5.1 Super Admin
    •	Full access to all settings, including plugins.
    •	Add/edit/disable users.
    •	Access system logs and advanced configurations.
    2.5.2 Manager
    •	Can add/edit/delete products.
    •	Can update stock.
    •	Can update orders (status, items etc).
    •	Can manage promotions.
    •	Cannot adjust system-level settings/plugins.
    2.5.3 Admin 
    •	Can view orders, stock, user registrations.
    •	Can update order status.
    •	Cannot edit or delete any setup.
    2.5.4 Customer
    •	Public user who registers to shop.
    •	Can order, cancel order and track shipments.

User Role Summary as follows:
=====================================================================================================================
Role	    |Permissions                                                |Restrictions
=====================================================================================================================
Super Admin	|Full access incl. system settings	                        |None
Manager	    |Edit products, orders, stock, promotions, generate reports	|Cannot change system-level settings/plugins
Admin	    |Edit order status, view products, users etc. 	            |No editing setup privileges
Customer	|Shop, order, track shipments	                            |Cannot access admin panel
=====================================================================================================================	

2.6 Shipping Integration
Shipping module integrates with:
•	Gojek (GoSend)
•	Grab (GrabExpress)
•	RajaOngkir
•	Expedition options (JNE, J&T, SiCepat - depending on plugin support)

2.7 Custom Shipping Module – Kurir Toko
A custom-built delivery option provided by the client.
Features:
•	System retrieves rate from GrabExpress API.
•	Internal formula is applied to produce a cheaper Kurir Toko rate.
•	Kurir Toko appears as a selectable shipping option during checkout.
•	Admin panel to adjust formula parameters:
o	Base fare
o	Discount %
o	Minimum charge
o	Custom surcharge
•	Price logs captured for audit purposes.


2.8 Admin & Manager Dashboard & Reporting
Dashboard features:
•	Today’s orders summary.
•	Low-stock alerts.
•	Quick links for product and order management.

Up to 10 generated report formats, including:
1.	Sales report by day/week/month.
2.	Order summary report.
3.	Pending orders.
4.	Cancelled/returned orders.
5.	Payment status report.
6.	Shipment cost report.
7.	Customer registration report.
8.	Best-selling product report.
9.	Stock shortage report.

Reports downloadable manually or scheduled to email.


3. Technical Requirements

Platform
• Menggunakan NodeJS (Dipisah Back-end & Front-end)
• Database : PostgreSQL

Performance Requirements
•	Website must load under 3 seconds on standard connections.
•	Cache optimization and image compression.
•	Mobile-responsive design.

Security
•	SSL mandatory.
•	User passwords encrypted.
•	Role-based access control.


4 Deliverables

•	Fully functional e-commerce website.
•	Integration with shipping providers.
•	Custom Kurir Toko shipping module.
•	Admin dashboard + report generator.
o	API integration notes (shipping)


5. Assumptions & Constraints
•	Client provides product data, SKU files, and promotional materials.
•	Shipping and payment plugins depend on third-party service uptime.
•	Client to provide Xendit Credentials for integration.

6. Acceptance Criteria
•	All modules functional as per above requirements.
•	No high-severity bugs at launch.
•	Website responsive on all major screen sizes.
•	Shipping rates calculate correctly, including Kurir Toko formula.
•	Payment flow is fully operational.
•	Reports download correctly.

